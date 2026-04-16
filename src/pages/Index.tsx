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

          {/* Quick Stats Row */}
          <motion.div
            className="flex items-center gap-2 mb-3"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
          >
            <div className="flex-1 flex items-center gap-1.5 px-2 py-2 rounded-xl bg-card border border-border/40 shadow-sm min-w-0">
              <div className="p-1 rounded-md bg-gradient-to-br from-rose-500 to-rose-600 shrink-0">
                <GraduationCap className="w-3 h-3 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground font-medium leading-tight truncate">Scenarios</p>
                <p className="text-xs font-black text-foreground tabular-nums">{totalScenarios}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-1.5 px-2 py-2 rounded-xl bg-card border border-border/40 shadow-sm min-w-0">
              <div className="p-1 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground font-medium leading-tight truncate">Categories</p>
                <p className="text-xs font-black text-foreground">4</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-1.5 px-2 py-2 rounded-xl bg-card border border-border/40 shadow-sm min-w-0">
              <div className="p-1 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground font-medium leading-tight truncate">AI Bot</p>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">24/7</p>
              </div>
            </div>
          </motion.div>

          {/* Category Cards */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {tabIds.map((id, idx) => {
              const config = categoryConfig[id];
              const Icon = config.icon;
              const active = activeTab === id;
              const count = categoryCounts[id];
              return (
                <motion.button
                  key={id}
                  onClick={() => setActiveTab(active ? null : id)}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + idx * 0.06, type: "spring", stiffness: 150, damping: 14 }}
                  whileTap={{ scale: 0.93 }}
                  className={`relative overflow-hidden rounded-xl p-2 text-center transition-all duration-300 border ${
                    active
                      ? `${config.borderColor} ${config.bgLight} shadow-md`
                      : "border-border/40 bg-card hover:shadow-sm"
                  }`}
                >
                  <motion.div
                    className={`mx-auto p-1.5 rounded-lg shadow-sm mb-1 w-fit ${active ? config.iconBg : "bg-muted/80"}`}
                    animate={active ? { rotate: [0, -8, 8, -4, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-muted-foreground"}`} />
                  </motion.div>
                  <p className={`text-[9px] font-bold leading-tight truncate ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {i.tabs[id]}
                  </p>
                  <p className={`text-[11px] font-black tabular-nums mt-0.5 ${active ? config.iconColor : "text-muted-foreground/40"}`}>
                    {count}
                  </p>
                  {active && (
                    <motion.div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config.gradient}`}
                      layoutId="activeTab"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Search */}
          {activeTab && (
            <motion.div
              className="relative"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={i.searchPlaceholder}
                className="h-10 bg-card border-border/50 rounded-xl text-sm pl-10 shadow-sm"
              />
            </motion.div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-6">
        {!activeTab ? (
          <div className="space-y-3">
            {/* Hero CTA — AI + WhatsApp compact */}
            <motion.div
              className="rounded-2xl overflow-hidden border border-border/40 shadow-sm"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
            >
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-800 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-white">AI Medical Assistant</h2>
                    <p className="text-[10px] text-white/70 leading-tight mt-0.5">
                      Discuss any clinical scenario 24/7 — instant expert guidance
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-400/20 border border-green-400/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-green-300">LIVE</span>
                  </div>
                </div>
              </div>
              <div className="bg-card px-4 py-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">
                    By <strong className="text-foreground">Dr. Sahar Elkhodiry</strong>
                  </p>
                  <p className="text-[10px] text-muted-foreground">Consultant OB/GYN</p>
                </div>
                <a
                  href="https://wa.me/966500000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold transition-colors shadow-sm"
                >
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>
            </motion.div>

            {/* Featured Topics — with show more/less */}
            <motion.div
              className="rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
            >
              <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    {featuredTopics.length} topics
                  </span>
                  <h2 className="text-xs font-bold text-foreground">Clinical Skills Bank</h2>
                </div>
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div className="px-3 pb-2 space-y-1">
                <AnimatePresence initial={false}>
                  {visibleTopics.map((topic, idx) => (
                    <motion.button
                      key={topic.label}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, delay: idx > 7 ? (idx - 8) * 0.03 : 0 }}
                      onClick={() => { setActiveTab("qa"); setSearch(topic.label.split("—")[0].trim()); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${topic.bg} hover:opacity-80 transition-all text-left group`}
                    >
                      <topic.icon className={`w-3.5 h-3.5 ${topic.color} shrink-0`} />
                      <span className="text-[11px] font-medium text-foreground flex-1 leading-tight">{topic.label}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setShowAllTopics(!showAllTopics)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold text-primary hover:bg-muted/50 transition-colors border-t border-border/30"
              >
                {showAllTopics ? "Show Less" : `Show All ${featuredTopics.length} Topics`}
                <motion.div animate={{ rotate: showAllTopics ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>
            </motion.div>

            {/* About — compact */}
            <motion.div
              className="rounded-2xl bg-card border border-border/40 p-4 shadow-sm"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-xs font-bold text-foreground">About This App</h2>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                A comprehensive clinical reference for OB/GYN professionals — real-world scenarios, expert actions, and patient scripts curated by <strong className="text-foreground">Dr. Sahar Elkhodiry</strong>.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { icon: Stethoscope, label: "Clinical scenarios", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-950/30" },
                  { icon: Scissors, label: "OR & Labor protocols", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
                  { icon: MessageCircle, label: "Communication", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
                  { icon: HelpCircle, label: "Q&A + Skills Bank", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${item.bg}`}>
                    <item.icon className={`w-3 h-3 ${item.color} shrink-0`} />
                    <span className="text-[10px] text-foreground font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              className="flex items-center justify-center gap-2 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="h-px flex-1 bg-border/50" />
              <p className="text-[10px] text-muted-foreground font-medium px-2">
                Select a category above to explore
              </p>
              <div className="h-px flex-1 bg-border/50" />
            </motion.div>
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
      <FloatingAIBot />
    </div>
  );
}
