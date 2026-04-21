import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Sparkles, Clock, Flame, LayoutGrid, Star,
  Search as SearchIcon, MessageSquare, Loader2, ChevronRight,
} from "lucide-react";
import { PhIcon } from "@/components/ui/PhIcon";
import { supabase } from "@/integrations/supabase/client";
import { useScenarioUsage, type ScenarioCategory } from "@/hooks/useScenarioUsage";
import { useRecentSearches } from "@/hooks/useRecentSearches";

interface Scenario {
  id: string;
  category: ScenarioCategory;
  title_en: string;
  situation_en: string;
  action_en: string;
  script_en: string;
  synonyms: string[] | null;
}

interface CategoryConfig {
  phName: string;
  gradient: string;
  iconBg: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: ScenarioCategory | null;
  categoryLabel: string;
  totalCount: number;
  config: CategoryConfig;
  /** Open the full category browse view (sets activeTab + clears search). */
  onBrowseAll: () => void;
  /** Filter the category by a sub-topic search query. */
  onPickTopic: (query: string) => void;
  /** Open a specific scenario sheet. */
  onOpenScenario: (s: Scenario) => void;
  /** Open the AI assistant. */
  onOpenAI: () => void;
}

/** Sub-topic chips per category — curated, evidence-based keywords that exist in scenarios. */
const SUB_TOPICS: Record<ScenarioCategory, { label: string; q: string; emoji: string }[]> = {
  clinic: [
    { label: "Antenatal", q: "prenatal", emoji: "👶" },
    { label: "Hypertension", q: "hypertension", emoji: "🩺" },
    { label: "Diabetes", q: "diabetes", emoji: "💉" },
    { label: "Preeclampsia", q: "preeclampsia", emoji: "⚠️" },
    { label: "Bleeding", q: "bleeding", emoji: "🩸" },
    { label: "Screening", q: "screening", emoji: "🔬" },
    { label: "Menopause", q: "menopause", emoji: "🌸" },
    { label: "Fertility", q: "fertility", emoji: "🧬" },
  ],
  or_labor: [
    { label: "C-section", q: "cesarean", emoji: "🔪" },
    { label: "Shoulder dystocia", q: "shoulder dystocia", emoji: "⚡" },
    { label: "PPH", q: "postpartum hemorrhage", emoji: "🩸" },
    { label: "Breech", q: "breech", emoji: "🔄" },
    { label: "Forceps", q: "forceps", emoji: "🛠️" },
    { label: "Hysterectomy", q: "hysterectomy", emoji: "✂️" },
    { label: "Laparoscopy", q: "laparoscopy", emoji: "🔭" },
    { label: "Preterm", q: "preterm", emoji: "⏱️" },
  ],
  behavior: [
    { label: "Anxious patient", q: "anxious", emoji: "😟" },
    { label: "Bad news", q: "bad news", emoji: "💬" },
    { label: "Consent", q: "consent", emoji: "📝" },
    { label: "Refusal", q: "refusal", emoji: "🚫" },
    { label: "Family conflict", q: "family", emoji: "👨‍👩‍👧" },
    { label: "Confidentiality", q: "confidentiality", emoji: "🔒" },
    { label: "Cultural", q: "cultural", emoji: "🌍" },
    { label: "Ethics", q: "ethics", emoji: "⚖️" },
  ],
  qa: [
    { label: "MgSO₄ dosing", q: "magnesium", emoji: "💊" },
    { label: "Eclampsia", q: "eclampsia", emoji: "🫀" },
    { label: "GDM", q: "gestational diabetes", emoji: "🍬" },
    { label: "PPH protocol", q: "postpartum hemorrhage", emoji: "🆘" },
    { label: "Red flags", q: "red flag", emoji: "🚩" },
    { label: "Doses", q: "dose", emoji: "💉" },
    { label: "Guidelines", q: "guideline", emoji: "📋" },
    { label: "Pearls", q: "pearl", emoji: "✨" },
  ],
};

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const timeAgo = (ts: number) => {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
};

