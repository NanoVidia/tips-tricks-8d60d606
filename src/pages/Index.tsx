import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Sun, Moon, Stethoscope, Scissors, MessageCircle, HelpCircle, Sparkles, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { AIChatDrawer } from "@/components/AIChatDrawer";
import { DisclaimerSplash, useDisclaimer } from "@/components/DisclaimerSplash";

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

const tabs = [
  { id: "clinic" as ScenarioCategory, label: "Clinic", icon: Stethoscope },
  { id: "or_labor" as ScenarioCategory, label: "OR/Labor", icon: Scissors },
  { id: "behavior" as ScenarioCategory, label: "Behavior", icon: MessageCircle },
  { id: "qa" as ScenarioCategory, label: "Q&A Bank", icon: HelpCircle },
];

const Logo = () => (
  <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none">
    {[0, 60, 120, 180, 240, 300].map((angle) => (
      <ellipse key={angle} cx="32" cy="18" rx="6" ry="12" className="fill-primary/30" transform={`rotate(${angle} 32 32)`} />
    ))}
    <circle cx="32" cy="32" r="6" className="fill-primary" />
    <polyline points="8,32 20,32 24,22 28,42 32,28 36,36 40,32 56,32" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

function ClinicalCard({ item, onAI }: { item: Scenario; onAI: () => void }) {
  return (
    <AccordionItem value={item.id} className="border-b border-border/50">
      <AccordionTrigger className="py-3 px-1 text-sm font-medium hover:no-underline">
        <div className="text-left">
          <div>{item.title_en}</div>
          <div dir="rtl" className="text-xs text-muted-foreground mt-0.5 font-normal">{item.title_ar}</div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-1 pb-4">
        <div className="space-y-3">
          {[
            { label: "Situation", en: item.situation_en, ar: item.situation_ar },
            { label: "Clinical Action", en: item.action_en, ar: item.action_ar },
            { label: "Patient Script", en: item.script_en, ar: item.script_ar },
          ].map((section) => (
            <div key={section.label} className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs font-semibold text-primary mb-1.5">{section.label}</div>
              <p className="text-sm leading-relaxed">{section.en}</p>
              <p dir="rtl" className="text-sm leading-relaxed text-muted-foreground mt-1.5">{section.ar}</p>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={onAI}
            className="w-full rounded-xl border-primary/20 text-primary hover:bg-primary/5 gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Discuss with AI
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
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiScenario, setAiScenario] = useState<Scenario | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const { accepted, accept } = useDisclaimer();

  const toggleDark = () => {
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    try {
      if (debouncedSearch.trim()) {
        const { data, error } = await supabase.rpc("search_scenarios", {
          search_query: debouncedSearch.trim(),
          category_filter: activeTab,
        });
        if (error) throw error;
        setScenarios((data as Scenario[]) || []);
      } else {
        const { data, error } = await supabase
          .from("medical_scenarios")
          .select("*")
          .eq("category", activeTab)
          .order("created_at");
        if (error) throw error;
        setScenarios((data as Scenario[]) || []);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTab]);

  useEffect(() => { fetchScenarios(); }, [fetchScenarios]);

  const openAI = (s: Scenario) => {
    setAiScenario(s);
    setAiOpen(true);
  };

  if (!accepted) return <DisclaimerSplash onAccept={accept} />;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">OB/GYN Reference</h1>
            <p className="text-xs text-muted-foreground">Clinical Quick Guide</p>
          </div>
        </div>
        <button onClick={toggleDark} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Toggle dark mode">
          {dark ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
        </button>
      </header>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Smart Search — handles typos & synonyms..."
            className="pl-10 h-11 bg-card border-border/60 rounded-xl"
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
          <p className="text-center text-sm text-muted-foreground py-8">No results found.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {scenarios.map((item) => (
              <ClinicalCard key={item.id} item={item} onAI={() => openAI(item)} />
            ))}
          </Accordion>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/60 z-50">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* AI Chat Drawer */}
      <AIChatDrawer open={aiOpen} onOpenChange={setAiOpen} scenario={aiScenario} />
    </div>
  );
}
