/**
 * Detect low-end devices and enable performance mode automatically.
 * Heuristics: deviceMemory <=4GB, hardwareConcurrency <=4 cores, or user prefers-reduced-motion.
 * Adds `html.reduce-motion` (existing CSS already strips animations) and `html.low-end`.
 */

export function detectLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  // 1) Honor OS-level reduced-motion preference.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;

  // 2) Hardware heuristics — Chrome on Android exposes these.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency;

  if (typeof mem === "number" && mem > 0 && mem <= 3) return true;
  if (typeof cores === "number" && cores > 0 && cores <= 4 && (mem ?? 99) <= 4) return true;

  // 3) Slow effective connection
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && /^(slow-2g|2g|3g)$/.test(conn.effectiveType)) return true;

  return false;
}

export function applyPerformanceMode() {
  if (typeof document === "undefined") return;
  const html = document.documentElement;

  // Manual override from AppMenu always wins.
  const manual = localStorage.getItem("a11y_reduce") === "1";
  const low = manual || detectLowEndDevice();

  if (low) {
    html.classList.add("reduce-motion", "low-end");
  } else {
    html.classList.remove("low-end");
  }
}
