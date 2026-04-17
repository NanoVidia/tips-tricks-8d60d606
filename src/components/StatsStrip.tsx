import { motion } from "framer-motion";
import { CountUp } from "./CountUp";

interface StatsStripProps {
  total: number;
  byCategory: Record<string, number>;
}

/**
 * Editorial stats strip — 2×2 on mobile (so numerals never clip),
 * 4-up from sm: upward. Numerals use tabular-nums + clamp sizing.
 */
export function StatsStrip({ total, byCategory }: StatsStripProps) {
  const stats = [
    { value: total, label: "Curated scenarios", suffix: "+", accent: false },
    { value: byCategory.qa ?? 0, label: "Q&A bank", suffix: "", accent: true },
    { value: byCategory.or_labor ?? 0, label: "OR & labor", suffix: "", accent: false },
    { value: 7, label: "Calculators", suffix: "", accent: false },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Library statistics"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`relative rounded-xl px-3 py-4 border transition-colors overflow-hidden flex flex-col items-center justify-center min-h-[88px] ${
              s.accent
                ? "bg-gold-soft border-gold/30"
                : "bg-card border-border/50"
            }`}
          >
            <CountUp
              to={s.value}
              suffix={s.suffix}
              className="block font-editorial font-bold leading-none text-foreground tabular-nums tracking-tight text-[clamp(1.25rem,7vw,1.75rem)] max-w-full truncate"
            />
            <span className="block eyebrow text-muted-foreground mt-2 leading-tight text-[9px] text-center">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
