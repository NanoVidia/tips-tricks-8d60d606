import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Check, X, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { springTransition } from "@/lib/motion";

interface Mcq {
  id: string;
  topic: string;
  difficulty: string;
  stem: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

/** Deterministic daily seed from YYYYMMDD. */
function dailyOffset(modulo: number) {
  if (modulo <= 0) return 0;
  const d = new Date();
  return (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) % modulo;
}

/**
 * Today's MCQ — picks one active MCQ deterministically per day, lets the
 * user answer inline with instant feedback + explanation reveal.
 */
export function DailyMcqWidget() {
  const [mcq, setMcq] = useState<Mcq | null>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { count } = await supabase
          .from("mcq_questions")
          .select("*", { count: "exact", head: true })
          .eq("active", true);
        const total = count ?? 0;
        if (!total) return;
        const offset = dailyOffset(total);
        const { data, error } = await supabase
          .from("mcq_questions")
          .select("id, topic, difficulty, stem, options, answer_index, explanation")
          .eq("active", true)
          .order("id")
          .range(offset, offset);
        if (cancelled) return;
        if (error) throw error;
        if (data && data[0]) setMcq(data[0] as Mcq);
      } catch (e) {
        console.error("Daily MCQ:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-4 bg-card border border-border/60 flex items-center gap-2 text-muted-foreground text-[12px]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading today’s question…
      </div>
    );
  }
  if (!mcq) return null;

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    setTimeout(() => setRevealed(true), 250);
  };

  return (
    <motion.section
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springTransition}
      aria-label="Today's question"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-violet-950 to-indigo-900 border border-violet-500/30 shadow-lg shadow-violet-900/30"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />

      <div className="relative p-3.5">
        <div className="flex items-start justify-between mb-3.5 gap-2">
          <div className="flex items-start gap-1.5 min-w-0">
            <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-violet-500/25 ring-1 ring-violet-400/40">
              <Brain className="w-3.5 h-3.5 text-violet-200" />
            </span>
            <span className="text-[13px] font-black uppercase tracking-[0.18em] text-violet-100 leading-[1.2] pt-0.5">
              Today's MCQ
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end pt-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-violet-200/80 leading-[1.25]">
              {mcq.topic}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-100 border border-violet-400/30">
              {mcq.difficulty}
            </span>
          </div>
        </div>

        <p className="text-white text-[12.5px] font-semibold leading-snug mb-2.5">
          {mcq.stem}
        </p>

        <div className="space-y-1.5">
          {mcq.options.map((opt, i) => {
            const isPicked = picked === i;
            const isCorrect = i === mcq.answer_index;
            const showState = revealed && (isPicked || isCorrect);
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                disabled={picked !== null}
                className={`w-full text-left flex items-start gap-2 px-2.5 py-2 rounded-lg text-[11.5px] leading-snug transition-all duration-200 ${
                  showState && isCorrect
                    ? "bg-emerald-500/25 ring-1 ring-emerald-400 text-emerald-50"
                    : showState && isPicked && !isCorrect
                    ? "bg-red-500/25 ring-1 ring-red-400 text-red-50"
                    : isPicked
                    ? "bg-white/15 ring-1 ring-white/30 text-white"
                    : "bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-white/90 disabled:opacity-60"
                }`}
              >
                <span
                  className={`shrink-0 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center mt-0.5 ${
                    showState && isCorrect
                      ? "bg-emerald-400 text-emerald-950"
                      : showState && isPicked && !isCorrect
                      ? "bg-red-400 text-red-950"
                      : "bg-white/15 text-white"
                  }`}
                >
                  {showState && isCorrect ? <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    : showState && isPicked && !isCorrect ? <X className="w-2.5 h-2.5" strokeWidth={3} />
                    : String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 min-w-0">{opt}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-2.5 overflow-hidden"
            >
              <div className="rounded-lg bg-white/8 ring-1 ring-white/15 p-2.5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-200 mb-1">
                  Explanation
                </p>
                <p className="text-white/90 text-[11.5px] leading-snug">{mcq.explanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-2.5 flex items-center justify-between">
          <Link
            to="/exams"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-100 hover:text-white transition-colors"
          >
            More questions
            <ArrowRight className="w-3 h-3" />
          </Link>
          {picked !== null && (
            <button
              type="button"
              onClick={() => { setPicked(null); setRevealed(false); }}
              className="text-[10px] font-bold text-violet-200/80 hover:text-white transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}
