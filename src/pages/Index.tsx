import { useState, useEffect, useCallback } from "react";
import { Search, Sun, Moon, Stethoscope, Scissors, MessageCircle, HelpCircle, Globe } from "lucide-react";
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

const ITEMS_PER_PAGE = 50;

const tabIcons = {
  clinic: Stethoscope,
  or_labor: Scissors,
  behavior: MessageCircle,
  qa: HelpCircle,
};

const tabIds: ScenarioCategory[] = ["clinic", "or_labor", "behavior", "qa"];

const Logo = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
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
    <AccordionItem value={item.id} className="border-b border-border/50">
      <AccordionTrigger className="py-3 px-1 text-sm font-medium hover:no-underline">
        <div className={`${isAr ? "text-right w-full" : "text-left"}`} dir={isAr ? "rtl" : "ltr"}>
          {isAr ? item.title_ar || item.title_en : item.title_en}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-1 pb-4">
        <div className="space-y-3">
          {[
            { label: i.situation, text: isAr ? (item.situation_ar || item.situation_en) : item.situation_en, secondary: isAr ? item.situation_en : item.situation_ar },
            { label: i.clinicalAction, text: isAr ? (item.action_ar || item.action_en) : item.action_en, secondary: isAr ? item.action_en : item.action_ar },
            { label: i.patientScript, text: isAr ? (item.script_ar || item.script_en) : item.script_en, secondary: isAr ? item.script_en : item.script_ar },
          ].map((section) => (
            <div key={section.label} className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs font-semibold text-primary mb-1.5">{section.label}</div>
              <p className={`text-sm leading-relaxed ${isAr ? "text-right" : ""}`} dir={isAr ? "rtl" : "ltr"}>{section.text}</p>
              {section.secondary && (
                <p className={`text-sm leading-relaxed text-muted-foreground mt-1.5 ${!isAr ? "text-right" : ""}`} dir={!isAr ? "rtl" : "ltr"}>{section.secondary}</p>
              )}
            </div>
          ))}
          <Button
            size="sm"
            onClick={onAI}
            className="w-full rounded-md bg-[hsl(210,80%,45%)] hover:bg-[hsl(210,80%,38%)] text-white font-medium gap-2 shadow-sm"
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
  const [activeTab, setActiveTab] = useState<ScenarioCategory>("clinic");
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [aiScenario, setAiScenario] = useState<Scenario | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
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

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on tab/search change
  useEffect(() => { setCurrentPage(1); }, [activeTab, debouncedSearch]);

  const fetchScenarios = useCallback(async () => {
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
        // Get count
        const { count, error: cErr } = await supabase
          .from("medical_scenarios")
          .select("*", { count: "exact", head: true })
          .eq("category", activeTab);
        if (cErr) throw cErr;
        setTotalCount(count || 0);

        // Get page
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

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 max-w-lg mx-auto" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{i.appTitle}</h1>
            <p className="text-xs text-muted-foreground">{i.appSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleLang}
            className="px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors text-primary border border-border"
          >
            {isAr ? "EN" : "عربي"}
          </button>
          <button onClick={toggleDark} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Toggle dark mode">
            {dark ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isAr ? "right-3" : "left-3"}`} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={i.searchPlaceholder}
            className={`h-11 bg-card border-border/60 rounded-xl ${isAr ? "pr-10" : "pl-10"}`}
          />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : scenarios.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">{i.noResults}</p>
        ) : (
          <>
            <Accordion type="single" collapsible className="w-full">
              {scenarios.map((item) => (
                <ClinicalCard key={item.id} item={item} onAI={() => openAI(item)} lang={lang} />
              ))}
            </Accordion>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              lang={lang}
            />
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/60 z-50">
        <div className="max-w-lg mx-auto flex">
          {tabIds.map((id) => {
            const Icon = tabIcons[id];
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{i.tabs[id]}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AIChatDrawer open={aiOpen} onOpenChange={setAiOpen} scenario={aiScenario} />
    </div>
  );
}
