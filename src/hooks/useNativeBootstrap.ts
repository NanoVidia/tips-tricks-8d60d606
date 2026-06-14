// Native-only bootstrap: status bar styling + hardware back button handling.
// No-ops on web. Imported once from App.tsx.

import { useEffect, useRef } from "react";

export function useNativeBootstrap() {
  const lastBackPress = useRef(0);

  useEffect(() => {
    let appListener: { remove: () => void } | null = null;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core").catch(() => ({ Capacitor: null as any }));
        if (!Capacitor?.isNativePlatform?.()) return;

        // --- Status bar (Android 15 edge-to-edge friendly) ---
        try {
          const { StatusBar, Style } = await import("@capacitor/status-bar");
          await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
          await StatusBar.setStyle({ style: Style.Default }).catch(() => {});
          await StatusBar.setBackgroundColor({ color: "#ffffff" }).catch(() => {});
        } catch { /* plugin not installed in this build */ }

        // --- Hardware back button: double-tap to exit on root pages ---
        try {
          const { App } = await import("@capacitor/app");
          const handle = await App.addListener("backButton", ({ canGoBack }) => {
            if (canGoBack && window.history.length > 1) {
              window.history.back();
              return;
            }
            const now = Date.now();
            if (now - lastBackPress.current < 2000) {
              App.exitApp();
            } else {
              lastBackPress.current = now;
              // Tiny toast — uses sonner if available, else native-ish overlay.
              import("sonner")
                .then(({ toast }) => toast("اضغط مرة أخرى للخروج"))
                .catch(() => {});
            }
          });
          appListener = handle;
        } catch { /* App plugin not available */ }
      } catch (err) {
        console.warn("[native-bootstrap] failed", err);
      }
    })();

    return () => {
      appListener?.remove?.();
    };
  }, []);
}
