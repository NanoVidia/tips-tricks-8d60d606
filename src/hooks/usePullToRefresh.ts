import { useEffect, useRef, useState } from "react";

/**
 * Lightweight pull-to-refresh for Capacitor WebView / mobile browsers.
 * Triggers `onRefresh` when the user drags down >= threshold from scrollTop=0.
 */
export function usePullToRefresh(onRefresh: () => void | Promise<void>, threshold = 70) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        setPullDistance(Math.min(dy * 0.5, threshold * 1.5));
      }
    };
    const onTouchEnd = async () => {
      if (startY.current == null) return;
      startY.current = null;
      if (pullDistance >= threshold) {
        setRefreshing(true);
        try { await onRefresh(); } finally {
          setTimeout(() => { setRefreshing(false); setPullDistance(0); }, 400);
        }
      } else {
        setPullDistance(0);
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, pullDistance, refreshing, threshold]);

  return { pullDistance, refreshing, threshold };
}
