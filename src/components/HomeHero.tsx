import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PhIcon, type PhIconProps } from "@/components/ui/PhIcon";
import { AIRobot } from "@/components/AIRobot";
import { EmergencyStrip } from "@/components/home/EmergencyStrip";
import { MiniCaseOfDay } from "@/components/home/MiniCaseOfDay";
import { DailyMcqWidget } from "@/components/home/DailyMcqWidget";
import { QuickToolsStrip } from "@/components/home/QuickToolsStrip";

type ScenarioCategory = "clinic" | "or_labor" | "behavior" | "qa";
type HomeTextSize = "small" | "medium" | "large";

interface DailyCaseRef {
  id: string;
  title_en: string;
  situation_en: string;
  category: ScenarioCategory;
}

interface HomeHeroProps {
  totalScenarios: number;
  categoryCounts: Record<ScenarioCategory, number>;
  onSelectCategory: (id: ScenarioCategory) => void;
  onOpenAI: () => void;
  onOpenSurgery: () => void;
  onOpenExams: () => void;
  onOpenClinic: () => void;
  /** Trigger a search from a content-type chip (e.g. "Drugs", "Protocols"). */
  onSearchChip?: (query: string) => void;
  /** Open a specific clinical section with a context-aware search. */
  onSectionQuery?: (category: ScenarioCategory, query: string) => void;
  /** Open today's case in the scenario sheet. */
  onOpenDailyCase?: (c: DailyCaseRef) => void;
  tabLabels: Record<ScenarioCategory, string>;
}

/** Animated count-up using framer-motion's `animate` + motion value. */
function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString("en-US"));
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, mv, rounded]);

  return <span className={className}>{display}</span>;
}

const SPRING = { type: "spring" as const, stiffness: 150, damping: 14 };

const TEXT_SIZE_OPTIONS: HomeTextSize[] = ["small", "medium", "large"];
const HOME_TEXT_SCALE: Record<HomeTextSize, { section: string; sub: string; card: string; hint: string }> = {
  small: { section: "text-[12px]", sub: "text-[9.5px]", card: "text-[11px]", hint: "text-[9px]" },
  medium: { section: "text-[14px]", sub: "text-[10.5px]", card: "text-[12px]", hint: "text-[9.5px]" },
  large: { section: "text-[16px]", sub: "text-[12px]", card: "text-[13.5px]", hint: "text-[10.5px]" },
};

const hapticTap = (ms: number = 10) => {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  } catch { /* ignore */ }
};

