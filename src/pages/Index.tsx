import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Sun, Moon, Stethoscope, Scissors, MessageCircle, HelpCircle,
  Sparkles, ChevronRight, Baby, ShieldCheck, Activity, Wrench, X, Loader2, Trophy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AIChatDrawer } from "@/components/AIChatDrawer";
import { ScenarioCard } from "@/components/ScenarioCard";
import { ScenarioSheet } from "@/components/ScenarioSheet";
import { Pagination } from "@/components/Pagination";
import { StatsStrip } from "@/components/StatsStrip";
import { CaseOfTheDay } from "@/components/CaseOfTheDay";
import { OnboardingTour } from "@/components/OnboardingTour";
import { HomeHero } from "@/components/HomeHero";
import { AdSpaceBanner } from "@/components/AdSpaceBanner";
import { SurgeryCategoriesSheet } from "@/components/SurgeryCategoriesSheet";
import { ExamsFlagsSheet } from "@/components/ExamsFlagsSheet";

import { useTranslations } from "@/hooks/useTranslations";
import { useAppSettings } from "@/hooks/useAppSettings";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { Clock, Trash2 } from "lucide-react";
import { PhIcon } from "@/components/ui/PhIcon";


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
    phName: "Stethoscope" as const,
    icon: Stethoscope,
    gradient: "from-sky-400 to-blue-600",
    bgLight: "bg-sky-50 dark:bg-sky-950/30",
    iconColor: "text-sky-500",
    borderColor: "border-sky-200 dark:border-sky-800",
    iconBg: "bg-gradient-to-br from-sky-400 to-blue-600",
  },
  or_labor: {
    phName: "Scissors" as const,
    icon: Scissors,
    gradient: "from-rose-400 to-pink-600",
    bgLight: "bg-rose-50 dark:bg-rose-950/30",
    iconColor: "text-rose-500",
    borderColor: "border-rose-200 dark:border-rose-800",
    iconBg: "bg-gradient-to-br from-rose-400 to-pink-600",
  },
  behavior: {
    phName: "ChatCircleDots" as const,
    icon: MessageCircle,
    gradient: "from-amber-400 to-orange-500",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-500",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
  },
  qa: {
    phName: "Question" as const,
    icon: HelpCircle,
    gradient: "from-emerald-400 to-teal-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-600",
  },
};

const tabIds: ScenarioCategory[] = ["qa", "clinic", "or_labor", "behavior"];

/* Calm clinical mark — abstract stethoscope arc forming a "T". */
/** Today's date — formatted as a magazine issue line. */
const issueDate = () => {
  try {
    return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  } catch { return ""; }
};


type TFn = (k: string) => string;
const TAB_LABEL_KEYS: Record<ScenarioCategory, string> = {
  clinic: "tab.clinic",
  or_labor: "tab.or_labor",
  behavior: "tab.behavior",
  qa: "tab.qa",
};
const formatNumber = (value: number) => new Intl.NumberFormat("en-US-u-nu-latn").format(value);
const normalizeDigits = (value: string) => value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

// (Inline ClinicalCard removed — replaced by ScenarioCard + ScenarioSheet)


