/**
 * Detects low-end devices / user motion preferences and toggles `low-end`
 * and `reduce-motion` classes on <html>. Heavy CSS (blur, shadows, accordion
 * height tweens) is then skipped via index.css rules — open/close becomes
 * instant on weak hardware while staying smooth on capable devices.
 */
export function applyPerfFlags() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const html = document.documentElement;

  // Reduce-motion preference (live updates if the user toggles OS setting)
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const setReduce = () => html.classList.toggle("reduce-motion", mq.matches);
  setReduce();
  mq.addEventListener?.("change", setReduce);

  // Heuristic for low-end: few logical cores, low memory, slow connection,
  // or coarse pointer + low DPR (typical of budget phones).
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const cores = nav.hardwareConcurrency ?? 8;
  const mem = nav.deviceMemory ?? 8;
  const saveData = !!nav.connection?.saveData;
  const slowNet = ["slow-2g", "2g", "3g"].includes(nav.connection?.effectiveType ?? "");
  const lowEnd = cores <= 4 || mem <= 4 || saveData || slowNet;
  html.classList.toggle("low-end", lowEnd);
}
