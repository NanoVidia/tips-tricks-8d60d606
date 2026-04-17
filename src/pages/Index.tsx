import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Sun, Moon, Stethoscope, Scissors, MessageCircle, HelpCircle,
  Sparkles, ChevronRight, Baby, ShieldCheck, Activity, Wrench, X, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { AIChatDrawer } from "@/components/AIChatDrawer";
import { Pagination } from "@/components/Pagination";
import { StatsStrip } from "@/components/StatsStrip";
import { CaseOfTheDay } from "@/components/CaseOfTheDay";
import { OnboardingTour } from "@/components/OnboardingTour";
import { t } from "@/lib/i18n";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { Clock, Trash2 } from "lucide-react";

// Code-split the floating bot — it's not needed for first paint and ships React Markdown.
const FloatingAIBot = lazy(() =>
  import("@/components/FloatingAIBot").then((m) => ({ default: m.FloatingAIBot })),
);


type ScenarioCategory = "clinic" | "or_labor" | "behavior" | "qa";

interface Scenario {
  id: string;
  category: ScenarioCategory;
  title_en: string;
  situation_en: string;
  action_en: string;
  script_en: string;
  synonyms: string[] | null;
}

const ITEMS_PER_PAGE = 30;

const categoryConfig = {
  clinic: {
    icon: Stethoscope,
    gradient: "from-sky-400 to-blue-600",
    bgLight: "bg-sky-50 dark:bg-sky-950/30",
    iconColor: "text-sky-500",
    borderColor: "border-sky-200 dark:border-sky-800",
    iconBg: "bg-gradient-to-br from-sky-400 to-blue-600",
  },
  or_labor: {
    icon: Scissors,
    gradient: "from-rose-400 to-pink-600",
    bgLight: "bg-rose-50 dark:bg-rose-950/30",
    iconColor: "text-rose-500",
    borderColor: "border-rose-200 dark:border-rose-800",
    iconBg: "bg-gradient-to-br from-rose-400 to-pink-600",
  },
  behavior: {
    icon: MessageCircle,
    gradient: "from-amber-400 to-orange-500",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-500",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
  },
  qa: {
    icon: HelpCircle,
    gradient: "from-emerald-400 to-teal-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-600",
  },
};

const tabIds: ScenarioCategory[] = ["qa", "clinic", "or_labor", "behavior"];

/* Refined editorial logo — gold caduceus on ink, evokes a medical journal masthead. */
const Logo = () => (
  <div className="relative w-12 h-12 shrink-0">
    <div
      className="relative w-12 h-12 rounded-xl gradient-ink flex items-center justify-center shadow-editorial overflow-hidden ring-1 ring-gold/30"
      aria-label="Tips & Tricks logo"
    >
      <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 30% 25%, hsl(43 60% 58% / 0.35), transparent 60%)" }} aria-hidden="true" />
      <svg viewBox="0 0 40 40" className="w-7 h-7 relative" fill="none" aria-hidden="true">
        <path
          d="M20 33s-11-6.8-11-14.5c0-4 3-7 6.8-7 2.3 0 4.2 1.4 4.2 1.4S21.9 11.5 24.2 11.5c3.8 0 6.8 3 6.8 7C31 26.2 20 33 20 33z"
          fill="hsl(43 60% 58%)" fillOpacity="0.95"
        />
        <polyline
          points="9,21 15,21 17,16 20,26 23,19 26,23 29,21 31,21"
          stroke="hsl(0 0% 10%)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </div>
    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold ring-2 ring-background flex items-center justify-center" aria-hidden="true">
      <div className="w-1 h-1 rounded-full bg-ink" style={{ background: "hsl(0 0% 10%)" }} />
    </div>
  </div>
);

/** Today's date — formatted as a magazine issue line. */
const issueDate = () => {
  try {
    return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  } catch { return ""; }
};


const i = t();

