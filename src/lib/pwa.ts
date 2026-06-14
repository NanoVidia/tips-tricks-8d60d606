// Guarded service worker registration.
// Skips registration in Lovable preview, dev, iframes, and when ?sw=off is set.
// In any refused context, also unregisters any existing /sw.js to avoid stale shells.

const SW_PATH = "/sw.js";

function isRefusedContext(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;

  try {
    if (window.top !== window.self) return true; // iframe (Lovable editor preview)
  } catch {
    return true;
  }

  const host = window.location.hostname;
  const refusedHost =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");
  if (refusedHost) return true;

  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;

  return false;
}

async function unregisterAppShellWorkers(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => r.active?.scriptURL?.endsWith(SW_PATH) || r.installing?.scriptURL?.endsWith(SW_PATH) || r.waiting?.scriptURL?.endsWith(SW_PATH))
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

export function registerServiceWorker(): void {
  if (isRefusedContext()) {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      void unregisterAppShellWorkers();
    }
    return;
  }

  // Defer registration to idle so it never blocks first paint.
  const start = () => {
    navigator.serviceWorker
      .register(SW_PATH, { scope: "/" })
      .catch((err) => console.warn("[pwa] SW registration failed", err));
  };

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

export async function isOfflineReady(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  return !!reg?.active;
}
