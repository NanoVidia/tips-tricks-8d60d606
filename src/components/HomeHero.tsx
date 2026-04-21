import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { PhIcon } from "@/components/ui/PhIcon";
import { AIRobot } from "@/components/AIRobot";

type ScenarioCategory = "clinic" | "or_labor" | "behavior" | "qa";

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
}: HomeHeroProps) {
  type CardItem =
    | {
        kind: "scenario";
        id: ScenarioCategory;
        title: string;
        subtitle: string;
        phName: CategoryDef["phName"];
        gradient: string;
        shadow: string;
        count: number;
        countLabel: string;
      }
    | {
        kind: "action";
        id: string;
        onAction: () => void;
        title: string;
        subtitle: string;
        phName: "FirstAidKit" | "GraduationCap" | "Stethoscope";
        gradient: string;
        shadow: string;
        badge: string;
        countLabel: string;
      };

  const cards: CardItem[] = [
    {
      kind: "scenario",
      id: "qa",
      title: tabLabels.qa,
      subtitle: "Questions & Skills Bank",
      phName: "Question",
      gradient: "from-emerald-500 to-teal-700",
      shadow: "shadow-emerald-500/30",
      count: categoryCounts.qa ?? 0,
      countLabel: "items",
    },
    {
      kind: "action",
      id: "clinic-topics",
      onAction: onOpenClinic,
      title: tabLabels.clinic,
      subtitle: "Browse by topic",
      phName: "Stethoscope",
      gradient: "from-sky-500 to-blue-700",
      shadow: "shadow-sky-500/30",
      badge: "Topics",
      countLabel: `${categoryCounts.clinic ?? 0} items`,
    },
    {
      kind: "action",
      id: "surgery",
      onAction: onOpenSurgery,
      title: "Surgery Library",
      subtitle: "Browse by category",
      phName: "FirstAidKit",
      gradient: "from-rose-500 to-pink-700",
      shadow: "shadow-rose-500/30",
      badge: "Atlas",
      countLabel: "categories",
    },
    {
      kind: "action",
      id: "exams",
      onAction: onOpenExams,
      title: "Prometric Exams",
      subtitle: "Choose a country",
      phName: "GraduationCap",
      gradient: "from-violet-500 to-indigo-700",
      shadow: "shadow-violet-500/30",
      badge: "Prep",
      countLabel: "exams",
    },
  ];

  return (
    <div className="relative space-y-4 pb-24 pt-4">
      {/* Soft animated ambient background */}
      <AmbientBackground />

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
              <h2 className="text-white font-bold text-[16px] leading-tight">AI Medical Assistant</h2>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-400/20 text-green-300 border border-green-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            </div>

            <p className="text-white/75 text-[11px] leading-snug">
              Calculators, drug safety & instant OB/GYN answers — 24/7.
            </p>

            <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-full ring-1 ring-white/20">
              Open chat
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </motion.button>

      {/* ② 2×2 Cards — scenarios + Surgery + Exams */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c, idx) => {
          const inner = (
            <>
              <div className="absolute -bottom-3 -right-3 w-24 h-24 opacity-15 pointer-events-none" aria-hidden="true">
                <PhIcon name={c.phName} size={96} tone="white" weight="fill" />
              </div>

              <div className="relative flex items-start justify-between gap-2">
                <motion.div
                  className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/25 flex items-center justify-center shadow-sm"
                  animate={{ y: [0, -3, 0], rotate: [0, -4, 4, 0] }}
                  transition={{ duration: 4 + idx * 0.3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.2 }}
                >
                  <PhIcon name={c.phName} size={18} tone="white" weight="duotone" />
                </motion.div>
                <div className="text-right leading-none">
                  {c.kind === "scenario" ? (
                    <AnimatedNumber
                      value={c.count}
                      className="block text-white font-black text-[28px] tabular-nums tracking-tight drop-shadow-sm"
                    />
                  ) : (
                    <span className="block text-white font-black text-[18px] tracking-tight drop-shadow-sm">
                      {c.badge}
                    </span>
                  )}
                  <span className="text-white/70 text-[9px] font-bold uppercase tracking-wider">
                    {c.countLabel}
                  </span>
                </div>
              </div>

              <div className="relative">
                <p className="text-white font-bold text-[15px] leading-tight">{c.title}</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-white/75 text-[11px] leading-snug truncate">{c.subtitle}</p>
                  <ArrowRight className="w-4 h-4 text-white/90 shrink-0" />
                </div>
              </div>
            </>
          );

          const cn = `soft-tint relative overflow-hidden rounded-3xl p-5 min-h-[170px] flex flex-col justify-between text-left bg-gradient-to-br ${c.gradient} shadow-lg ${c.shadow} active:shadow-md transition-shadow`;
          const mp = {
            initial: { y: 30, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { ...SPRING, delay: 0.1 + idx * 0.08 },
            whileTap: { scale: 0.96 },
          };

          if (c.kind === "scenario") {
            return (
              <motion.button
                key={c.id}
                type="button"
                onClick={() => { hapticTap(10); onSelectCategory(c.id); }}
                {...mp}
                className={cn}
                aria-label={`Open ${c.title}`}
              >
                {inner}
              </motion.button>
            );
          }
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => { hapticTap(10); c.onAction(); }}
              {...mp}
              className={cn}
              aria-label={`Open ${c.title}`}
            >
              {inner}
            </motion.button>
          );
        })}
      </div>

      {/* ③ Total scenarios — single compact stat strip */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...SPRING, delay: 0.5 }}
        className="relative overflow-hidden rounded-2xl p-4 flex items-center justify-between bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg shadow-slate-900/40"
      >
        <div className="flex items-baseline gap-2">
          <AnimatedNumber
            value={totalScenarios}
            className="text-white font-black text-[34px] leading-none tabular-nums tracking-tight"
          />
          <span className="text-white/60 text-[14px] font-bold">+</span>
          <span className="text-white/75 text-[11px] font-semibold ml-1">Clinical Scenarios</span>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <span className="w-2 h-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
          <span className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
        </div>
      </motion.div>
    </div>
  );
}