function ClinicalCard({ item, onAI }: { item: Scenario; onAI: () => void }) {
  return (
    <AccordionItem value={item.id} className="border-b border-border/40 last:border-b-0">
      <AccordionTrigger className="py-3.5 px-2 text-sm font-medium hover:no-underline group">
        <div className="flex items-center gap-2 text-left">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
          <span className="group-hover:text-primary transition-colors">
            {item.title_en}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-2 pb-4">
        <div className="space-y-3">
          {[
            { label: i.situation, text: item.situation_en },
            { label: i.clinicalAction, text: item.action_en },
            { label: i.patientScript, text: item.script_en },
          ].map((section) => (
            <div key={section.label} className="rounded-xl bg-muted/40 p-3 border border-border/30">
              <div className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1.5">{section.label}</div>
              <p className="text-sm leading-relaxed">{section.text}</p>
            </div>
          ))}
          <Button
            size="sm"
            onClick={onAI}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium gap-2 shadow-md shadow-blue-500/20 h-10"
          >
            <MessageCircle className="w-4 h-4" />
            {i.discussAI}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<ScenarioCategory | null>(null);
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiScenario, setAiScenario] = useState<Scenario | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<ScenarioCategory, number>>({ clinic: 0, or_labor: 0, behavior: 0, qa: 0 });

  // Auto-suggest state
  const [suggestions, setSuggestions] = useState<Scenario[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Sticky header compact mode on scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Recent searches (last 5, persisted in localStorage)
  const recent = useRecentSearches();

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const toggleDark = () => {
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  useEffect(() => {
    async function fetchCounts() {
      const results = await Promise.all(
        tabIds.map((cat) =>
          supabase.from("medical_scenarios").select("*", { count: "exact", head: true }).eq("category", cat)
        )
      );
      const counts: Record<string, number> = {};
      tabIds.forEach((cat, idx) => { counts[cat] = results[idx].count || 0; });
      setCategoryCounts(counts as Record<ScenarioCategory, number>);
    }
    fetchCounts();
  }, []);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setCurrentPage(1); }, [activeTab, debouncedSearch]);

  // Auto-suggest: fetch top 5 across all categories as user types
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }
    let cancelled = false;
    setSuggestLoading(true);
    const handle = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("search_scenarios", { search_query: q });
        if (cancelled) return;
        if (error) throw error;
        setSuggestions(((data as Scenario[]) || []).slice(0, 5));
      } catch (e) {
        if (!cancelled) setSuggestions([]);
        console.error("Suggest error:", e);
      } finally {
        if (!cancelled) setSuggestLoading(false);
      }
    }, 180);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [search]);

  // Reset highlight when suggestions change
  useEffect(() => { setHighlightIdx(-1); }, [suggestions]);

  // Click outside to close
  useEffect(() => {
    if (!suggestOpen) return;
    const onClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [suggestOpen]);

  const fetchScenarios = useCallback(async () => {
    if (!activeTab) return;
    setLoading(true);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      if (debouncedSearch.trim()) {
        const { data, error } = await supabase.rpc("search_scenarios", {
          search_query: debouncedSearch.trim(),
          category_filter: activeTab,
        });
        if (error) throw error;
        const all = (data as Scenario[]) || [];
        setTotalCount(all.length);
        setScenarios(all.slice(from, to + 1));
        // Persist successful, non-trivial search
        if (all.length > 0) recent.add(debouncedSearch.trim());
      } else {
        const { count, error: cErr } = await supabase
          .from("medical_scenarios")
          .select("*", { count: "exact", head: true })
          .eq("category", activeTab);
        if (cErr) throw cErr;
        setTotalCount(count || 0);

        const { data, error } = await supabase
          .from("medical_scenarios")
          .select("*")
          .eq("category", activeTab)
          .order("created_at")
          .range(from, to);
        if (error) throw error;
        setScenarios((data as Scenario[]) || []);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTab, currentPage, recent.add]);

  useEffect(() => { fetchScenarios(); }, [fetchScenarios]);

  const openAI = (s: Scenario) => { setAiScenario(s); setAiOpen(true); };

  const totalScenarios = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen gradient-paper text-foreground flex flex-col max-w-lg mx-auto relative">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: "radial-gradient(hsl(0 0% 10%) 1px, transparent 1px)", backgroundSize: "3px 3px" }}
        aria-hidden="true"
      />
      <div className="h-[3px] gradient-gold relative z-20" />

      <header
        className={`sticky top-0 z-20 px-4 transition-all duration-300 border-b bg-card/80 backdrop-blur-md ${
          scrolled ? "pt-2 pb-2 border-border/70 shadow-editorial" : "pt-4 pb-3 border-border/50"
        }`}
      >
        <div className="relative">
          {/* Issue line — hidden in compact mode */}
          <AnimatePresence initial={false}>
            {!scrolled && (
              <motion.div
                key="issue-line"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3 text-[9px] tracking-[0.22em] uppercase font-bold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-1 h-1 rounded-full bg-gold" />
                    <span>{issueDate()}</span>
                  </span>
                  <span className="text-gold/90">Vol. I · Clinical Edition</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Masthead — collapses to small in compact mode */}
          <div className={`flex items-center justify-between transition-all ${scrolled ? "mb-2" : "mb-3"}`}>
            <div className="flex items-center gap-3 min-w-0">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: scrolled ? 0.78 : 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
              >
                <Logo />
              </motion.div>
              <div className="min-w-0">
                <h1 className={`font-editorial font-bold tracking-tight text-foreground leading-none transition-all ${
                  scrolled ? "text-[18px]" : "text-[24px]"
                }`}>
                  Tips <span className="italic font-medium text-gold">&</span> Tricks
                </h1>
              </div>
            </div>
            <button
              onClick={toggleDark}
              className="p-2.5 rounded-xl bg-card border border-border/60 hover:border-gold/50 hover:bg-muted transition-all shrink-0"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="w-4 h-4 text-gold" /> : <Moon className="w-4 h-4 text-foreground" />}
            </button>
          </div>

          {/* Hairline divider — hidden in compact */}
          {!scrolled && <div className="divider-editorial mb-3" aria-hidden="true" />}

          {/* Search bar with auto-suggest */}
          <motion.div
            ref={searchBoxRef}
            className="relative"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSuggestOpen(true); }}
              onFocus={() => {
                if (search.trim().length >= 2) setSuggestOpen(true);
              }}
              onKeyDown={(e) => {
                if (!suggestOpen || suggestions.length === 0) {
                  if (e.key === "Enter" && !activeTab) setActiveTab("qa");
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightIdx((p) => (p + 1) % suggestions.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightIdx((p) => (p <= 0 ? suggestions.length - 1 : p - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const pick = highlightIdx >= 0 ? suggestions[highlightIdx] : suggestions[0];
                  if (pick) {
                    setActiveTab(pick.category);
                    setSuggestOpen(false);
                    openAI(pick);
                  }
                } else if (e.key === "Escape") {
                  setSuggestOpen(false);
                }
              }}
              placeholder={i.searchPlaceholder}
              role="combobox"
              aria-expanded={suggestOpen && suggestions.length > 0}
              aria-controls="search-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={highlightIdx >= 0 ? `suggest-${highlightIdx}` : undefined}
              className="h-12 bg-card border-border/60 rounded-2xl text-sm pl-11 pr-10 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setSuggestOpen(false); }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted transition z-10"
              >
                {suggestLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            )}

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {suggestOpen && search.trim().length >= 2 && (
                <motion.div
                  id="search-suggestions"
                  role="listbox"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/5 overflow-hidden z-30"
                >
                  {suggestLoading && suggestions.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Searching...
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No matches for "{search.trim()}"
                    </div>
                  ) : (
                    <ul className="py-1">
                      {suggestions.map((s, idx) => {
                        const cfg = categoryConfig[s.category];
                        const Icon = cfg.icon;
                        const isHi = idx === highlightIdx;
                        return (
                          <li key={s.id}>
                            <button
                              id={`suggest-${idx}`}
                              role="option"
                              aria-selected={isHi}
                              type="button"
                              onMouseEnter={() => setHighlightIdx(idx)}
                              onClick={() => {
                                setActiveTab(s.category);
                                setSuggestOpen(false);
                                openAI(s);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition ${
                                isHi ? "bg-muted/70" : "hover:bg-muted/40"
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg ${cfg.iconBg} shrink-0`}>
                                <Icon className="w-3 h-3 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold text-foreground truncate leading-tight">
                                  {s.title_en}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                                  {i.tabs[s.category]}
                                </p>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                            </button>
                          </li>
                        );
                      })}
                      <li className="border-t border-border/40">
                        <button
                          type="button"
                          onClick={() => {
                            if (!activeTab) setActiveTab("qa");
                            setSuggestOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-primary hover:bg-muted/40 transition uppercase tracking-wider"
                        >
                          <Search className="w-3 h-3" />
                          See all results
                        </button>
                      </li>
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Editorial category chips with gold underline for active state */}
          <motion.div
            className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-none -mx-1 px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {tabIds.map((id) => {
              const config = categoryConfig[id];
              const Icon = config.icon;
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(active ? null : id)}
                  aria-pressed={active}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                    active
                      ? "border-gold/50 bg-gold-soft text-foreground shadow-sm"
                      : "border-border/50 bg-card text-muted-foreground hover:border-gold/30 hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon className={`w-3 h-3 ${active ? "text-gold" : ""}`} />
                  <span className="tracking-wide">{i.tabs[id]}</span>
                  <span
                    className={`text-[9px] tabular-nums px-1.5 py-0.5 rounded-md font-black ${
                      active ? "text-foreground" : "bg-muted text-muted-foreground"
                    }`}
                    style={active ? { backgroundColor: "hsl(0 0% 10% / 0.08)" } : undefined}
                  >
                    {categoryCounts[id]}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="active-tab-underline"
                      className="absolute -bottom-[5px] left-3 right-3 h-[2px] bg-gold rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-6">
        {!activeTab ? (
          <motion.div
            className="pt-4 pb-6 space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* 1️⃣ Welcome — sets context immediately */}
            <header className="text-center px-2">
              <span className="eyebrow text-gold">Editor's note</span>
              <h2 className="font-editorial text-[22px] font-bold text-foreground tracking-tight mt-2 mb-2 leading-tight">
                Clinical wisdom,<br />
                <span className="italic text-gold">one search away.</span>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                {totalScenarios}+ OB/GYN scenarios, scripts & protocols — curated by Dr. Sahar Elkhodiry.
              </p>
            </header>

            {/* 2️⃣ Quick start — most likely first action */}
            <section aria-labelledby="quick-start">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 id="quick-start" className="eyebrow text-foreground/80 flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-gold" />
                  Quick start
                </h3>
                <span className="text-[9px] text-muted-foreground">Tap to search</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { icon: ShieldCheck, label: "Preeclampsia management", tag: "Emergency" },
                  { icon: Activity, label: "PPH protocol", tag: "Emergency" },
                  { icon: Baby, label: "Shoulder dystocia", tag: "Labor" },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => { setActiveTab("qa"); setSearch(s.label); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-card border border-border/50 hover:border-gold/40 hover:bg-muted/40 transition-all text-left group"
                  >
                    <div className="p-1.5 rounded-lg bg-muted/60 group-hover:bg-gold-soft transition-colors shrink-0">
                      <s.icon className="w-3.5 h-3.5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] text-foreground font-semibold block truncate">{s.label}</span>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">{s.tag}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-gold group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </section>

            {/* 3️⃣ Today's teaching case — daily engagement */}
            <section aria-labelledby="today-case">
              <h3 id="today-case" className="eyebrow text-foreground/80 mb-2 px-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-gold" />
                Today's teaching case
              </h3>
              <CaseOfTheDay onOpen={(c) => openAI(c as unknown as Scenario)} />
            </section>

            {/* 3.5 Recent searches — only when user has history */}
            {recent.items.length > 0 && (
              <section aria-labelledby="recent">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 id="recent" className="eyebrow text-foreground/80 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-gold" />
                    Recent searches
                  </h3>
                  <button
                    type="button"
                    onClick={recent.clear}
                    className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-muted-foreground hover:text-destructive transition px-1.5 py-1 rounded-md hover:bg-destructive/10"
                    aria-label="Clear recent searches"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recent.items.map((q) => (
                    <div
                      key={q}
                      className="group inline-flex items-center gap-1 rounded-full bg-card border border-border/50 hover:border-gold/40 transition-all overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => { setActiveTab("qa"); setSearch(q); }}
                        className="flex items-center gap-1.5 pl-3 pr-1 py-1.5 text-[11px] font-semibold text-foreground"
                      >
                        <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                        {q}
                      </button>
                      <button
                        type="button"
                        onClick={() => recent.remove(q)}
                        aria-label={`Remove ${q}`}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="browse-cat">
              <h3 id="browse-cat" className="eyebrow text-foreground/80 mb-2 px-1">Browse the library</h3>
              <div className="grid grid-cols-2 gap-2">
                {tabIds.map((id) => {
                  const cfg = categoryConfig[id];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className="group flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border/50 hover:border-gold/40 hover:shadow-editorial transition-all text-left"
                    >
                      <div className={`p-2 rounded-lg ${cfg.iconBg} shrink-0`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-foreground truncate leading-tight">{i.tabs[id]}</p>
                        <p className="text-[9px] text-muted-foreground tabular-nums mt-0.5">
                          {categoryCounts[id]} entries
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 5️⃣ Library stats — trust signal */}
            <section aria-labelledby="stats">
              <h3 id="stats" className="eyebrow text-foreground/80 mb-1 px-1">By the numbers</h3>
              <StatsStrip total={totalScenarios} byCategory={categoryCounts} />
            </section>

            {/* 6️⃣ Tools CTA — final action point */}
            <Link
              to="/tools"
              className="group flex items-center gap-3 w-full p-4 rounded-2xl gradient-ink border border-gold/30 hover:border-gold/60 transition-all shadow-editorial"
              style={{ color: "hsl(40 30% 96%)" }}
            >
              <div className="p-2 rounded-xl bg-gold/20 ring-1 ring-gold/40 shrink-0">
                <Wrench className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[13px] font-bold leading-tight" style={{ color: "hsl(40 30% 96%)" }}>Clinical Tools Suite</p>
                <p className="text-[10px] leading-tight mt-0.5 opacity-70 truncate">Calculators · Emergency · Drugs · DDx · MCQ</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition shrink-0" />
            </Link>
          </motion.div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : scenarios.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">{i.noResults}</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = categoryConfig[activeTab].icon;
                  return (
                    <div className={`p-1 rounded-lg ${categoryConfig[activeTab].iconBg}`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                  );
                })()}
                <h2 className="text-sm font-bold text-foreground">{i.tabs[activeTab]}</h2>
              </div>
              <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-medium">
                {totalCount} items
              </span>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <Accordion type="single" collapsible className="w-full">
                {scenarios.map((item) => (
                  <ClinicalCard key={item.id} item={item} onAI={() => openAI(item)} />
                ))}
              </Accordion>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>

      {/* Editorial footer — credits relocated from the masthead */}
      <footer className="relative px-4 pt-5 pb-8 mt-2 border-t border-border/50 bg-card/40">
        <div className="divider-editorial mb-4" aria-hidden="true" />
        <div className="text-center space-y-1.5">
          <p className="eyebrow text-gold">Under the supervision of</p>
          <p className="font-editorial text-[15px] font-bold text-foreground leading-tight">
            {i.appSubtitle}
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
            © {new Date().getFullYear()} Tips &amp; Tricks · Clinical Edition
          </p>
        </div>
      </footer>

      <AIChatDrawer open={aiOpen} onOpenChange={setAiOpen} scenario={aiScenario} />
      <Suspense fallback={null}><FloatingAIBot /></Suspense>
      <OnboardingTour />
    </div>
  );
}
