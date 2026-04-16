import { useState, useEffect, useCallback } from "react";
import { Search, Sun, Moon, Stethoscope, Scissors, MessageCircle, HelpCircle, BookOpen, TrendingUp, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { AIChatDrawer } from "@/components/AIChatDrawer";
import { DisclaimerSplash, useDisclaimer } from "@/components/DisclaimerSplash";
import { Pagination } from "@/components/Pagination";
import { type Lang, t } from "@/lib/i18n";

type ScenarioCategory = "clinic" | "or_labor" | "behavior" | "qa";

interface Scenario {
  id: string;
  category: ScenarioCategory;
  title_en: string;
  title_ar: string;
  situation_en: string;
  situation_ar: string;
  action_en: string;
  action_ar: string;
  script_en: string;
  script_ar: string;
  synonyms: string[] | null;
}

const ITEMS_PER_PAGE = 30;

const categoryConfig = {
  clinic: {
    icon: Stethoscope,
    gradient: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-500",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  or_labor: {
    icon: Scissors,
    gradient: "from-rose-500 to-rose-600",
    bgLight: "bg-rose-50 dark:bg-rose-950/40",
    iconColor: "text-rose-500",
    borderColor: "border-rose-200 dark:border-rose-800",
  },
  behavior: {
    icon: MessageCircle,
    gradient: "from-amber-500 to-amber-600",
    bgLight: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-500",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  qa: {
    icon: HelpCircle,
    gradient: "from-emerald-500 to-emerald-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
};

const tabIds: ScenarioCategory[] = ["clinic", "or_labor", "behavior", "qa"];

const Logo = () => (
  <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none">
    {[0, 60, 120, 180, 240, 300].map((angle) => (
      <ellipse key={angle} cx="32" cy="18" rx="6" ry="12" className="fill-primary/30" transform={`rotate(${angle} 32 32)`} />
    ))}
    <circle cx="32" cy="32" r="6" className="fill-primary" />
    <polyline points="8,32 20,32 24,22 28,42 32,28 36,36 40,32 56,32" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

function ClinicalCard({ item, onAI, lang }: { item: Scenario; onAI: () => void; lang: Lang }) {
  const i = t(lang);
  const isAr = lang === "ar";

  return (
    <AccordionItem value={item.id} className="border-b border-border/40 last:border-b-0">
      <AccordionTrigger className="py-3.5 px-2 text-sm font-medium hover:no-underline group">
        <div className={`flex items-center gap-2 ${isAr ? "text-right w-full flex-row-reverse" : "text-left"}`} dir={isAr ? "rtl" : "ltr"}>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
          <span className="group-hover:text-primary transition-colors">
            {isAr ? item.title_ar || item.title_en : item.title_en}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-2 pb-4">
        <div className="space-y-3">
          {[
            { label: i.situation, text: isAr ? (item.situation_ar || item.situation_en) : item.situation_en, secondary: isAr ? item.situation_en : item.situation_ar },
            { label: i.clinicalAction, text: isAr ? (item.action_ar || item.action_en) : item.action_en, secondary: isAr ? item.action_en : item.action_ar },
            { label: i.patientScript, text: isAr ? (item.script_ar || item.script_en) : item.script_en, secondary: isAr ? item.script_en : item.script_ar },
          ].map((section) => (
            <div key={section.label} className="rounded-xl bg-muted/40 p-3 border border-border/30">
              <div className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1.5">{section.label}</div>
              <p className={`text-sm leading-relaxed ${isAr ? "text-right" : ""}`} dir={isAr ? "rtl" : "ltr"}>{section.text}</p>
              {section.secondary && (
                <p className={`text-xs leading-relaxed text-muted-foreground mt-2 pt-2 border-t border-border/30 ${!isAr ? "text-right" : ""}`} dir={!isAr ? "rtl" : "ltr"}>{section.secondary}</p>
              )}
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
  const [lang, setLang] = useState<Lang>("en");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiScenario, setAiScenario] = useState<Scenario | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<ScenarioCategory, number>>({ clinic: 0, or_labor: 0, behavior: 0, qa: 0 });
  const { accepted, accept } = useDisclaimer();

  const isAr = lang === "ar";
  const i = t(lang);
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const toggleDark = () => {
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  // Fetch category counts on mount
  useEffect(() => {
    async function fetchCounts() {
      const counts: Record<string, number> = {};
      for (const cat of tabIds) {
        const { count } = await supabase
          .from("medical_scenarios")
          .select("*", { count: "exact", head: true })
          .eq("category", cat);
        counts[cat] = count || 0;
      }
      setCategoryCounts(counts as Record<ScenarioCategory, number>);
    }
    fetchCounts();
  }, []);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on tab/search change
  useEffect(() => { setCurrentPage(1); }, [activeTab, debouncedSearch]);

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
  }, [debouncedSearch, activeTab, currentPage]);

  useEffect(() => { fetchScenarios(); }, [fetchScenarios]);

  const openAI = (s: Scenario) => { setAiScenario(s); setAiOpen(true); };

  if (!accepted) return <DisclaimerSplash onAccept={accept} lang={lang} />;

  const totalScenarios = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto" dir={isAr ? "rtl" : "ltr"}>
      {/* Top gradient bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-rose-500 to-emerald-500" />

      {/* Header */}
      <header className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight" style={{ color: 'hsl(0, 72%, 30%)' }}>
                Tips & Tricks
              </h1>
              <p className="text-[10px] text-muted-foreground leading-tight">{i.appSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleLang}
              className="px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-muted transition-colors text-primary border border-border"
            >
              {isAr ? "EN" : "عربي"}
            </button>
            <button onClick={toggleDark} className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Toggle dark mode">
              {dark ? <Sun className="w-4 h-4 text-foreground" /> : <Moon className="w-4 h-4 text-foreground" />}
            </button>
          </div>
        </div>

        {/* Stats banner */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 mb-3">
          <BookOpen className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground">{i.appTitle}</p>
            <p className="text-[10px] text-muted-foreground">{i.appCredential}</p>
          </div>
          <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-bold text-primary">{totalScenarios}</span>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {tabIds.map((id) => {
            const config = categoryConfig[id];
            const Icon = config.icon;
            const active = activeTab === id;
            const count = categoryCounts[id];
            return (
              <button
                key={id}
                onClick={() => setActiveTab(active ? null : id)}
                className={`relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 border ${
                  active
                    ? `${config.borderColor} ${config.bgLight} shadow-sm scale-[0.98]`
                    : "border-border/50 bg-card hover:border-border hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${active ? config.bgLight : "bg-muted/60"}`}>
                    <Icon className={`w-4 h-4 ${active ? config.iconColor : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-lg font-bold ${active ? config.iconColor : "text-muted-foreground/60"}`}>
                    {count}
                  </span>
                </div>
                <p className={`text-xs font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {i.tabs[id]}
                </p>
                {active && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config.gradient}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Search - show when category selected */}
        {activeTab && (
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isAr ? "right-3" : "left-3"}`} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={i.searchPlaceholder}
              className={`h-10 bg-card border-border/60 rounded-xl text-sm ${isAr ? "pr-10" : "pl-10"}`}
            />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-6">
        {!activeTab ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {isAr ? "اختر قسماً للبدء" : "Select a category to explore"}
            </p>
            <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">
              {isAr
                ? "اضغط على أحد الأقسام أعلاه لعرض السيناريوهات السريرية والنصائح الطبية"
                : "Tap a category above to browse clinical scenarios, tips and model answers"}
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
          </div>
        ) : scenarios.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">{i.noResults}</p>
        ) : (
          <>
            {/* Section header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = categoryConfig[activeTab].icon;
                  return <Icon className={`w-4 h-4 ${categoryConfig[activeTab].iconColor}`} />;
                })()}
                <h2 className="text-sm font-bold text-foreground">{i.tabs[activeTab]}</h2>
              </div>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {totalCount} {isAr ? "عنصر" : "items"}
              </span>
            </div>

            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                {scenarios.map((item) => (
                  <ClinicalCard key={item.id} item={item} onAI={() => openAI(item)} lang={lang} />
                ))}
              </Accordion>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              lang={lang}
            />
          </>
        )}
      </main>

      <AIChatDrawer open={aiOpen} onOpenChange={setAiOpen} scenario={aiScenario} />
    </div>
  );
}