/** Soft, slow-moving ambient gradient background — fits a clinical/AI vibe. */
function AmbientBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <motion.div
        className="absolute -top-24 -left-16 w-72 h-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(200 90% 60% / 0.55), transparent 70%)" }}
        animate={{ x: [0, 30, -10, 0], y: [0, 20, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-32 -right-20 w-80 h-80 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(330 85% 65% / 0.5), transparent 70%)" }}
        animate={{ x: [0, -25, 15, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(160 80% 55% / 0.5), transparent 70%)" }}
        animate={{ x: [0, 20, -20, 0], y: [0, -15, 15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function HomeHero({
  totalScenarios,
  categoryCounts,
  onSelectCategory,
  onOpenAI,
  onOpenSurgery,
  onOpenExams,
  onOpenClinic,
  tabLabels,
  onSearchChip,
  onSectionQuery,
  onOpenDailyCase,
}: HomeHeroProps) {
  const [textSize, setTextSize] = useState<HomeTextSize>(() => {
    if (typeof window === "undefined") return "medium";
    const saved = window.localStorage.getItem("homeTextSize");
    return TEXT_SIZE_OPTIONS.includes(saved as HomeTextSize) ? (saved as HomeTextSize) : "medium";
  });
  const textScale = HOME_TEXT_SCALE[textSize];

  const updateTextSize = (size: HomeTextSize) => {
    setTextSize(size);
    window.localStorage.setItem("homeTextSize", size);
  };

  const sectionLinks: Array<{ id: ScenarioCategory; label: string; query: string; phName: PhIconProps["name"]; hint: string }> = [
    { id: "clinic", label: "Clinic", query: "antenatal gynae clinic fertility PCOS AUB contraception menopause", phName: "Stethoscope", hint: "Antenatal · fertility · AUB" },
    { id: "or_labor", label: "OR / Labor", query: "labor ward CTG induction cesarean PPH shoulder dystocia operative delivery", phName: "Baby", hint: "CTG · C-section · emergencies" },
    { id: "behavior", label: "Behavior", query: "counseling consent breaking bad news confidentiality refusal communication", phName: "ChatCircleDots", hint: "Consent · counseling · ethics" },
    { id: "qa", label: "Q&A Bank", query: "MRCOG Arab board EFOG OSCE MCQ viva high yield obstetrics gynecology fertility", phName: "Question", hint: "MCQ · OSCE · viva" },
  ];

  return (
    <div className="relative space-y-4 pb-24 pt-4">
      {/* Soft animated ambient background */}
      <AmbientBackground />

      <div className="flex items-center justify-between gap-3 px-1">
        <p className={`${textScale.sub} font-black uppercase tracking-[0.18em] text-muted-foreground leading-[1.35]`}>
          Text size
        </p>
        <div className="inline-flex rounded-xl border border-border/70 bg-card p-1 shadow-editorial" role="group" aria-label="Home text size">
          {TEXT_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => updateTextSize(size)}
              className={`h-8 px-2.5 rounded-lg text-[10.5px] font-black capitalize transition-colors ${
                textSize === size ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              aria-pressed={textSize === size}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* ⓪ Emergency Quick Access — top priority for time-critical use */}
      <EmergencyStrip textScale={textScale} onPick={(q) => { hapticTap(15); onSearchChip?.(q); }} />

      {/* ① Hero AI Banner — tap to open AI assistant */}
      <motion.button
        type="button"
        onClick={() => { hapticTap(12); onOpenAI(); }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING}
        whileTap={{ scale: 0.98 }}
        className="relative w-full text-left rounded-3xl overflow-hidden min-h-[170px] bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0c4a6e] shadow-xl shadow-blue-900/40 group"
        aria-label="Open AI Medical Assistant"
      >
        {/* Soft radial glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(56,189,248,0.30) 0%, transparent 55%)",
          }}
          aria-hidden="true"
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden="true"
        />

        <div className="relative p-4 flex items-center gap-3 min-h-[150px]">
          {/* Animated robot, contained within banner */}
          <div className="relative shrink-0 self-center">
            <div className="absolute inset-0 rounded-full bg-sky-400/25 blur-2xl animate-pulse" aria-hidden="true" />
            <AIRobot size={78} className="relative" />
          </div>

          {/* Text block */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white font-bold text-[16px] leading-tight">OB/GYN & Fertility Mentor</h2>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-400/20 text-green-300 border border-green-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            </div>

            <p className="text-white/75 text-[11px] leading-snug">
              Labor ward, gynae clinic, fertility, surgery, drugs, and exam decisions — in one clinical cockpit.
            </p>

            <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-full ring-1 ring-white/20">
              Open chat
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </motion.button>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...SPRING, delay: 0.08 }}
        className="space-y-3.5"
      >
        <div className="px-1 space-y-1.5">
          <p className={`${textScale.section} font-black uppercase tracking-[0.18em] text-foreground leading-[1.2]`}>
            Essential OB/GYN Doctor Hub
          </p>
          <p className={`${textScale.sub} text-muted-foreground leading-[1.35]`}>
            The fastest routes for obstetricians, gynecologists, fertility clinicians, residents, and exam candidates.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {priorityItems.map((item, idx) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => { hapticTap(8); onSearchChip?.(item.query); }}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...SPRING, delay: 0.12 + idx * 0.04 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-2xl border border-border/70 bg-card p-3 text-left shadow-editorial hover:border-primary/40 hover:bg-muted/35 transition-colors min-h-[86px]"
            >
              <div className="flex items-start gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <PhIcon name={item.phName} size={18} weight="duotone" />
                </span>
                <span className="min-w-0">
                  <span className={`${textScale.card} block font-black leading-[1.18] text-foreground break-words`}>{item.label}</span>
                  <span className={`${textScale.hint} block text-muted-foreground leading-[1.25] mt-1.5 break-words`}>{item.hint}</span>
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ② Search-driven content type chips — replace previous category cards */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...SPRING, delay: 0.15 }}
        className="space-y-3.5"
      >
        <div className="flex items-start justify-between px-1 gap-2">
          <div className="min-w-0 space-y-1.5">
            <p className={`${textScale.section} font-black uppercase tracking-[0.18em] text-foreground leading-[1.2] flex items-start gap-1.5`}>
              <Search className="w-3.5 h-3.5 text-primary" />
              Browse by Content Type
            </p>
            <p className={`${textScale.sub} text-muted-foreground leading-[1.35]`}>
              Tap any card to filter the library
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {chips.map((c, idx) => (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => { hapticTap(8); onSearchChip?.(c.query); }}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...SPRING, delay: 0.2 + idx * 0.05 }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -2 }}
              className={`soft-tint relative overflow-hidden rounded-2xl p-3 text-left bg-gradient-to-br ${c.gradient} shadow-md ${c.shadow} active:shadow-sm transition-all min-h-[82px]`}
              aria-label={`Search ${c.label}`}
            >
              <div className="absolute -bottom-2 -right-2 w-14 h-14 opacity-15 pointer-events-none" aria-hidden="true">
                <PhIcon name={c.phName} size={56} tone="white" weight="fill" />
              </div>
              <div className="relative flex items-start gap-2.5 h-full">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/25 flex items-center justify-center shrink-0">
                  <PhIcon name={c.phName} size={18} tone="white" weight="duotone" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-white font-bold ${textScale.card} leading-[1.2] break-words`}>{c.label}</p>
                  <p className={`text-white/70 ${textScale.hint} leading-[1.25] mt-1.5 break-words`}>{c.hint}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ③ Case of the day — opens scenario sheet */}
      {onOpenDailyCase && <MiniCaseOfDay textScale={textScale} onOpen={onOpenDailyCase} />}

      {/* ④ Today's MCQ — interactive single-question widget */}
      <DailyMcqWidget textScale={textScale} />

      {/* ⑤ Quick clinical tools row */}
      <QuickToolsStrip textScale={textScale} />

      {/* ⑥ Total scenarios — single compact stat strip */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...SPRING, delay: 0.5 }}
        className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg shadow-slate-900/40"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`${textScale.section} font-black uppercase tracking-[0.2em] text-white/70 leading-[1.2] mb-2.5`}>
              Library Coverage
            </p>
            <div className="flex items-baseline gap-1.5">
              <AnimatedNumber
                value={totalScenarios}
                className="text-white font-black text-[32px] leading-none tabular-nums tracking-tight"
              />
              <span className="text-white/60 text-[14px] font-bold">+</span>
              <span className="text-white/80 text-[11px] font-semibold ml-1 leading-tight">
                Clinical Scenarios
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="w-2 h-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
