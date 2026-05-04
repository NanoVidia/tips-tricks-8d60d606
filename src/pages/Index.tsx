import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Sun, Moon, Stethoscope, Scissors, MessageCircle, HelpCircle,
  Sparkles, ChevronRight, Baby, Activity, Wrench, X, Loader2, Trophy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AIChatDrawer } from "@/components/AIChatDrawer";
import { ScenarioCard } from "@/components/ScenarioCard";
import { ClinicalSearchResultCard } from "@/components/ClinicalSearchResultCard";
import { ScenarioSheet } from "@/components/ScenarioSheet";
import { Pagination } from "@/components/Pagination";
import { StatsStrip } from "@/components/StatsStrip";
import { CaseOfTheDay } from "@/components/CaseOfTheDay";
import { OnboardingTour } from "@/components/OnboardingTour";
import { HomeHero } from "@/components/HomeHero";
import { AdSpaceBanner } from "@/components/AdSpaceBanner";
import { SurgeryCategoriesSheet } from "@/components/SurgeryCategoriesSheet";
import { ExamsFlagsSheet } from "@/components/ExamsFlagsSheet";
import { ClinicTopicsSheet } from "@/components/ClinicTopicsSheet";
import { SmartBottomSheet } from "@/components/SmartBottomSheet";
import { CommandPalette } from "@/components/CommandPalette";
import { useActivityTracker, type TabId } from "@/hooks/useActivityTracker";
import { springTransition } from "@/lib/motion";

import { RefreshDataButton } from "@/components/RefreshDataButton";

import { useTranslations } from "@/hooks/useTranslations";
import { useAppSettings } from "@/hooks/useAppSettings";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { Clock, Trash2, ShieldCheck } from "lucide-react";
import { PhIcon } from "@/components/ui/PhIcon";
import { detectUrgency } from "@/lib/clinicalTags";
import { expandClinicalSearchQueries, rankSearchScenarios } from "@/lib/clinicalSearch";
import { buildHighlightRegex, highlightText } from "@/lib/highlight";
import { McqSearchSection, type McqSearchResult } from "@/components/McqSearchSection";


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
const normalizeDigits = (value: string) => value.replace(/[\u0660-\u0669]/g, (digit) => String("\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669".indexOf(digit)));

// (Inline ClinicalCard removed — replaced by ScenarioCard + ScenarioSheet)


