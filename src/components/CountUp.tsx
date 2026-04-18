import { useEffect, useRef, useState } from "react";

const numberFormatter = new Intl.NumberFormat("en-US-u-nu-latn");

/** Lightweight count-up that respects prefers-reduced-motion and starts when scrolled into view. */
export function CountUp({
  to,
  duration = 1400,
  className = "",
  suffix = "",
  prefix = "",
}: {
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) { setValue(to); return; }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started.current && to > 0) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              // easeOutCubic for a refined feel
              const eased = 1 - Math.pow(1 - t, 3);
              setValue(Math.round(to * eased));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`} aria-label={`${prefix}${to}${suffix}`}>
      {prefix}{numberFormatter.format(value)}{suffix}
    </span>
  );
}
