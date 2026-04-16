import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Sun, Moon, Stethoscope, Scissors, MessageCircle, HelpCircle, BookOpen, TrendingUp, Heart, Activity, Sparkles, ChevronRight, Baby, Syringe, ShieldCheck, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { AIChatDrawer } from "@/components/AIChatDrawer";
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

const tabIds: ScenarioCategory[] = ["clinic", "or_labor", "behavior", "qa"];

const Logo = () => (
  <div className="relative w-12 h-12">
    {/* Outer glow ring */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500/20 via-blue-500/20 to-emerald-500/20 blur-sm" />
    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800 shadow-lg shadow-rose-500/25 flex items-center justify-center">
      {/* Heart with pulse line */}
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
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
      {/* Right-side blue gradient glow */}
      <div className="absolute top-0 right-0 w-72 h-[600px] bg-gradient-to-l from-blue-400/12 via-blue-300/6 to-transparent dark:from-blue-500/8 dark:via-blue-400/3 pointer-events-none" />
      <div className="absolute top-20 right-0 w-40 h-80 bg-gradient-to-bl from-sky-300/10 via-blue-200/5 to-transparent dark:from-sky-500/6 pointer-events-none blur-2xl" />

      {/* Premium gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-blue-500 to-emerald-500 relative z-10" />

      {/* Header with layered background */}
      <header className="relative px-4 pt-5 pb-4 overflow-hidden z-10">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/50 via-transparent to-transparent dark:from-rose-950/20" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/40 to-transparent dark:from-blue-900/15 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-rose-100/30 to-transparent dark:from-rose-900/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          {/* Top bar: Logo + title + dark mode */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Logo />
              </motion.div>
              <div className="min-w-0">
                <motion.h1
                  className="text-2xl font-black tracking-tight"
                  style={{ color: 'hsl(0, 72%, 30%)' }}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 150, damping: 12 }}
                >
                  Tips & Tricks
                </motion.h1>
                <motion.p
                  className="text-xs text-muted-foreground leading-tight font-semibold mt-0.5"
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

          {/* Stats banner - refined */}
          <motion.div
            className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-card border border-border/50 shadow-sm mb-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 120, damping: 14 }}
          >
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-sm"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Activity className="w-4 h-4 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{i.appTitle}</p>
              <p className="text-[11px] text-muted-foreground">{i.appCredential}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{totalScenarios}</span>
            </div>
          </motion.div>

          {/* Category Cards - enhanced with icon gradients */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {tabIds.map((id) => {
              const config = categoryConfig[id];
              const Icon = config.icon;
              const active = activeTab === id;
              const count = categoryCounts[id];
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(active ? null : id)}
                  className={`relative overflow-hidden rounded-2xl p-3.5 text-left transition-all duration-300 border ${
                    active
                      ? `${config.borderColor} ${config.bgLight} shadow-md scale-[0.97]`
                      : "border-border/40 bg-card hover:border-border hover:shadow-md hover:scale-[0.99]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className={`p-2 rounded-xl shadow-sm ${active ? config.iconBg : "bg-muted/80"}`}>
                      <Icon className={`w-4 h-4 ${active ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <span className={`text-xl font-black tabular-nums ${active ? config.iconColor : "text-muted-foreground/40"}`}>
                      {count}
                    </span>
                  </div>
                  <p className={`text-xs font-bold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {i.tabs[id]}
                  </p>
                  {active && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Search */}
          {activeTab && (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={i.searchPlaceholder}
                className="h-11 bg-card border-border/50 rounded-2xl text-sm pl-10 shadow-sm"
              />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-6">
        {!activeTab ? (
          <div className="py-6 space-y-4">
            {/* About the App */}
            <motion.div
              className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm space-y-3"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-sm font-bold text-foreground">About This App</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A comprehensive clinical reference for OB/GYN professionals. Browse real-world scenarios, expert clinical actions, and model patient communication scripts — all curated by <strong className="text-foreground">Dr. Sahar Elkhodiry</strong>, Consultant in Obstetrics & Gynecology.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { icon: Stethoscope, label: "Clinical scenarios", color: "text-sky-500" },
                  { icon: Scissors, label: "OR & Labor protocols", color: "text-rose-500" },
                  { icon: MessageCircle, label: "Communication scripts", color: "text-amber-500" },
                  { icon: HelpCircle, label: "Q&A Bank + Skills", color: "text-emerald-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <item.icon className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                    <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Assistant highlight */}
            <motion.div
              className="rounded-2xl border border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-br from-blue-50 to-sky-50/50 dark:from-blue-950/30 dark:to-sky-950/20 p-4 shadow-sm space-y-3"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 120 }}
            >
              <div className="flex items-center gap-2.5">
                <motion.div
                  className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm shadow-blue-500/20"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">AI Medical Assistant</h2>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Available 24/7</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each scenario includes an <strong className="text-foreground">AI-powered discussion bot</strong> ready to help you <strong className="text-foreground">24 hours a day, 7 days a week</strong>. Open any clinical scenario, tap "Discuss with AI," and get instant, in-depth answers — differential diagnoses, management plans, evidence-based guidance, and more.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex -space-x-1">
                  {["bg-green-400", "bg-green-400", "bg-green-400"].map((c, idx) => (
                    <div key={idx} className={`w-2 h-2 rounded-full ${c} border border-white dark:border-gray-900`} />
                  ))}
                </div>
                <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">Online now — Ready to discuss</span>
              </div>
            </motion.div>

            {/* Featured OB/GYN Topics */}
            <motion.div
              className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm space-y-3"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 120 }}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Featured OB/GYN Topics</h2>
              </div>
              <div className="space-y-1.5">
                {[
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
                ].map((topic) => (
                  <button
                    key={topic.label}
                    onClick={() => { setActiveTab("qa"); setSearch(topic.label.split("—")[0].trim()); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${topic.bg} hover:opacity-80 transition-all text-left group`}
                  >
                    <topic.icon className={`w-3.5 h-3.5 ${topic.color} shrink-0`} />
                    <span className="text-[11px] font-medium text-foreground flex-1 leading-tight">{topic.label}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.p
              className="text-center text-xs text-muted-foreground font-medium pt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              ↑ Select a category above to start exploring
            </motion.p>
          </div>
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

      <AIChatDrawer open={aiOpen} onOpenChange={setAiOpen} scenario={aiScenario} />
    </div>
  );
}