export function CategoryHubSheet({
  open, onOpenChange, category, categoryLabel, totalCount, config,
  onBrowseAll, onPickTopic, onOpenScenario, onOpenAI,
}: Props) {
  const { lastOpened, trending } = useScenarioUsage();
  const recent = useRecentSearches();
  const [featured, setFeatured] = useState<Scenario | null>(null);
  const [continueScenario, setContinueScenario] = useState<Scenario | null>(null);
  const [trendingScenarios, setTrendingScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);

  const trendingEntries = useMemo(
    () => (category ? trending(category, 4) : []),
    [category, trending],
  );
  const lastEntry = useMemo(
    () => (category ? lastOpened(category) : null),
    [category, lastOpened],
  );

  // Fetch featured (latest) + hydrate continue/trending from DB when sheet opens
  useEffect(() => {
    if (!open || !category) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const ids = new Set<string>();
        if (lastEntry) ids.add(lastEntry.id);
        for (const t of trendingEntries) ids.add(t.id);

        // Featured = latest scenario in this category
        const { data: latest } = await supabase
          .from("medical_scenarios")
          .select("*")
          .eq("category", category)
          .order("created_at", { ascending: false })
          .limit(1);

        if (cancelled) return;
        const latestRow = (latest as Scenario[] | null)?.[0] ?? null;
        setFeatured(latestRow);

        // Hydrate user-history scenarios
        if (ids.size > 0) {
          const { data: rows } = await supabase
            .from("medical_scenarios")
            .select("*")
            .in("id", Array.from(ids));
          if (cancelled) return;
          const list = (rows as Scenario[] | null) ?? [];
          const byId = new Map(list.map((s) => [s.id, s]));
          setContinueScenario(lastEntry ? byId.get(lastEntry.id) ?? null : null);
          setTrendingScenarios(
            trendingEntries
              .map((e) => byId.get(e.id))
              .filter((s): s is Scenario => Boolean(s)),
          );
        } else {
          setContinueScenario(null);
          setTrendingScenarios([]);
        }
      } catch (e) {
        console.error("Hub fetch error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  if (!category) return null;

  const subTopics = SUB_TOPICS[category];
  const recentForCat = recent.items.slice(0, 4);

  const pickTopic = (q: string) => {
    onOpenChange(false);
    setTimeout(() => onPickTopic(q), 150);
  };
  const browseAll = () => {
    onOpenChange(false);
    setTimeout(onBrowseAll, 150);
  };
  const openScenario = (s: Scenario) => {
    onOpenChange(false);
    setTimeout(() => onOpenScenario(s), 150);
  };
  const askAI = () => {
    onOpenChange(false);
    setTimeout(onOpenAI, 150);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[88vh] overflow-y-auto p-0"
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 bg-background pt-2 pb-1">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-muted" aria-hidden />
        </div>

        <div className="px-5 pb-6">
          <SheetHeader className="pb-3 border-b border-border/50 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <span className={`w-9 h-9 rounded-2xl ${config.iconBg} flex items-center justify-center shadow-sm`}>
                <PhIcon name={config.phName as never} size={18} tone="white" weight="duotone" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-bold leading-tight truncate">{categoryLabel}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {fmt(totalCount)} scenarios · Smart hub
                </span>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* ① Continue where you left off */}
          <AnimatePresence>
            {continueScenario && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => openScenario(continueScenario)}
                className={`group relative w-full mt-4 rounded-2xl p-3.5 bg-gradient-to-br ${config.gradient} text-white shadow-md text-left overflow-hidden`}
                aria-label="Continue last scenario"
              >
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                  aria-hidden
                />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 ring-1 ring-white/30 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/85">
                      Continue where you left off
                    </p>
                    <p className="text-[13px] font-bold leading-tight truncate mt-0.5">
                      {continueScenario.title_en}
                    </p>
                    {lastEntry && (
                      <p className="text-[10px] text-white/75 mt-0.5">{timeAgo(lastEntry.lastAt)}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* ② Trending for this user (per-category) */}
          {trendingScenarios.length > 0 && (
            <section className="mt-5">
              <div className="flex items-center gap-1.5 mb-2 px-0.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Your trending
                </h3>
              </div>
              <div className="space-y-1.5">
                {trendingScenarios.map((s, idx) => {
                  const entry = trendingEntries.find((e) => e.id === s.id);
                  return (
                    <motion.button
                      key={s.id}
                      type="button"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * idx }}
                      onClick={() => openScenario(s)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-muted/40 transition text-left"
                    >
                      <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm">
                        {idx + 1}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[12px] font-bold text-foreground leading-tight truncate">
                          {s.title_en}
                        </span>
                        {entry && (
                          <span className="block text-[9px] text-muted-foreground mt-0.5">
                            {entry.count} {entry.count === 1 ? "view" : "views"} · {timeAgo(entry.lastAt)}
                          </span>
                        )}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ③ Sub-topics grid */}
          <section className="mt-5">
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <LayoutGrid className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Browse by topic
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {subTopics.map((t, idx) => (
                <motion.button
                  key={t.q}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * idx }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => pickTopic(t.q)}
                  className="group relative overflow-hidden flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:shadow-sm transition text-left"
                >
                  <span className="text-[15px] leading-none shrink-0">{t.emoji}</span>
                  <span className="text-[12px] font-bold text-foreground leading-tight flex-1 min-w-0 truncate">
                    {t.label}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition" />
                </motion.button>
              ))}
            </div>
          </section>

          {/* ④ Featured (latest) */}
          {featured && (
            <section className="mt-5">
              <div className="flex items-center gap-1.5 mb-2 px-0.5">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Newest scenario
                </h3>
              </div>
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openScenario(featured)}
                className="w-full text-left rounded-2xl p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-800/40 hover:shadow-md transition"
              >
                <p className="text-[13px] font-bold text-foreground leading-tight line-clamp-2">
                  {featured.title_en}
                </p>
                {featured.situation_en && (
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-1.5">
                    {featured.situation_en}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                  Open
                  <ArrowRight className="w-3 h-3" />
                </span>
              </motion.button>
            </section>
          )}

          {/* ⑤ Recent searches */}
          {recentForCat.length > 0 && (
            <section className="mt-5">
              <div className="flex items-center gap-1.5 mb-2 px-0.5">
                <SearchIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Your recent searches
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentForCat.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => pickTopic(q)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/60 hover:bg-primary hover:text-primary-foreground text-[11px] font-semibold transition border border-border/50"
                  >
                    <Clock className="w-2.5 h-2.5 opacity-70" />
                    {q}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ⑥ Sticky action bar — Browse + Ask AI */}
          <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/80 pt-4 mt-6 pb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={browseAll}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-card border border-border/60 text-foreground text-[12px] font-bold hover:border-primary/40 transition"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Browse all
            </button>
            <button
              type="button"
              onClick={askAI}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[12px] font-bold shadow-md shadow-primary/20 hover:shadow-lg transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading hub…
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