export default function Index() {
  const { t } = useTranslations();
  const { get: getSetting } = useAppSettings();
  const logoText = String(getSetting("logo_text") ?? "OB/GYN Reference");
  const tabLabel = (c: ScenarioCategory) => t(TAB_LABEL_KEYS[c] as never);
  const [activeTab, setActiveTab] = useState<ScenarioCategory | null>(null);
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiScenario, setAiScenario] = useState<Scenario | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [sheetScenario, setSheetScenario] = useState<Scenario | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [surgerySheetOpen, setSurgerySheetOpen] = useState(false);
  const [examsSheetOpen, setExamsSheetOpen] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<ScenarioCategory, number>>({ clinic: 0, or_labor: 0, behavior: 0, qa: 0 });

  // Auto-suggest state
  const [suggestions, setSuggestions] = useState<Scenario[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [searchFocused, setSearchFocused] = useState(false);
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
    <div className="min-h-screen gradient-paper text-foreground flex flex-col max-w-lg mx-auto relative tabular-nums">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: "radial-gradient(hsl(0 0% 10%) 1px, transparent 1px)", backgroundSize: "3px 3px" }}
        aria-hidden="true"
      />
      <div className="h-[3px] gradient-gold relative z-20" />

      <header
        className={`header-fade sticky top-0 z-20 px-4 sm:px-5 border-b bg-card/85 backdrop-blur-md transition-all duration-300 ${
          scrolled ? "pt-2 pb-2 border-border/70" : "pt-4 pb-3.5 border-border/50"
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
                <div className="flex items-center justify-between mb-4 text-[9px] tracking-[0.22em] uppercase font-bold text-muted-foreground">
                  <span className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="inline-block w-1 h-1 rounded-full bg-gold" />
                    <span className="truncate">{issueDate()}</span>
                  </span>
                  <span className="text-gold/90 shrink-0 ml-2">Vol. I</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Masthead — collapses to small in compact mode */}
          <div className={`flex items-start justify-between gap-3 transition-all ${scrolled ? "mb-3" : "mb-4"}`}>
            <motion.div
              className="min-w-0 flex-1 flex flex-col gap-1.5 pr-1"
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1
                className={`font-editorial italic font-black tracking-tight leading-[0.95] text-foreground transition-all ${
                  scrolled ? "text-[21px] leading-tight" : "text-[28px] leading-[1.02]"
                }`}
              >
                <span className="relative inline-block max-w-full">
                  <span className="bg-clip-text text-transparent bg-[linear-gradient(110deg,hsl(var(--foreground))_0%,hsl(var(--primary))_50%,hsl(var(--foreground))_100%)]">
                    {logoText.trim() || "OB/GYN Reference"}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 -bottom-1.5 h-[2px] w-full origin-left bg-gradient-to-r from-primary via-primary/50 to-transparent transition-all ${
                      scrolled ? "scale-x-75" : "scale-x-100"
                    }`}
                  />
                </span>
              </h1>
              <span
                className={`self-start inline-flex max-w-full items-center rounded-md border border-primary/25 bg-primary/5 text-primary font-semibold uppercase tracking-[0.18em] transition-all ${
                  scrolled ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[9px]"
                }`}
              >
                OB/GYN Reference
              </span>
            </motion.div>
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl bg-card border border-border/60 hover:border-gold/50 hover:bg-muted transition-all shrink-0 self-start"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="w-4 h-4 text-gold" /> : <Moon className="w-4 h-4 text-foreground" />}
            </button>
          </div>

          {/* Hairline divider — hidden in compact */}
          {!scrolled && <div className="divider-editorial mb-4" aria-hidden="true" />}

          {/* Search bar with auto-suggest */}
          <motion.div
            ref={searchBoxRef}
            className="relative"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Decorative gradient ring */}
            <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40 opacity-70 blur-[1px] pointer-events-none" aria-hidden="true" />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg gradient-gold shadow-gold pointer-events-none">
              <Search className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSuggestOpen(true); }}
              onFocus={() => {
                setSearchFocused(true);
                if (search.trim().length >= 2) setSuggestOpen(true);
              }}
              onBlur={() => { setTimeout(() => setSearchFocused(false), 150); }}
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
              placeholder={t("searchPlaceholder")}
              role="combobox"
              aria-expanded={suggestOpen && suggestions.length > 0}
              aria-controls="search-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={highlightIdx >= 0 ? `suggest-${highlightIdx}` : undefined}
              className={`relative bg-card border-border/60 rounded-2xl text-[14px] pl-12 pr-10 shadow-editorial focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/50 transition-all duration-300 tabular-nums ${scrolled ? "h-9" : "h-12"}`}
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

            {/* Popular search chips — shown on focus when query is empty */}
            <AnimatePresence>
              {searchFocused && search.trim().length < 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2.5 pb-0.5">
                    <div className="flex items-center gap-1.5 mb-2 px-0.5">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="eyebrow text-muted-foreground">Popular searches</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Preeclampsia", cat: "qa" as const },
                        { label: "PPH", cat: "qa" as const },
                        { label: "Shoulder dystocia", cat: "or_labor" as const },
                        { label: "GDM", cat: "qa" as const },
                        { label: "Cervical insufficiency", cat: "clinic" as const },
                        { label: "Anxious patient", cat: "behavior" as const },
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setActiveTab(chip.cat);
                            setSearch(chip.label);
                            setSuggestOpen(true);
                            setSearchFocused(false);
                          }}
                          className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/20 text-[11px] font-semibold text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                        >
                          <Search className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {/* 🔥 Hot topics — hardest procedures, skills, tricks */}
                    <div className="flex items-center gap-1.5 mt-4 mb-2 px-0.5">
                      <span className="text-[11px]">🔥</span>
                      <span className="eyebrow text-muted-foreground">Hot topics for clinicians</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { emoji: "⚡", label: "Shoulder dystocia", hint: "HELPERR drill", cat: "or_labor" as const, gradient: "from-rose-500/12 to-red-500/5", border: "border-rose-500/25" },
                        { emoji: "🩸", label: "Massive PPH", hint: "4 T's protocol", cat: "qa" as const, gradient: "from-red-500/12 to-pink-500/5", border: "border-red-500/25" },
                        { emoji: "🫀", label: "Eclampsia", hint: "MgSO₄ dosing", cat: "qa" as const, gradient: "from-violet-500/12 to-fuchsia-500/5", border: "border-violet-500/25" },
                        { emoji: "🔪", label: "C-section tricks", hint: "Difficult delivery", cat: "or_labor" as const, gradient: "from-amber-500/12 to-orange-500/5", border: "border-amber-500/25" },
                        { emoji: "👶", label: "Breech delivery", hint: "Maneuvers", cat: "or_labor" as const, gradient: "from-sky-500/12 to-blue-500/5", border: "border-sky-500/25" },
                        { emoji: "🧠", label: "Consent pitfalls", hint: "Ethics & law", cat: "behavior" as const, gradient: "from-emerald-500/12 to-teal-500/5", border: "border-emerald-500/25" },
                      ].map((item, idx) => (
                        <motion.button
                          key={item.label}
                          type="button"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 + idx * 0.04, type: "spring", stiffness: 260, damping: 22 }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setActiveTab(item.cat);
                            setSearch(item.label);
                            setSuggestOpen(true);
                            setSearchFocused(false);
                          }}
                          className={`group relative overflow-hidden text-left p-2 rounded-xl bg-gradient-to-br ${item.gradient} border ${item.border} hover:shadow-md transition-all`}
                        >
                          <span
                            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                            aria-hidden
                          />
                          <div className="relative flex items-start gap-1.5">
                            <span className="text-base leading-none mt-0.5">{item.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-foreground leading-tight truncate">{item.label}</p>
                              <p className="text-[9px] text-muted-foreground leading-tight mt-0.5 truncate">{item.hint}</p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                                <PhIcon name={cfg.phName} size={14} tone="white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold text-foreground truncate leading-tight">
                                  {s.title_en}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                                  {tabLabel(s.category)}
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

        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 sm:px-5 pb-8">
        {/* Category tabs — only when a tab is active (HomeHero shows them on home) */}
        {activeTab && (
        <motion.div
          role="tablist"
          aria-label="Scenario categories"
          className="relative grid grid-cols-2 gap-2.5 pt-5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          {tabIds.map((id, idx) => {
            const config = categoryConfig[id];
            const Icon = config.icon;
            const active = activeTab === id;
            return (
              <motion.button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(active ? null : id)}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.25 + idx * 0.06, type: "spring", stiffness: 280, damping: 22 }}
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ scale: 0.96 }}
                className={`group relative overflow-hidden flex items-center gap-1.5 pl-1.5 pr-1.5 py-2.5 rounded-xl border text-[11px] font-bold tracking-tight transition-all ${
                  active
                    ? "border-transparent text-primary-foreground shadow-gold"
                    : "border-border/60 bg-card text-foreground hover:border-primary/30 hover:shadow-editorial"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="active-tab-pill"
                    className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {!active && (
                  <span
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${config.gradient}`}
                    style={{ mixBlendMode: "soft-light" }}
                    aria-hidden
                  />
                )}
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                  aria-hidden
                />
                <motion.span
                  animate={active ? { rotate: [0, -8, 6, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`relative flex items-center justify-center w-5 h-5 rounded-md shrink-0 transition-all ${
                    active
                      ? "bg-white/25 backdrop-blur-sm ring-1 ring-white/30"
                      : "bg-gradient-to-br from-gold/15 to-primary/10 ring-1 ring-gold/30 group-hover:from-gold/25 group-hover:to-primary/20 group-hover:ring-gold/50"
                  }`}
                >
                  <PhIcon name={config.phName} size={13} tone={active ? "white" : "gold"} weight={active ? "fill" : "duotone"} />
                </motion.span>
                <span className="relative flex-1 min-w-0 text-left leading-[1.15] text-[10.5px] truncate">{tabLabel(id)}</span>
                <span
                  className={`relative shrink-0 text-[9px] tabular-nums font-black px-1.5 py-0.5 rounded-full transition-colors ${
                    active
                      ? "bg-white/25 text-primary-foreground"
                      : "bg-muted/70 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  }`}
                >
                  {formatNumber(categoryCounts[id])}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
        )}
        {!activeTab ? (
          <HomeHero
            totalScenarios={totalScenarios}
            categoryCounts={categoryCounts}
            onSelectCategory={(id) => { setActiveTab(id); }}
            onOpenAI={() => {
              // Open the floating AI bot if available; otherwise the AI drawer with no scenario
              const btn = document.querySelector<HTMLButtonElement>('[data-floating-ai-bot="true"]');
              if (btn) btn.click();
              else setAiOpen(true);
            }}
            onOpenSurgery={() => setSurgerySheetOpen(true)}
            onOpenExams={() => setExamsSheetOpen(true)}
            tabLabels={{
              qa: tabLabel("qa"),
              clinic: tabLabel("clinic"),
              or_labor: tabLabel("or_labor"),
              behavior: tabLabel("behavior"),
            }}
          />
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[260px]">{t("noResults")}</p>
            {search && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSearch("")}
                className="rounded-full text-[11px] h-8 px-3.5"
              >
                <X className="w-3 h-3 mr-1" />
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 mt-4 px-1 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {(() => {
                  const cfg = categoryConfig[activeTab];
                  return (
                    <div className={`p-1 rounded-lg ${cfg.iconBg}`}>
                      <PhIcon name={cfg.phName} size={16} tone="white" />
                    </div>
                  );
                })()}
                <h2 className="text-[15px] font-bold text-foreground leading-tight truncate">{tabLabel(activeTab)}</h2>
              </div>
              <span className="text-[10px] bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-bold tabular-nums shrink-0">
                {formatNumber(totalCount)} items
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scenarios.map((item, idx) => (
                <ScenarioCard
                  key={item.id}
                  id={item.id}
                  title={item.title_en}
                  situation={item.situation_en}
                  category={item.category}
                  index={idx}
                  onOpen={() => { setSheetScenario(item); setSheetOpen(true); }}
                  categoryConfig={categoryConfig}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>

      {/* Advertising space — premium placement before the legal disclaimer */}
      <div className="px-4 sm:px-5 pt-2 pb-3">
        <AdSpaceBanner />
      </div>

      {/* Disclaimer — placed just above the footer for legal prominence */}
      <div className="px-4 sm:px-5 pt-1 pb-5">
        <DisclaimerBanner />
      </div>

      {/* Editorial footer — credits relocated from the masthead */}
      <footer className="relative px-5 pt-7 pb-10 border-t border-border/50 bg-gradient-to-b from-card/40 via-card/60 to-card/80 overflow-hidden">
        {/* Decorative gold orb */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="divider-editorial mb-4 relative" aria-hidden="true" />
        <div className="text-center space-y-2 relative">
          <p className="eyebrow text-gold text-[10px] tracking-[0.22em]">✦ Under the supervision of ✦</p>
          <p className="font-editorial text-[17px] font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent leading-snug">
            {t("appSubtitle")}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold/40" aria-hidden="true" />
            <span className="text-[10px] text-gold/80 font-semibold tracking-[0.2em] uppercase">Est. 2026</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold/40" aria-hidden="true" />
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed pt-1 tabular-nums">
            © 2026 <span className="font-semibold text-foreground/80">Tips &amp; Tricks</span> · Clinical Edition
          </p>
          <p className="text-[9px] text-muted-foreground/70 tracking-wider pt-0.5">
            Crafted with precision for OB/GYN excellence
          </p>
        </div>
      </footer>

      <AIChatDrawer open={aiOpen} onOpenChange={setAiOpen} scenario={aiScenario} />
      <ScenarioSheet
        scenario={sheetScenario}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAI={(s) => { setSheetOpen(false); openAI(s as Scenario); }}
        categoryConfig={categoryConfig}
        t={t}
      />
      
      <OnboardingTour />
    </div>
  );
}
