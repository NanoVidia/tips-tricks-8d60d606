import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { Bot, ArrowRight, Sparkles } from "lucide-react";
import { PhIcon } from "@/components/ui/PhIcon";
import { useAppSettings } from "@/hooks/useAppSettings";

type ScenarioCategory = "clinic" | "or_labor" | "behavior" | "qa";

interface CategoryDef {
  id: ScenarioCategory;
  title: string;
  subtitle: string;
  phName: "Stethoscope" | "Scissors" | "ChatCircleDots" | "Question";
  /** Tailwind classes for the full card gradient */
  gradient: string;
  /** Shadow color tint */
  shadow: string;
}

interface HomeHeroProps {
  totalScenarios: number;
  categoryCounts: Record<ScenarioCategory, number>;
  /** Tap a category card */
  onSelectCategory: (id: ScenarioCategory) => void;
  /** Tap the hero banner — opens the AI bot/drawer */
  onOpenAI: () => void;
  /** Localized labels per category (respects current language) */
  tabLabels: Record<ScenarioCategory, string>;
}

/** Animated count-up using framer-motion's `animate` + motion value. */
function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString("en-US"));
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, mv, rounded]);

  return <span className={className}>{display}</span>;
}

const SPRING = { type: "spring" as const, stiffness: 150, damping: 14 };

/** Light haptic tap — safe no-op if unsupported. */
const hapticTap = (ms: number = 10) => {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  } catch { /* ignore */ }
};

