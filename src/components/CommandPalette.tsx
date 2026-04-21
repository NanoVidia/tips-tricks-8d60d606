import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, ChevronRight, Command as CmdIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { springTransition, TRANSITION_CLASS } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useActivityTracker, type TabId } from "@/hooks/useActivityTracker";

interface Scenario {
  id: string;
  category: TabId;
  title_en: string;
  situation_en: string;
  action_en: string;
  script_en: string;
  synonyms: string[] | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Open a scenario sheet from the host page. */
  onSelect: (scenario: Scenario) => void;
}

const TAB_LABEL: Record<TabId, string> = {
  qa: "Q&A", clinic: "Clinic", or_labor: "OR / Labor", behavior: "Behavior",
};

/**
 * Global ⌘K / Ctrl+K command palette — searches medical_scenarios across all
 * categories, ranked by token weights, with keyboard navigation + a11y.
 */
export function CommandPalette({ open, onOpenChange, onSelect }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setLastSearch, setLastScenario } = useActivityTracker();

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Auto-focus + reset on open
  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setHighlight(0);
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Debounced global search
  useEffect(() => {
    if (!open) return;
    const query = q.trim();
    if (query.length < 2) { setResults([]); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("search_scenarios", { search_query: query });
        if (cancelled) return;
        if (error) throw error;
        const raw = (data as Scenario[]) || [];

        // Relevance ranking — title >> synonyms > situation > action
        const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
        const score = (s: Scenario) => {
          const title = (s.title_en || "").toLowerCase();
          const sit = (s.situation_en || "").toLowerCase();
          const act = (s.action_en || "").toLowerCase();
          const syn = (s.synonyms || []).join(" ").toLowerCase();
          let n = 0;
          for (const t of tokens) {
            if (title.includes(t)) n += 5;
            if (syn.includes(t)) n += 3;
            if (sit.includes(t)) n += 2;
            if (act.includes(t)) n += 1;
          }
          if (tokens.length > 1 && title.includes(query.toLowerCase())) n += 10;
          return n;
        };
        const ranked = raw
          .map((s) => ({ s, n: score(s) }))
          .filter((x) => x.n > 0)
          .sort((a, b) => b.n - a.n)
          .slice(0, 12)
          .map((x) => x.s);
        setResults(ranked);
        setHighlight(0);
      } catch (e) {
        if (!cancelled) setResults([]);
        console.error("Palette search:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [q, open]);

  const pick = (s: Scenario) => {
    setLastSearch(q.trim());
    setLastScenario({ id: s.id, title: s.title_en, category: s.category });
    onOpenChange(false);
    setTimeout(() => onSelect(s), 80);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((p) => (p + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((p) => (p <= 0 ? results.length - 1 : p - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); const s = results[highlight]; if (s) pick(s); }
  };

  const placeholder = useMemo(
    () => "Search scenarios, drugs, protocols…",
    [],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-md"
            aria-hidden
          />
          <motion.div
            key="cmd-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={springTransition}
            className="fixed left-1/2 top-[12vh] z-[61] w-[92vw] max-w-xl -translate-x-1/2 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-2 px-4 border-b border-border/50">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                aria-label="Search"
                aria-autocomplete="list"
                aria-controls="cmd-results"
                aria-activedescendant={results[highlight] ? `cmd-${results[highlight].id}` : undefined}
                className="flex-1 h-12 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
              />
              {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground border border-border/60">
                ESC
              </kbd>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className={cn("sm:hidden p-1 rounded hover:bg-muted text-muted-foreground", TRANSITION_CLASS)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div id="cmd-results" role="listbox" className="max-h-[55vh] overflow-y-auto">
              {q.trim().length < 2 ? (
                <div className="py-10 text-center text-[12px] text-muted-foreground flex flex-col items-center gap-2">
                  <CmdIcon className="w-5 h-5 opacity-60" />
                  <span>Type at least 2 characters to search</span>
                  <span className="text-[10px] opacity-70">
                    Tip: use <kbd className="px-1 rounded bg-muted">↑</kbd>{" "}
                    <kbd className="px-1 rounded bg-muted">↓</kbd> to navigate,{" "}
                    <kbd className="px-1 rounded bg-muted">↵</kbd> to open
                  </span>
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="py-10 text-center text-[12px] text-muted-foreground">
                  No matches for “{q.trim()}”
                </div>
              ) : (
                <ul className="py-1">
                  {results.length > 0 && (
                    <li className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Most relevant
                    </li>
                  )}
                  {results.map((s, idx) => {
                    const active = idx === highlight;
                    return (
                      <li key={s.id}>
                        <button
                          id={`cmd-${s.id}`}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setHighlight(idx)}
                          onClick={() => pick(s)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left",
                            "focus-visible:outline-none",
                            TRANSITION_CLASS,
                            active ? "bg-muted/70" : "hover:bg-muted/40",
                          )}
                        >
                          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-black uppercase">
                            {TAB_LABEL[s.category].slice(0, 2)}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13px] font-semibold text-foreground leading-tight truncate">
                              {s.title_en}
                            </span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5 truncate">
                              {TAB_LABEL[s.category]}
                              {s.situation_en ? ` · ${s.situation_en}` : ""}
                            </span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground bg-muted/20">
              <span className="flex items-center gap-1">
                <CmdIcon className="w-3 h-3" />
                Command palette
              </span>
              <span className="hidden sm:inline">
                {results.length > 0 ? `${results.length} results` : "Global search"}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
