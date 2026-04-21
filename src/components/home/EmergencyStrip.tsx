import { motion } from "framer-motion";
import { Siren, ChevronRight } from "lucide-react";
import { springTransition } from "@/lib/motion";

interface Emergency {
  id: string;
  label: string;
  query: string;
  protocol: string;
  emoji: string;
  ring: string;
  glow: string;
}

const EMERGENCIES: Emergency[] = [
  { id: "pph", label: "PPH", query: "PPH", protocol: "4 T's · Bakri · TXA", emoji: "🩸", ring: "ring-red-500/40", glow: "shadow-red-500/40" },
  { id: "eclampsia", label: "Eclampsia", query: "eclampsia", protocol: "MgSO₄ 4g IV", emoji: "⚡", ring: "ring-violet-500/40", glow: "shadow-violet-500/40" },
  { id: "shoulder", label: "Shoulder dystocia", query: "shoulder dystocia", protocol: "HELPERR", emoji: "🚨", ring: "ring-orange-500/40", glow: "shadow-orange-500/40" },
  { id: "cord", label: "Cord prolapse", query: "cord prolapse", protocol: "Knee-chest · STAT CS", emoji: "⏱️", ring: "ring-rose-500/40", glow: "shadow-rose-500/40" },
];

interface Props {
  onPick: (query: string) => void;
}

/**
 * High-priority emergency strip — single-tap access to lifesaving protocols.
 * Designed for time-critical retrieval: bold colour, no nesting, instant feedback.
 */
export function EmergencyStrip({ onPick }: Props) {
  return (
    <motion.section
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springTransition}
      aria-label="Emergency quick access"
      className="relative overflow-hidden rounded-2xl p-3 bg-gradient-to-br from-red-950/95 via-rose-900/90 to-red-950/95 border border-red-500/30 shadow-lg shadow-red-900/30"
    >
      {/* pulse line */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <motion.span
            className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-red-500/25 ring-1 ring-red-400/40"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Siren className="w-3 h-3 text-red-200" strokeWidth={2.5} />
          </motion.span>
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-red-100">
            Emergency
          </span>
        </div>
        <span className="text-[9px] font-semibold text-red-200/70 tracking-wider">
          One-tap protocols
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {EMERGENCIES.map((e, idx) => (
          <motion.button
            key={e.id}
            type="button"
            onClick={() => onPick(e.query)}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springTransition, delay: 0.05 + idx * 0.04 }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -1 }}
            className={`group relative overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm ring-1 ${e.ring} px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300`}
            aria-label={`Open ${e.label} protocol`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[18px] leading-none shrink-0">{e.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-[11.5px] leading-tight truncate">{e.label}</p>
                <p className="text-red-200/80 text-[9px] leading-tight mt-0.5 truncate font-mono">
                  {e.protocol}
                </p>
              </div>
              <ChevronRight className="w-3 h-3 text-red-200/60 group-hover:text-red-100 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
