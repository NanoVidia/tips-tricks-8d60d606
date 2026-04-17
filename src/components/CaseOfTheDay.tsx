import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DailyCase {
  id: string;
  title_en: string;
  situation_en: string;
  category: "clinic" | "or_labor" | "behavior" | "qa";
}

/** Deterministic daily index from the date — same case for everyone, every day. */
function dayIndex(modulo: number): number {
  if (modulo <= 0) return 0;
  const today = new Date();
  // YYYYMMDD as a stable seed
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % modulo;
}

const categoryLabel: Record<DailyCase["category"], string> = {
  clinic: "Clinic",
  or_labor: "OR / Labor",
  behavior: "Communication",
  qa: "Q&A",
};

/**
 * Case of the Day — pulls one scenario keyed by today's date (deterministic).
 * Designed in editorial-magazine style: gold eyebrow, serif headline, ink CTA.
 */
export function CaseOfTheDay({ onOpen }: { onOpen: (c: DailyCase) => void }) {
  const [caseData, setCaseData] = useState<DailyCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Read just enough to compute deterministic index without pulling everything.
        const { count } = await supabase
          .from("medical_scenarios")
          .select("*", { count: "exact", head: true });
        const total = count ?? 0;
        if (!total) return;

        const offset = dayIndex(total);
        const { data, error } = await supabase
          .from("medical_scenarios")
          .select("id, title_en, situation_en, category")
          .order("id")
          .range(offset, offset);

        if (cancelled) return;
        if (error) throw error;
        if (data && data[0]) setCaseData(data[0] as DailyCase);
      } catch (e) {
        console.error("Case of the Day error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-4 mb-6 animate-pulse">
        <div className="h-2.5 w-24 bg-muted rounded mb-3" />
        <div className="h-5 w-3/4 bg-muted rounded mb-2" />
        <div className="h-3 w-full bg-muted rounded" />
      </div>
    );
  }

  if (!caseData) return null;

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(caseData)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className="group relative w-full text-left rounded-2xl overflow-hidden border border-border/60 bg-card hover:border-gold/40 transition-colors shadow-editorial mb-6"
      aria-label={`Open today's case: ${caseData.title_en}`}
    >
      {/* Gold corner ribbon */}
      <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none" aria-hidden="true">
        <div className="absolute top-3 right-[-32px] rotate-45 gradient-gold text-[8px] font-black uppercase tracking-[0.2em] text-primary-foreground py-1 px-10 shadow-gold/40 shadow-md">
          Today
        </div>
      </div>

      <div className="p-4 pt-5">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3 h-3 text-gold" />
          <span className="eyebrow text-gold">Case of the Day · {categoryLabel[caseData.category]}</span>
        </div>

        <h3 className="font-editorial text-lg font-bold leading-snug text-foreground mb-2 pr-16 group-hover:text-primary transition-colors">
          {caseData.title_en}
        </h3>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {caseData.situation_en}
        </p>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider">
          <BookOpen className="w-3 h-3" />
          Read & discuss
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.button>
  );
}
