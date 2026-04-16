import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sun, Moon, Stethoscope, Scissors, MessageCircle, HelpCircle, BookOpen, TrendingUp, Heart, Activity, Sparkles, ChevronRight, ChevronDown, Baby, Syringe, ShieldCheck, Brain, Phone, Bot, Zap, GraduationCap, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { AIChatDrawer } from "@/components/AIChatDrawer";
import { FloatingAIBot } from "@/components/FloatingAIBot";
import { Pagination } from "@/components/Pagination";
import { t } from "@/lib/i18n";

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

const featuredTopics = [
  { icon: Baby, label: "Preterm Labor — Early Signs & Management", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
  { icon: ShieldCheck, label: "Preeclampsia Detection & Prevention", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { icon: Activity, label: "CTG Reading — Pattern Recognition Secrets", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { icon: Syringe, label: "PPH Algorithm — HAEMOSTASIS Protocol", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { icon: Scissors, label: "Cesarean Technique Refinements", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/30" },
  { icon: Brain, label: "Eclamptic Seizure — First 5 Minutes", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { icon: Stethoscope, label: "VBAC Patient Selection & Counseling", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-950/30" },
  { icon: HelpCircle, label: "Ectopic Pregnancy — Diagnosis You Must Not Miss", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
  { icon: Heart, label: "Neonatal Resuscitation — The Golden Minute", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
  { icon: MessageCircle, label: "Breaking Bad News — SPIKES Protocol", color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30" },
  { icon: Syringe, label: "Amniotomy — When & How to Perform", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
  { icon: Activity, label: "Cord Prolapse — Immediate Response Steps", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
  { icon: ShieldCheck, label: "Gestational Diabetes — Insulin vs Metformin", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { icon: Scissors, label: "Episiotomy Repair — Step-by-Step Technique", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/30" },
  { icon: Brain, label: "Placenta Accreta Spectrum — Surgical Planning", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { icon: Baby, label: "Breech Presentation — ECV Technique & Timing", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
  { icon: Stethoscope, label: "Ovarian Torsion — Rapid Diagnosis Clues", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-950/30" },
  { icon: HelpCircle, label: "HELLP Syndrome — Labs & Management", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
  { icon: Heart, label: "Shoulder Dystocia — McRoberts & Beyond", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
  { icon: MessageCircle, label: "Consent for Emergency C-Section — Key Points", color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30" },
  { icon: Syringe, label: "Oxytocin Augmentation — Safe Dosing Protocol", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { icon: Activity, label: "Fetal Bradycardia — Decision Tree", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { icon: Brain, label: "Cervical Cerclage — Indications & Technique", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
  { icon: ShieldCheck, label: "DVT in Pregnancy — Prophylaxis & Treatment", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-950/30" },
  { icon: Scissors, label: "Forceps vs Vacuum — When to Choose Which", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/30" },
];

const Logo = () => (
  <div className="relative w-11 h-11">
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500/20 via-blue-500/20 to-emerald-500/20 blur-sm" />
    <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800 shadow-lg shadow-rose-500/25 flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <path d="M20 35s-12-7.5-12-16c0-4.5 3.5-8 7.5-8 2.5 0 4.5 1.5 4.5 1.5S22 9.5 24.5 9.5c4 0 7.5 3.5 7.5 8 0 8.5-12 16-12 16z"
          fill="white" fillOpacity="0.9" />
        <polyline points="8,22 14,22 16,17 19,27 22,20 25,24 28,22 33,22"
          stroke="hsl(0, 72%, 35%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

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

  const totalScenarios = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute top-0 right-0 w-72 h-[600px] bg-gradient-to-l from-blue-400/8 via-blue-300/4 to-transparent dark:from-blue-500/6 dark:via-blue-400/2 pointer-events-none" />
      <div className="absolute top-40 -left-10 w-40 h-40 bg-gradient-to-br from-rose-300/8 to-transparent dark:from-rose-500/4 pointer-events-none rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-300/8 to-transparent dark:from-emerald-500/4 pointer-events-none rounded-full blur-3xl" />

      {/* Premium gradient bar */}
      <div className="h-1 bg-gradient-to-r from-rose-500 via-blue-500 to-emerald-500 relative z-10" />

      {/* Header */}
      <header className="relative px-4 pt-4 pb-3 overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/30 via-transparent to-transparent dark:from-rose-950/10" />

        <div className="relative">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Logo />
              </motion.div>
              <div className="min-w-0">
                <motion.h1
                  className="text-xl font-black tracking-tight relative overflow-hidden"
                  style={{ color: 'hsl(215, 80%, 22%)' }}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 150, damping: 12 }}
                >
                  <span className="relative z-10">Tips & Tricks</span>
                  <motion.span
                    className="absolute inset-0 z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                  />
                </motion.h1>
                <motion.p
                  className="text-[10px] text-muted-foreground leading-tight font-semibold"
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25, type: "spring", stiffness: 120, damping: 14 }}
                >
                  {i.appSubtitle}
                </motion.p>
              </div>
            </div>
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl bg-card border border-border/50 hover:bg-muted transition-all shadow-sm"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
            </button>
          </div>

          {/* Search bar — always present */}
          <motion.div
            className="relative"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => { if (!activeTab) setActiveTab("qa"); }}
              placeholder={i.searchPlaceholder}
              className="h-12 bg-card border-border/60 rounded-2xl text-sm pl-11 pr-3 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </motion.div>

          {/* Compact category chips */}
          <motion.div
            className="flex items-center gap-1.5 mt-3 overflow-x-auto scrollbar-none"
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border ${
                    active
                      ? `${config.borderColor} ${config.bgLight} ${config.iconColor}`
                      : "border-border/40 bg-card text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {i.tabs[id]}
                  <span className="text-[10px] opacity-60 tabular-nums">{categoryCounts[id]}</span>
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
            className="flex flex-col items-center justify-center text-center pt-10 pb-8 px-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500/10 via-blue-500/10 to-emerald-500/10 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight mb-2 leading-snug">
              Clinical wisdom,<br />one search away
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px] mb-6">
              {totalScenarios}+ OB/GYN scenarios, scripts & protocols by Dr. Sahar Elkhodiry.
            </p>

            <div className="w-full space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2">
                Try searching
              </p>
              {[
                { icon: ShieldCheck, label: "Preeclampsia management" },
                { icon: Activity, label: "PPH protocol" },
                { icon: Baby, label: "Shoulder dystocia" },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => { setActiveTab("qa"); setSearch(s.label); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-card border border-border/40 hover:border-primary/40 hover:bg-muted/40 transition-all text-left"
                >
                  <s.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[12px] text-foreground font-medium flex-1">{s.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                </button>
              ))}
            </div>
          </motion.div>

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

      <AIChatDrawer open={aiOpen} onOpenChange={setAiOpen} scenario={aiScenario} />
      <FloatingAIBot />
    </div>
  );
}
