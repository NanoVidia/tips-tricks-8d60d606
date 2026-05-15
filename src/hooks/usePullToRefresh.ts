import { useEffect, useRef, useState } from "react";

/**
 * Pull-to-refresh احترافي لـ Capacitor WebView.
 *  - يستخدم منحنى مقاومة (resistance) كي يصبح السحب أصعب تدريجياً.
 *  - يهتز الجهاز خفيفاً عند بلوغ عتبة التحديث (تأكيد لمسي).
 *  - يمنع التداخل مع التمرير الداخلي للصفحة.
 */
export function usePullToRefresh(onRefresh: () => void | Promise<void>, threshold = 80) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const reachedThreshold = useRef(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      reachedThreshold.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPullDistance(0);
        return;
      }
      // منحنى مقاومة لوغاريتمي — يصبح السحب أثقل
      const resisted = Math.min(threshold * 1.6, threshold * (1 - Math.exp(-dy / (threshold * 1.4))) * 1.6);
      setPullDistance(resisted);

      // اهتزاز خفيف عند الوصول للعتبة لأول مرة
      if (!reachedThreshold.current && resisted >= threshold) {
        reachedThreshold.current = true;
        try {
          if ("vibrate" in navigator) navigator.vibrate(15);
        } catch { /* ignore */ }
      }
    };

    const onTouchEnd = async () => {
      if (startY.current == null) return;
      const dist = pullDistance;
      startY.current = null;
      if (dist >= threshold) {
        setRefreshing(true);
        try { await onRefresh(); } finally {
          setTimeout(() => { setRefreshing(false); setPullDistance(0); }, 500);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [onRefresh, pullDistance, refreshing, threshold]);

  return { pullDistance, refreshing, threshold };
}