export default function Index() {
  const { t } = useTranslations();
  const { get: getSetting } = useAppSettings();
  const logoText = String(getSetting("logo_text") ?? "OB/GYN Reference");
  const tabLabel = (c: ScenarioCategory) => t(TAB_LABEL_KEYS[c] as never);
  const [activeTab, setActiveTab] = useState<ScenarioCategory | null>(null);
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(() => {
    if (typeof document === "undefined") return false;
    const saved = localStorage.getItem("theme_mode");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      return true;
    }
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
      return false;
    }
    return document.documentElement.classList.contains("dark");
  });
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [allSearchResults, setAllSearchResults] = useState<Scenario[]>([]);
  const [mcqResults, setMcqResults] = useState<McqSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiScenario, setAiScenario] = useState<Scenario | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [sheetScenario, setSheetScenario] = useState<Scenario | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [surgerySheetOpen, setSurgerySheetOpen] = useState(false);
  const [examsSheetOpen, setExamsSheetOpen] = useState(false);
  const [clinicSheetOpen, setClinicSheetOpen] = useState(false);
  const [hubCategory, setHubCategory] = useState<ScenarioCategory | null>(null);
  const [hubOpen, setHubOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { state: activity, setLastSearch, setLastTab, setLastScenario } = useActivityTracker();
  const [categoryCounts, setCategoryCounts] = useState<Record<ScenarioCategory, number>>({ clinic: 0, or_labor: 0, behavior: 0, qa: 0 });

  // Auto-suggest state
  const [suggestions, setSuggestions] = useState<Scenario[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const suggestHl = useMemo(() => buildHighlightRegex(search), [search]);

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
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme_mode", next ? "dark" : "light");
      return next;
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
    const timer = setTimeout(() => setDebouncedSearch(search), 80);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setCurrentPage(1); }, [activeTab, debouncedSearch]);

  // Persist activity for the Adaptive Hub (lastSearch + lastTab)
  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) setLastSearch(debouncedSearch.trim());
  }, [debouncedSearch, setLastSearch]);
  useEffect(() => {
    if (activeTab) setLastTab(activeTab as TabId);
  }, [activeTab, setLastTab]);

  // Auto-suggest: fetch top 5 across all categories as user types (from 1 char for instant results)
  useEffect(() => {
    const q = search.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }
    let cancelled = false;
    setSuggestLoading(true);
    const handle = setTimeout(async () => {
      try {
        const queryVariants = expandClinicalSearchQueries(q);
        const results = await Promise.all(
          queryVariants.map((search_query) => supabase.rpc("search_scenarios", { search_query }))
        );
        if (cancelled) return;
        const firstError = results.find((result) => result.error)?.error;
        if (firstError) throw firstError;
        const raw = Array.from(
          new Map(
            results
              .flatMap((result) => (result.data as Scenario[]) || [])
              .map((scenario) => [scenario.id, scenario])
          ).values()
        );
        setSuggestions(rankSearchScenarios(q, raw).slice(0, 5));
      } catch (e) {
        if (!cancelled) setSuggestions([]);
        console.error("Suggest error:", e);
      } finally {
        if (!cancelled) setSuggestLoading(false);
      }
    }, 60);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [search]);

  // Reset highlight when suggestions change
  useEffect(() => { setHighlightIdx(-1); }, [suggestions]);

  // Click outside to close (suggestions + focus panel)
  useEffect(() => {
    if (!suggestOpen && !searchFocused) return;
    const onClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
        setSearchFocused(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSuggestOpen(false);
        setSearchFocused(false);
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [suggestOpen, searchFocused]);

  const isSearching = debouncedSearch.trim().length >= 3;

  const fetchScenarios = useCallback(async () => {
    // When searching, run a global cross-category search even without an active tab.
    if (!activeTab && !isSearching) return;
    setLoading(true);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      if (debouncedSearch.trim()) {
        // Global search across ALL categories — don't filter by activeTab.
        const q = debouncedSearch.trim();
        const queryVariants = expandClinicalSearchQueries(q);
        const [scenarioResults, mcqRes] = await Promise.all([
          Promise.all(
            queryVariants.map((search_query) => supabase.rpc("search_scenarios", { search_query }))
          ),
          supabase
            .from("mcq_questions")
            .select("id, external_id, topic, difficulty, stem, explanation")
            .eq("active", true)
            .or(
              queryVariants
                .slice(0, 6)
                .map((v) => v.replace(/[%,()]/g, " ").trim())
                .filter(Boolean)
                .map((v) => `stem.ilike.%${v}%,explanation.ilike.%${v}%,topic.ilike.%${v}%`)
                .join(","),
            )
            .limit(20),
        ]);
        const firstError = scenarioResults.find((result) => result.error)?.error;
        if (firstError) throw firstError;
        const raw = Array.from(
          new Map(
            scenarioResults
              .flatMap((result) => (result.data as Scenario[]) || [])
              .map((scenario) => [scenario.id, scenario])
          ).values()
        );

        const ranked = rankSearchScenarios(q, raw);

        setAllSearchResults(ranked);
        setMcqResults(((mcqRes.data as McqSearchResult[] | null) ?? []).slice(0, 12));
        setTotalCount(ranked.length);
        setScenarios(ranked);
        // Persist successful, non-trivial search
        if (ranked.length > 0) recent.add(q);
      } else {
        setAllSearchResults([]);
        setMcqResults([]);
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
      setAllSearchResults([]);
      setMcqResults([]);
      setScenarios([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTab, currentPage, recent.add, isSearching]);

  useEffect(() => { fetchScenarios(); }, [fetchScenarios]);

  // Per-urgency counts within current search results
  const urgencyCounts = (() => {
    const c = { critical: 0, urgent: 0, routine: 0 };
    for (const s of allSearchResults) c[detectUrgency(s)]++;
    return c;
  })();

  const openAI = (s: Scenario) => { setAiScenario(s); setAiOpen(true); };

  /** Open the Adaptive Hub sheet for a category instead of jumping directly to the list. */
  const openHub = (cat: ScenarioCategory) => {
    setHubCategory(cat);
    setHubOpen(true);
  };

  /** Open a scenario sheet AND track it as "last scenario" for resume + most-viewed. */
  const openScenarioSheet = (s: Scenario) => {
    setLastScenario({ id: s.id, title: s.title_en, category: s.category as TabId });
    setSheetScenario(s);
    setSheetOpen(true);
  };

  /** Resolve a scenario by id (for "Most viewed" → open). Falls back to a single fetch. */
  const openScenarioById = useCallback(async (id: string, title: string) => {
    const known = scenarios.find((x) => x.id === id) || allSearchResults.find((x) => x.id === id);
    if (known) { openScenarioSheet(known); return; }
    try {
      const { data } = await supabase.from("medical_scenarios").select("*").eq("id", id).maybeSingle();
      if (data) openScenarioSheet(data as Scenario);
      else console.warn("Scenario not found:", id, title);
    } catch (e) { console.error(e); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarios, allSearchResults]);



  const totalScenarios = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen gradient-paper text-foreground flex flex-col w-full mx-auto relative tabular-nums">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: "radial-gradient(hsl(0 0% 10%) 1px, transparent 1px)", backgroundSize: "3px 3px" }}
        aria-hidden="true"
      />

      <header
        className={`sticky top-0 z-20 px-4 sm:px-5 bg-card/95 backdrop-blur-md border-b border-border/60 transition-all duration-200 ${
          scrolled ? "pb-3" : "pb-4"
        }`}
        style={{ paddingTop: `calc(env(safe-area-inset-top) + ${scrolled ? "0.5rem" : "0.75rem"})` }}
      >
        <div className="relative max-w-lg mx-auto">
          {/* App bar — title + actions (native style) */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab(null);
                setSearch("");
                setSuggestOpen(false);
                setSearchFocused(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-label="Go to home"
              className="min-w-0 flex-1 flex items-center gap-2 text-start cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:opacity-80 transition-opacity"
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-primary text-primary-foreground shrink-0 shadow-sm">
                <Stethoscope className="w-4 h-4" strokeWidth={2.5} />
              </span>
              <h1 className="font-bold tracking-tight leading-tight text-foreground text-[17px] truncate">
                {logoText.trim() || "OB/GYN Reference"}
              </h1>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={toggleDark}
                className="p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
              </button>
            </div>
          </div>

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
                if (search.trim().length >= 3) setSuggestOpen(true);
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

            {/* Popular search chips — shown on focus when query is empty.
                Rendered as an absolute overlay (like the suggestions dropdown)
                so the search input + icon never shift vertically. */}
            <AnimatePresence>
              {searchFocused && search.trim().length < 3 && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 right-0 top-full mt-2 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/10 overflow-hidden z-30 p-3"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-2 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-destructive" />
                      <span className="eyebrow text-muted-foreground">Urgent OB/GYN first</span>
                    </div>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setSearchFocused(false); setSuggestOpen(false); }}
                      aria-label="Close suggestions"
                      className="p-1 rounded-md hover:bg-muted transition text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Massive PPH", cat: "or_labor" as const },
                      { label: "Eclampsia", cat: "or_labor" as const },
                      { label: "Shoulder dystocia", cat: "or_labor" as const },
                      { label: "Cord prolapse", cat: "or_labor" as const },
                      { label: "Placental abruption", cat: "or_labor" as const },
                      { label: "Ruptured ectopic", cat: "clinic" as const },
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

                  {/* 🔥 High-priority specialist topics — hardest procedures, skills, tricks */}
                  <div className="flex items-center gap-1.5 mt-4 mb-2 px-0.5">
                    <span className="text-[11px]">🔥</span>
                    <span className="eyebrow text-muted-foreground">High-yield OB/GYN & fertility</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { emoji: "⚡", label: "Shoulder dystocia", hint: "HELPERR drill", cat: "or_labor" as const, gradient: "from-rose-500/12 to-red-500/5", border: "border-rose-500/25" },
                      { emoji: "🩸", label: "Massive PPH", hint: "4 T's protocol", cat: "qa" as const, gradient: "from-red-500/12 to-pink-500/5", border: "border-red-500/25" },
                      { emoji: "🫀", label: "Eclampsia", hint: "MgSO₄ dosing", cat: "qa" as const, gradient: "from-violet-500/12 to-fuchsia-500/5", border: "border-violet-500/25" },
                      { emoji: "🧬", label: "OHSS / IVF", hint: "Fertility emergency", cat: "clinic" as const, gradient: "from-emerald-500/12 to-teal-500/5", border: "border-emerald-500/25" },
                      { emoji: "🔪", label: "C-section tricks", hint: "Difficult delivery", cat: "or_labor" as const, gradient: "from-amber-500/12 to-orange-500/5", border: "border-amber-500/25" },
                      { emoji: "👶", label: "Breech delivery", hint: "Maneuvers", cat: "or_labor" as const, gradient: "from-sky-500/12 to-blue-500/5", border: "border-sky-500/25" },
                    ].map((item, idx) => (
                      <motion.button
                        key={item.label}
                        type="button"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + idx * 0.03, type: "spring", stiffness: 260, damping: 22 }}
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
                            <p className="text-[11px] font-bold text-foreground leading-tight break-words">{item.label}</p>
                            <p className="text-[9px] text-muted-foreground leading-tight mt-0.5 break-words">{item.hint}</p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {suggestOpen && search.trim().length >= 3 && (
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
                    <div className="py-5 px-4 text-center space-y-3">
                      <p className="text-[12px] font-semibold text-foreground">
                        No matches for <span className="text-primary">"{search.trim()}"</span>
                      </p>
                      <p className="text-[10.5px] text-muted-foreground leading-snug">
                        Try a shorter keyword, check spelling, or ask the AI Mentor for a clinical answer.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const q = search.trim();
                          setSuggestOpen(false);
                          setSearchFocused(false);
                          openAI({
                            id: "search-query",
                            category: "qa",
                            title_en: q,
                            situation_en: q,
                            action_en: "",
                            script_en: "",
                            synonyms: null,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[11px] font-bold shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Sparkles className="w-3 h-3" />
                        Ask AI about "{search.trim()}"
                      </button>
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
                                <p className="text-[12px] font-semibold text-foreground leading-tight break-words line-clamp-2">
                                  {highlightText(s.title_en, suggestHl)}
                                </p>
                                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 break-words line-clamp-1">
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
                            // Global results — no tab needed.
                            setActiveTab(null);
                            setSuggestOpen(false);
                            setSearchFocused(false);
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
      <main className="flex-1 px-4 sm:px-5 pb-8 w-full max-w-lg mx-auto">
        {/* Category tabs — hidden during search to keep results focused */}
        {activeTab && !isSearching && (
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
                onClick={() => { if (active) setActiveTab(null); else openHub(id); }}
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
                <span className="relative flex-1 min-w-0 text-left leading-[1.15] text-[10.5px] break-words line-clamp-2">{tabLabel(id)}</span>
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
        {!activeTab && !isSearching ? (
          <>
            {/* Desktop-only ⌘K hint — hidden on mobile to avoid duplicating the main search bar */}
            <motion.button
              type="button"
              onClick={() => setPaletteOpen(true)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className="hidden sm:flex mt-4 w-full items-center gap-2 px-3.5 h-12 rounded-2xl bg-card border border-border/60 hover:border-primary/50 shadow-editorial group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
              aria-label="Open command palette"
            >
              <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="flex-1 text-left text-[13px] text-muted-foreground truncate">
                {t("searchPlaceholder")}
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground border border-border/60">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground border border-border/60">K</kbd>
              </span>
            </motion.button>

            {/* Continue Where You Left Off — only when lastScenario exists */}
            <AnimatePresence>
              {activity.lastScenario && (
                <motion.div
                  key="continue"
                  initial={{ opacity: 0, y: 8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="relative rounded-2xl p-3.5 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent border border-primary/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/80">
                        Continue where you left off
                      </p>
                      <p className="text-[13px] font-bold text-foreground leading-tight break-words line-clamp-2 mt-0.5">
                        {activity.lastScenario.title}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const ref = activity.lastScenario;
                        if (ref) openScenarioById(ref.id, ref.title);
                      }}
                      className="rounded-full text-[11px] h-8 px-3.5 gap-1 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 ease-out"
                    >
                      Resume
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <HomeHero
            totalScenarios={totalScenarios}
            categoryCounts={categoryCounts}
            onSelectCategory={(id) => { openHub(id); }}
            onOpenAI={() => {
              const btn = document.querySelector<HTMLButtonElement>('[data-floating-ai-bot="true"]');
              if (btn) btn.click();
              else setAiOpen(true);
            }}
            onOpenSurgery={() => setSurgerySheetOpen(true)}
            onOpenExams={() => setExamsSheetOpen(true)}
            onOpenClinic={() => setClinicSheetOpen(true)}
            tabLabels={{
              qa: tabLabel("qa"),
              clinic: tabLabel("clinic"),
              or_labor: tabLabel("or_labor"),
              behavior: tabLabel("behavior"),
            }}
            onSearchChip={(q) => {
              setSearch(q);
              setLastSearch(q);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onSectionQuery={(category, q) => {
              setActiveTab(category);
              setLastTab(category as TabId);
              setSearch(q);
              setLastSearch(q);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onOpenDailyCase={(c) => openScenarioById(c.id, c.title_en)}
            />
          </>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : (isSearching ? (allSearchResults.length === 0 && mcqResults.length === 0) : scenarios.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[260px]">{t("noResults")}</p>
            {isSearching && (
              <Button
                size="sm"
                onClick={() => {
                  const q = debouncedSearch.trim();
                  openAI({
                    id: "search-query",
                    category: "qa",
                    title_en: q,
                    situation_en: q,
                    action_en: "",
                    script_en: "",
                    synonyms: null,
                  });
                }}
                className="rounded-full text-[11px] h-9 px-4 gap-1.5 bg-gradient-to-r from-primary to-primary/80"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask AI about "{debouncedSearch.trim()}"
              </Button>
            )}
            {search && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                }}
                className="rounded-full text-[11px] h-8 px-3.5"
              >
                <X className="w-3 h-3 mr-1" />
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* AI shortcut banner — appears at the top of every search result list */}
            {isSearching && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  const q = debouncedSearch.trim();
                  openAI({
                    id: "search-query",
                    category: "qa",
                    title_en: q,
                    situation_en: q,
                    action_en: "",
                    script_en: "",
                    synonyms: null,
                  });
                }}
                className="group relative overflow-hidden w-full mt-4 rounded-2xl p-3 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 flex items-center gap-3 text-left"
              >
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                  aria-hidden
                />
                <span className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </span>
                <span className="relative flex-1 min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-white/80">
                    Ask AI Mentor
                  </span>
                  <span className="block text-[13px] font-bold leading-tight break-words line-clamp-2 mt-0.5">
                    "{debouncedSearch.trim()}"
                  </span>
                </span>
                <ChevronRight className="relative w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            )}

            <div className="flex items-center justify-between mb-3 mt-4 px-1 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isSearching ? (
                  <>
                    <div className="p-1 rounded-lg bg-gradient-to-br from-primary to-primary/70">
                      <Search className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[15px] font-bold text-foreground leading-tight truncate">
                      Search results
                    </h2>
                  </>
                ) : (
                  <>
                    {(() => {
                      const cfg = categoryConfig[activeTab!];
                      return (
                        <div className={`p-1 rounded-lg ${cfg.iconBg}`}>
                          <PhIcon name={cfg.phName} size={16} tone="white" />
                        </div>
                      );
                    })()}
                    <h2 className="text-[15px] font-bold text-foreground leading-tight truncate">{tabLabel(activeTab!)}</h2>
                  </>
                )}
              </div>
              <span className="text-[10px] bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-bold tabular-nums shrink-0">
                {formatNumber(isSearching ? allSearchResults.length + mcqResults.length : totalCount)} {isSearching ? "matches" : "items"}
              </span>
            </div>

            {isSearching && allSearchResults.length > 0 && (
              <div className="mb-3 rounded-2xl border border-border/70 bg-card px-3 py-2.5 shadow-editorial">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground leading-tight">
                      Priority-first clinical view
                    </p>
                    <p className="text-[12px] text-foreground/80 font-semibold leading-snug mt-1">
                      Critical protocols and closest title matches are shown first.
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[18px] font-black tabular-nums text-primary leading-none">{formatNumber(urgencyCounts.critical)}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground mt-1">critical</p>
                  </div>
                </div>
              </div>
            )}

            {isSearching ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-info/20 bg-info-soft/70 px-3.5 py-3 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-info mt-0.5 shrink-0" strokeWidth={2.5} />
                  <p className="text-[11px] leading-relaxed text-foreground/80 font-semibold">
                    Results are ranked by title relevance, clinical synonyms, and scenario context, with higher-priority cases surfaced first.
                  </p>
                </div>
                {allSearchResults.map((item, idx) => (
                  <ClinicalSearchResultCard
                    key={item.id}
                    scenario={item}
                    index={idx}
                    onOpen={() => openScenarioSheet(item)}
                    categoryConfig={categoryConfig}
                    categoryLabel={tabLabel(item.category)}
                    query={debouncedSearch}
                  />
                ))}
                <McqSearchSection results={mcqResults} query={debouncedSearch} />
                {allSearchResults.length === 0 && mcqResults.length === 0 && !loading && (
                  <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
                    <p className="text-sm font-bold text-foreground mb-1">
                      No results for "{debouncedSearch.trim()}"
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      Try a different spelling or clinical term (e.g. "PPH" instead of "PHP").
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 cv-auto">
                  {scenarios.map((item, idx) => (
                    <ScenarioCard
                      key={item.id}
                      id={item.id}
                      title={item.title_en}
                      situation={item.situation_en}
                      category={item.category}
                      index={idx}
                      onOpen={() => openScenarioSheet(item)}
                      categoryConfig={categoryConfig}
                      action={item.action_en}
                      script={item.script_en}
                      synonyms={item.synonyms}
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
          <nav aria-label="Legal" className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 pt-3 text-[11px]">
            <Link to="/about" className="text-muted-foreground hover:text-gold transition-colors underline-offset-4 hover:underline">About</Link>
            <span className="text-border" aria-hidden="true">·</span>
            <Link to="/terms" className="text-muted-foreground hover:text-gold transition-colors underline-offset-4 hover:underline">Terms of Use</Link>
            <span className="text-border" aria-hidden="true">·</span>
            <Link to="/privacy" className="text-muted-foreground hover:text-gold transition-colors underline-offset-4 hover:underline">Privacy</Link>
            <span className="text-border" aria-hidden="true">·</span>
            <Link to="/disclaimer" className="text-muted-foreground hover:text-gold transition-colors underline-offset-4 hover:underline">Disclaimer</Link>
          </nav>
          <p className="text-[9px] text-muted-foreground/60 tracking-wider pt-2 uppercase">
            Educational Use Only · Not a Medical Device
          </p>
          <div className="pt-3 flex justify-center">
            <RefreshDataButton />
          </div>
        </div>
      </footer>

      <AIChatDrawer open={aiOpen} onOpenChange={setAiOpen} scenario={aiScenario} />
      <SmartBottomSheet
        open={hubOpen}
        onOpenChange={setHubOpen}
        tab={hubCategory as TabId | null}
        tabLabel={hubCategory ? tabLabel(hubCategory) : ""}
        onBrowse={() => {
          if (hubCategory) { setActiveTab(hubCategory); setLastTab(hubCategory as TabId); setSearch(""); }
        }}
        onMCQs={() => { window.location.href = "/exams"; }}
        onQuickReference={() => { window.location.href = "/tools"; }}
        onAskAI={() => {
          const btn = document.querySelector<HTMLButtonElement>('[data-floating-ai-bot="true"]');
          if (btn) btn.click();
          else setAiOpen(true);
        }}
        onPickTopic={(q) => {
          if (hubCategory) { setActiveTab(hubCategory); setLastTab(hubCategory as TabId); setSearch(q); setLastSearch(q); }
        }}
        onOpenScenario={(id, title) => openScenarioById(id, title)}
      />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelect={(s) => { setActiveTab(s.category); openScenarioSheet(s as Scenario); }}
      />
      <SurgeryCategoriesSheet open={surgerySheetOpen} onOpenChange={setSurgerySheetOpen} />
      <ExamsFlagsSheet open={examsSheetOpen} onOpenChange={setExamsSheetOpen} />
      <ClinicTopicsSheet
        open={clinicSheetOpen}
        onOpenChange={setClinicSheetOpen}
        total={categoryCounts.clinic ?? 0}
        onBrowseAll={() => { setActiveTab("clinic"); setSearch(""); }}
        onPickTopic={(q) => { setActiveTab("clinic"); setSearch(q); }}
      />
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
