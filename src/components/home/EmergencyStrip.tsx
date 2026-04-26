import { motion } from "framer-motion";
import { Siren, ChevronRight } from "lucide-react";
import { springTransition } from "@/lib/motion";

interface Emergency {
  id: string;
  abbr: string;
  nameEn: string;
  group: string;
  query: string;
  protocol: string;
  emoji: string;
  ring: string;
  glow: string;
}

const EMERGENCIES: Emergency[] = [
  { id: "pph", abbr: "PPH", nameEn: "Postpartum Hemorrhage", group: "Hemorrhage", query: "PPH postpartum hemorrhage", protocol: "4 T's · TXA · Bakri", emoji: "🩸", ring: "ring-red-500/40", glow: "shadow-red-500/40" },
  { id: "eclampsia", abbr: "ECL", nameEn: "Eclampsia", group: "Seizure", query: "eclampsia", protocol: "MgSO₄ 4g IV", emoji: "⚡", ring: "ring-violet-500/40", glow: "shadow-violet-500/40" },
  { id: "shoulder", abbr: "SD", nameEn: "Shoulder Dystocia", group: "Delivery", query: "shoulder dystocia", protocol: "HELPERR", emoji: "🚨", ring: "ring-orange-500/40", glow: "shadow-orange-500/40" },
  { id: "cord", abbr: "UCP", nameEn: "Umbilical Cord Prolapse", group: "Fetal risk", query: "cord prolapse", protocol: "Knee-chest · STAT CS", emoji: "⏱️", ring: "ring-rose-500/40", glow: "shadow-rose-500/40" },
];

interface Props {
  onPick: (query: string) => void;
  textScale?: { section: string; sub: string; card: string; hint: string };
}

/**
 * High-priority emergency strip — single-tap access to lifesaving protocols.
 * Designed for time-critical retrieval: bold colour, no nesting, instant feedback.
 */
export function EmergencyStrip({ onPick, textScale }: Props) {
  const scale = textScale ?? { section: "text-[14px]", sub: "text-[10.5px]", card: "text-[12px]", hint: "text-[9.5px]" };
  const [primary, ...secondary] = EMERGENCIES;

  const renderEmergencyButton = (e: Emergency, idx: number, featured = false) => (
    <motion.button
      key={e.id}
      type="button"
      onClick={() => onPick(e.query)}
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...springTransition, delay: 0.05 + idx * 0.04 }}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      className={`group relative flex h-full overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm ring-1 ${e.ring} ${featured ? "min-h-[104px] px-3.5 py-3.5" : "min-h-[112px] px-3 py-3"} text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300`}
      aria-label={`Open ${e.abbr} ${e.nameEn} protocol`}
    >
      <div className={`flex w-full ${featured ? "items-center" : "items-start"} gap-2.5`}>
        <span className={`${featured ? "h-10 w-10 text-[22px]" : "h-8 w-8 text-[17px]"} flex items-center justify-center rounded-lg bg-white/10 leading-none shrink-0 mt-0.5`}>
          {e.emoji}
        </span>
        <div className="min-w-0 flex-1 self-stretch flex flex-col gap-2">
          <div className="min-w-0 space-y-1">
            <span className="inline-flex w-fit max-w-full rounded-md bg-white/8 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-[0.14em] text-red-100/75 text-flow-compact">
              {e.group}
            </span>
            <p className={`text-flow-safe mobile-copy-align text-white font-black ${featured ? "text-[14px]" : scale.card} leading-[1.25]`} lang="en">
              <span className="inline-block whitespace-nowrap">{e.abbr}</span>{" "}
              <span className="text-red-200/80 font-bold">/</span>{" "}
              <span>{e.nameEn}</span>
            </p>
          </div>
          <p className={`text-flow-compact mt-auto rounded-lg bg-white/5 px-2 py-1.5 text-red-200/90 ${featured ? "text-[10.5px]" : scale.hint} leading-[1.35] font-mono`} lang="en">
            {e.protocol}
          </p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-red-200/60 group-hover:text-red-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>
    </motion.button>
  );

  return (
    <motion.section
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springTransition}
      aria-label="Emergency quick access"
      className="relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-red-950/95 via-rose-900/90 to-red-950/95 border border-red-500/30 shadow-lg shadow-red-900/30"
    >
      {/* pulse line */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="flex items-start justify-between mb-4 px-0.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <motion.span
            className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-red-500/25 ring-1 ring-red-400/40 shrink-0"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Siren className="w-3.5 h-3.5 text-red-200" strokeWidth={2.5} />
          </motion.span>
          <div className="min-w-0 space-y-1.5 pt-0.5">
            <p className={`${scale.section} font-black uppercase tracking-[0.18em] text-red-100 leading-[1.2]`}>
              Emergency Protocols
            </p>
            <p className={`${scale.sub} font-semibold text-red-200/80 tracking-wide leading-[1.35]`}>
              One-tap lifesaving access
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {renderEmergencyButton(primary, 0, true)}
        <div className="grid grid-cols-1 min-[390px]:grid-cols-3 auto-rows-fr gap-2.5 items-stretch">
          {secondary.map((e, idx) => renderEmergencyButton(e, idx + 1))}
        </div>
      </div>
    </motion.section>
  );
}
