import { motion } from "framer-motion";
import { HelpCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { buildHighlightRegex, highlightText } from "@/lib/highlight";
import { useMemo } from "react";

export interface McqSearchResult {
  id: string;
  external_id: string | null;
  topic: string;
  difficulty: string;
  stem: string;
  explanation: string;
}

interface Props {
  results: McqSearchResult[];
  query: string;
}

/**
 * Compact search-results section for MCQ exam questions. Shown below scenario
 * results on the home search so the user can also reach the question bank
 * without leaving the page.
 */
export function McqSearchSection({ results, query }: Props) {
  const hl = useMemo(() => buildHighlightRegex(query), [query]);
  if (!results.length) return null;

  return (
    <section className="mt-5">
      <header className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-white">
            <HelpCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
          </span>
          <h3 className="text-[13px] font-black text-foreground leading-tight">
            Exam questions
          </h3>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded-full font-bold tabular-nums">
            {results.length}
          </span>
        </div>
        <Link
          to="/exams"
          className="text-[10px] font-black uppercase tracking-[0.14em] text-primary hover:underline"
        >
          Open bank →
        </Link>
      </header>
      <div className="space-y-2">
        {results.map((m, idx) => (
          <motion.article
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.02, 0.12), duration: 0.22 }}
            className="rounded-xl border border-border/70 bg-card p-3"
          >
            <Link
              to="/exams"
              className="block group"
              aria-label={`Open exam question: ${m.stem.slice(0, 80)}`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black tabular-nums border border-emerald-500/25">
                  Q
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                      {m.topic}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/60">
                      {m.difficulty}
                    </span>
                  </div>
                  <p className="text-[12.5px] font-semibold text-foreground leading-snug break-words line-clamp-3">
                    {highlightText(m.stem, hl)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
