import { useState, useMemo } from "react";
import { Search, Sun, Moon, Stethoscope, Scissors, MessageCircle, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { clinicData, orLaborData, behaviorData, qaData, type ClinicalItem } from "@/data/clinicalData";

const tabs = [
  { id: "clinic", label: "Clinic", icon: Stethoscope, data: clinicData },
  { id: "or", label: "OR/Labor", icon: Scissors, data: orLaborData },
  { id: "behavior", label: "Behavior", icon: MessageCircle, data: behaviorData },
  { id: "qa", label: "Q&A Bank", icon: HelpCircle, data: qaData },
] as const;

const Logo = () => (
  <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none">
    {/* Flower petals */}
    {[0, 60, 120, 180, 240, 300].map((angle) => (
      <ellipse
        key={angle}
        cx="32" cy="18" rx="6" ry="12"
        className="fill-primary/30"
        transform={`rotate(${angle} 32 32)`}
      />
    ))}
    <circle cx="32" cy="32" r="6" className="fill-primary" />
    {/* Pulse line */}
    <polyline
      points="8,32 20,32 24,22 28,42 32,28 36,36 40,32 56,32"
      className="stroke-primary"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
    />
  </svg>
);

function ClinicalCard({ item }: { item: ClinicalItem }) {
  return (
    <AccordionItem value={item.id} className="border-b border-border/50">
      <AccordionTrigger className="py-3 px-1 text-sm font-medium hover:no-underline">
        <div className="text-left">
          <div>{item.title}</div>
          <div dir="rtl" className="text-xs text-muted-foreground mt-0.5 font-normal">{item.titleAr}</div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-1 pb-4">
        <div className="space-y-3">
          {[
            { label: "Situation", en: item.situation, ar: item.situationAr },
            { label: "Clinical Action", en: item.action, ar: item.actionAr },
            { label: "Patient Script", en: item.script, ar: item.scriptAr },
          ].map((section) => (
            <div key={section.label} className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs font-semibold text-primary mb-1.5">{section.label}</div>
              <p className="text-sm leading-relaxed">{section.en}</p>
              <p dir="rtl" className="text-sm leading-relaxed text-muted-foreground mt-1.5">{section.ar}</p>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function Index() {
  const [activeTab, setActiveTab] = useState("clinic");
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);

  const toggleDark = () => {
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  const filtered = useMemo(() => {
    if (!search.trim()) return currentTab.data;
    const q = search.toLowerCase();
    return currentTab.data.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.titleAr.includes(search) ||
        item.situation.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.script.toLowerCase().includes(q)
    );
  }, [search, currentTab.data]);

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
        <button
          onClick={toggleDark}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Toggle dark mode"
        >
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
            placeholder="Smart Search..."
            className="pl-10 h-11 bg-card border-border/60 rounded-xl"
          />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4">
        <Accordion type="single" collapsible className="w-full">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No results found.</p>
          ) : (
            filtered.map((item) => <ClinicalCard key={item.id} item={item} />)
          )}
        </Accordion>
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
                className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
