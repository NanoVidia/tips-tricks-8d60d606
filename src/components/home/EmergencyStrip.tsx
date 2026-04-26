import { motion } from "framer-motion";
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

  const renderEmergencyButton = (e: Emergency, idx: number) => (
    <motion.button
      key={e.id}
      type="button"
      onClick={() => onPick(e.query)}
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...springTransition, delay: 0.05 + idx * 0.04 }}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      className={`group relative flex h-full min-h-[124px] overflow-visible rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm ring-1 ${e.ring} px-2 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300`}
      aria-label={`Open ${e.abbr} ${e.nameEn} protocol`}
    >
      <div className="grid w-full min-w-0 grid-rows-[auto_1fr_auto] gap-1.5">
        <div className="flex min-w-0 items-center justify-between gap-1.5">
          <span className="inline-flex max-w-full min-w-0 rounded-md bg-white/8 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] text-red-100/75 leading-tight text-flow-compact">
              {e.group}
          </span>
          <span className="shrink-0 text-[14px] leading-none" aria-hidden="true">{e.emoji}</span>
        </div>
        <p className="text-flow-safe mobile-copy-align text-[11px] font-black leading-[1.22] text-white" lang="en">
          <span className="block text-[10px] tracking-[0.08em] text-red-100/80">{e.abbr}</span>
          <span className="block">{e.nameEn}</span>
        </p>
        <p className="text-flow-safe rounded-lg bg-white/5 px-1.5 py-1.5 text-[9px] font-semibold leading-[1.3] text-red-100/90" lang="en">
          {e.protocol}
        </p>
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
        <div className="min-w-0">
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

      <div className="grid grid-cols-2 auto-rows-fr gap-2 items-stretch">
        {EMERGENCIES.map((e, idx) => renderEmergencyButton(e, idx))}
      </div>
    </motion.section>
  );
}
