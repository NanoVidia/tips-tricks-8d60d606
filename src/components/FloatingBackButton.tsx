import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const LAST_TAB_KEY = "nav:last-tab";
const HISTORY_DEPTH_KEY = "nav:depth-at-entry";

/**
 * Global floating back button. Renders on every route EXCEPT the home page
 * and the disclaimer splash.
 *
 * Back behaviour:
 *  1. Prefer real browser history (`navigate(-1)`) when the user has navigated
 *     within the app since opening it (tracked via sessionStorage so we don't
 *     trust the global `history.length` which counts cross-origin entries).
 *  2. Otherwise fall back to the last visited top-level tab (persisted in
 *     localStorage), so a user landing directly on a deep link still returns
 *     to a familiar place.
 *  3. Final fallback: navigate to "/".
 */
export function FloatingBackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const entryDepthRef = useRef<number | null>(null);

  // Capture the history length at the moment the app first mounts, so we can
  // tell later whether the user has accumulated in-app history.
  useEffect(() => {
    const stored = sessionStorage.getItem(HISTORY_DEPTH_KEY);
    if (stored === null) {
      sessionStorage.setItem(HISTORY_DEPTH_KEY, String(window.history.length));
      entryDepthRef.current = window.history.length;
    } else {
      entryDepthRef.current = Number(stored);
    }
  }, []);

  // Remember the most recently visited "tab" (top-level path segment) so we
  // can return to it when there is no usable history.
  useEffect(() => {
    const isTopLevel = pathname === "/" || /^\/[^/]+\/?$/.test(pathname);
    const isExcluded =
      pathname.startsWith("/disclaimer") || pathname.startsWith("/menu");
    if (isTopLevel && !isExcluded) {
      localStorage.setItem(LAST_TAB_KEY, pathname);
    }
  }, [pathname]);

  const hidden =
    pathname === "/" ||
    pathname === "/index" ||
    pathname.startsWith("/disclaimer");

  if (hidden) return null;

  const handleBack = () => {
    const entryDepth = entryDepthRef.current ?? window.history.length;
    const hasInAppHistory = window.history.length > entryDepth;

    if (hasInAppHistory) {
      navigate(-1);
      return;
    }

    const lastTab = localStorage.getItem(LAST_TAB_KEY);
    if (lastTab && lastTab !== pathname) {
      navigate(lastTab);
      return;
    }

    navigate("/");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-md backdrop-blur transition-all hover:bg-muted active:scale-95"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.6rem)" }}
    >
      <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
    </button>
  );
}