export function HomeHero({
  totalScenarios,
  categoryCounts,
  onSelectCategory,
  onOpenAI,
  tabLabels,
}: HomeHeroProps) {
  const { get } = useAppSettings();
  const waNumber = String(get("whatsapp_number") ?? "").replace(/[^0-9]/g, "") || "966500000000";
  const drName = String(get("whatsapp_label") ?? "Dr. Sahar");

  const categories: CategoryDef[] = [
    {
      id: "qa",
      title: tabLabels.qa,
      subtitle: "Questions & Skills Bank",
      phName: "Question",
      gradient: "from-emerald-500 to-teal-700",
      shadow: "shadow-emerald-500/30",
    },
    {
      id: "clinic",
      title: tabLabels.clinic,
      subtitle: "Clinical Scenarios",
      phName: "Stethoscope",
      gradient: "from-sky-500 to-blue-700",
      shadow: "shadow-sky-500/30",
    },
    {
      id: "or_labor",
      title: tabLabels.or_labor,
      subtitle: "OR & Labor Protocols",
      phName: "Scissors",
      gradient: "from-rose-500 to-pink-700",
      shadow: "shadow-rose-500/30",
    },
    {
      id: "behavior",
      title: tabLabels.behavior,
      subtitle: "Communication Scripts",
      phName: "ChatCircleDots",
      gradient: "from-amber-400 to-orange-600",
      shadow: "shadow-amber-500/30",
    },
  ];

  return (
    <div className="space-y-4 pb-24 pt-4">
      {/* ① Hero AI Banner — full-width immersive card */}
      <motion.button
        type="button"
        onClick={onOpenAI}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING}
        whileTap={{ scale: 0.98 }}
        className="relative w-full text-left rounded-3xl overflow-hidden min-h-[140px] bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0c4a6e] shadow-xl shadow-blue-900/40 group"
        aria-label="Open AI Medical Assistant"
      >
        {/* Decorative giant bot icon (right) */}
        <Bot
          className="absolute -right-4 -bottom-4 w-40 h-40 text-white/10 pointer-events-none group-hover:scale-110 transition-transform duration-500"
          strokeWidth={1.2}
          aria-hidden="true"
        />
        {/* Soft radial glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(56,189,248,0.25) 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />

        <div className="relative p-4 flex flex-col h-full min-h-[140px] justify-between gap-3">
          {/* Top row: pulsing bot + text */}
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-sky-400/30 blur-xl animate-pulse" aria-hidden="true" />
              <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center ring-2 ring-white/20 shadow-lg">
                <Bot className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white font-bold text-[16px] leading-tight">AI Medical Assistant</h2>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-400/20 text-green-300 border border-green-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-white/60 text-[11px] mt-0.5 leading-snug">
                Ask any clinical question — 24/7
              </p>
            </div>

            <Sparkles className="w-4 h-4 text-amber-300/70 shrink-0 mt-1" />
          </div>

          {/* Bottom strip: doctor + WhatsApp */}
          <div className="relative flex items-center justify-between gap-2 pt-3 border-t border-white/10 backdrop-blur-sm">
            <div className="min-w-0 flex-1">
              <p className="text-white text-[12px] font-semibold leading-tight truncate">{drName}</p>
              <p className="text-white/60 text-[10px] leading-tight truncate">OB/GYN Consultant</p>
            </div>
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md shadow-green-500/30"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </motion.button>

      {/* ② 2×2 Category Cards */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((c, idx) => (
          <motion.button
            key={c.id}
            type="button"
            onClick={() => onSelectCategory(c.id)}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...SPRING, delay: 0.1 + idx * 0.08 }}
            whileTap={{ scale: 0.96 }}
            className={`relative overflow-hidden rounded-3xl p-5 min-h-[160px] flex flex-col justify-between text-left bg-gradient-to-br ${c.gradient} shadow-lg ${c.shadow} active:shadow-md transition-shadow`}
            aria-label={`Open ${c.title}`}
          >
            {/* Decorative corner icon */}
            <div className="absolute -bottom-3 -right-3 w-20 h-20 opacity-15 pointer-events-none" aria-hidden="true">
              <PhIcon name={c.phName} size={80} tone="white" weight="fill" />
            </div>

            {/* Top: icon + count badge */}
            <div className="relative flex items-start justify-between">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/25 flex items-center justify-center shadow-sm">
                <PhIcon name={c.phName} size={18} tone="white" weight="duotone" />
              </div>
              <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-white/20 tabular-nums">
                {(categoryCounts[c.id] ?? 0).toLocaleString("en-US")}
              </span>
            </div>

            {/* Bottom: title + subtitle + arrow */}
            <div className="relative">
              <p className="text-white font-bold text-[15px] leading-tight">{c.title}</p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-white/75 text-[11px] leading-snug truncate">{c.subtitle}</p>
                <ArrowRight className="w-4 h-4 text-white/90 shrink-0" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ③ Bottom row — WhatsApp + Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card A — WhatsApp Consult */}
        <motion.a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...SPRING, delay: 0.42 }}
          whileTap={{ scale: 0.96 }}
          className="relative overflow-hidden rounded-2xl p-4 min-h-[90px] flex flex-col justify-between bg-gradient-to-br from-green-500 to-emerald-700 shadow-lg shadow-green-500/30"
          aria-label="WhatsApp direct consult"
        >
          <div className="flex items-center justify-between">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/90 px-1.5 py-0.5 rounded-full bg-white/15 ring-1 ring-white/20">
              Online
            </span>
          </div>
          <div>
            <p className="text-white font-bold text-[13px] leading-tight">{drName}</p>
            <p className="text-white/75 text-[10px] leading-tight mt-0.5">Direct Consult</p>
          </div>
        </motion.a>

        {/* Card B — Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...SPRING, delay: 0.5 }}
          className="relative overflow-hidden rounded-2xl p-4 min-h-[90px] flex flex-col justify-between bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg shadow-slate-900/40"
        >
          <div className="flex items-baseline gap-1">
            <AnimatedNumber
              value={totalScenarios}
              className="text-white font-black text-[26px] leading-none tabular-nums tracking-tight"
            />
            <span className="text-white/60 text-[11px] font-bold">+</span>
          </div>
          <div>
            <p className="text-white/75 text-[10px] leading-tight">Clinical Scenarios</p>
            <div className="flex items-center gap-1.5 mt-1.5" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
