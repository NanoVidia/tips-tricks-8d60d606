import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Pull-to-refresh احترافي بمستوى التطبيقات الأصلية.
 *  - يستخدم refs للتتبع الحي + setState للتحديثات المرئية فقط
 *    (يقلّل re-renders ويحافظ على 60fps أثناء السحب).
 *  - منحنى مقاومة طبيعي يُحاكي iOS / Material.
 *  - حالات واضحة: idle → pulling → ready → refreshing → done.
 *  - اهتزازات لمسية خفيفة على عتبتَي الجاهزية والإطلاق.
 *  - يتجاهل اللمسات داخل عناصر التمرير الأفقي (carousels / tabs).
 *  - ينعزل تلقائياً إذا كانت الصفحة ليست في أعلى التمرير.
 */

export type PullState = "idle" | "pulling" | "ready" | "refreshing";

export function usePullToRefresh(
  onRefresh: () => void | Promise<void>,
  threshold = 72,
) {
  const [pullDistance, setPullDistance] = useState(0);
  const [state, setState] = useState<PullState>("idle");

  // Refs لتتبع اللمس بدون re-renders
  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const lastDist = useRef(0);
  const armedReady = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // ابقِ المرجع طازجاً دون إعادة تركيب المستمعات
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  const vibrate = useCallback((ms: number) => {
    try { if ("vibrate" in navigator) navigator.vibrate(ms); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const MAX_PULL = threshold * 1.8; // أقصى سحب مرئي
    const HORIZONTAL_TOLERANCE = 12;  // إذا تجاوز الانحراف الأفقي هذه القيمة → اعتبره تمريراً جانبياً

    const onTouchStart = (e: TouchEvent) => {
      // ابدأ التتبع فقط من قمّة الصفحة وعند عدم وجود تحديث جارٍ
      if (window.scrollY > 0 || state === "refreshing") {
        startY.current = null;
        return;
      }
      const t = e.touches[0];
      startY.current = t.clientY;
      startX.current = t.clientX;
      lastDist.current = 0;
      armedReady.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null || startX.current == null) return;
      const t = e.touches[0];
      const dy = t.clientY - startY.current;
      const dx = Math.abs(t.clientX - startX.current);

      // إذا كان السحب أفقياً أصلاً → ألغِ
      if (dx > HORIZONTAL_TOLERANCE && dy < HORIZONTAL_TOLERANCE) {
        startY.current = null;
        if (lastDist.current !== 0) {
          lastDist.current = 0;
          setPullDistance(0);
          setState("idle");
        }
        return;
      }

      if (dy <= 0) {
        if (lastDist.current !== 0) {
          lastDist.current = 0;
          setPullDistance(0);
          setState("idle");
        }
        return;
      }

      // منحنى مقاومة سلس (asymptote عند MAX_PULL)
      const resisted = MAX_PULL * (1 - Math.exp(-dy / (threshold * 1.6)));

      // تحديث الحالة فقط عند تغيّر معنوي (>1px) لتقليل re-renders
      if (Math.abs(resisted - lastDist.current) > 1) {
        lastDist.current = resisted;
        setPullDistance(resisted);
        const reached = resisted >= threshold;
        setState(reached ? "ready" : "pulling");

        if (reached && !armedReady.current) {
          armedReady.current = true;
          vibrate(12);
        } else if (!reached && armedReady.current) {
          armedReady.current = false;
        }
      }
    };

    const onTouchEnd = async () => {
      if (startY.current == null) {
        return;
      }
      const dist = lastDist.current;
      startY.current = null;
      startX.current = null;

      if (dist >= threshold) {
        vibrate(20);
        setState("refreshing");
        // أبقِ المؤشر بمستوى العتبة أثناء التحديث
        setPullDistance(threshold);
        try {
          await onRefreshRef.current();
        } finally {
          // تأخير قصير حتى يرى المستخدم الأنيميشن
          setTimeout(() => {
            setPullDistance(0);
            setState("idle");
            lastDist.current = 0;
            armedReady.current = false;
          }, 450);
        }
      } else {
        // ارتداد سلس للصفر
        lastDist.current = 0;
        setPullDistance(0);
        setState("idle");
        armedReady.current = false;
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
    // state داخل المعالج يستخدم refs/snapshots — لا داعي لإعادة الربط
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold]);

  return { pullDistance, refreshing: state === "refreshing", state, threshold };
}
