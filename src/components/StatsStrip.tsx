import { motion } from "framer-motion";
import { CountUp } from "./CountUp";

interface StatsStripProps {
  total: number;
  byCategory: Record<string, number>;
}

/**
 * Editorial stats strip — masonry-style numerals with serif display, designed
 * to evoke a magazine masthead. Each tile auto-counts when it enters the viewport.
 */
export function StatsStrip({ total, byCategory }: StatsStripProps) {
  const stats = [
    { value: total, label: "Curated scenarios", accent: false },
    { value: byCategory.qa ?? 0, label: "Q&A bank", accent: true },
    { value: byCategory.or_labor ?? 0, label: "OR & labor", accent: false },
    { value: 7, label: "Calculators", accent: false },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mt-5 mb-6"
      aria-label="Library statistics"
    >
      <div className="grid grid-cols-4 gap-2 px-1">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`relative rounded-xl px-2 py-3 text-center border transition-colors ${
              s.accent
                ? "bg-gold-soft border-gold/30"
                : "bg-card border-border/50"
            }`}
          >
            <CountUp
              to={s.value}
              className={`block font-editorial text-2xl font-bold leading-none ${
                s.accent ? "text-foreground" : "text-foreground"
              }`}
              suffix={i === 0 ? "+" : ""}
            />
            <span className="block eyebrow text-muted-foreground mt-1.5 leading-tight text-[9px]">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
