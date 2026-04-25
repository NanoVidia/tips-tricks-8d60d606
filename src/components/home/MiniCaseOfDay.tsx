import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { springTransition } from "@/lib/motion";

interface DailyCase {
  id: string;
  title_en: string;
  situation_en: string;
  category: "clinic" | "or_labor" | "behavior" | "qa";
}

function dailyOffset(modulo: number) {
  if (modulo <= 0) return 0;
  const d = new Date();
  return (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) % modulo;
}

const CAT_LABEL: Record<DailyCase["category"], string> = {
  clinic: "Clinic", or_labor: "OR / Labor", behavior: "Communication", qa: "Q&A",
};

interface Props {
  onOpen: (c: DailyCase) => void;
  textScale?: { section: string; sub: string; card: string; hint: string };
}

/** Compact "Case of the day" card — opens the scenario sheet on tap. */
export function MiniCaseOfDay({ onOpen, textScale }: Props) {
  const scale = textScale ?? { section: "text-[13px]", sub: "text-[10.5px]", card: "text-[13px]", hint: "text-[11px]" };
  const [c, setC] = useState<DailyCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { count } = await supabase
          .from("medical_scenarios")
          .select("*", { count: "exact", head: true });
        const total = count ?? 0;
        if (!total) return;
        const offset = dailyOffset(total);
        const { data, error } = await supabase
          .from("medical_scenarios")
          .select("id, title_en, situation_en, category")
          .order("id")
          .range(offset, offset);
        if (cancelled) return;
        if (error) throw error;
        if (data && data[0]) setC(data[0] as DailyCase);
      } catch (e) {
        console.error("MiniCase:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-3.5 bg-card border border-border/60 flex items-center gap-2 text-muted-foreground text-[12px]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading today’s case…
      </div>
    );
  }
  if (!c) return null;

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(c)}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springTransition}
      whileTap={{ scale: 0.98 }}
      className="relative w-full overflow-hidden rounded-2xl p-3.5 text-left bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-amber-900/30 border border-amber-300/60 dark:border-amber-700/40 hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
      aria-label={`Open today's case: ${c.title_en}`}
    >
      <div className="absolute -bottom-3 -right-3 w-20 h-20 opacity-10 pointer-events-none" aria-hidden="true">
        <BookOpen className="w-full h-full text-amber-700" />
      </div>

      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 ring-1 ring-amber-500/40 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5 flex-wrap mb-2">
            <span className={`${scale.section} font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300 leading-[1.2]`}>
              Case of the Day
            </span>
            <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
              {CAT_LABEL[c.category]}
            </span>
          </div>
          <p className={`text-foreground font-bold ${scale.card} leading-[1.35] break-words`}>
            {c.title_en}
          </p>
          <p className={`text-muted-foreground ${scale.hint} leading-[1.4] mt-1.5 line-clamp-2`}>
            {c.situation_en}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0 mt-1.5" />
      </div>
    </motion.button>
  );
}
