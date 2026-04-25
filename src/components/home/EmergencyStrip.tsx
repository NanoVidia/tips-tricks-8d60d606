import { motion } from "framer-motion";
import { Siren, ChevronRight } from "lucide-react";
import { springTransition } from "@/lib/motion";

interface Emergency {
  id: string;
  abbr: string;
  nameEn: string;
  nameAr: string;
  query: string;
  protocol: string;
  emoji: string;
  ring: string;
  glow: string;
}

const EMERGENCIES: Emergency[] = [
  { id: "pph", abbr: "PPH", nameEn: "Postpartum Hemorrhage", nameAr: "نزف ما بعد الولادة", query: "PPH postpartum hemorrhage", protocol: "4 T's · Bakri · TXA", emoji: "🩸", ring: "ring-red-500/40", glow: "shadow-red-500/40" },
  { id: "eclampsia", abbr: "ECL", nameEn: "Eclampsia", nameAr: "تشنج الحمل", query: "eclampsia", protocol: "MgSO₄ 4g IV", emoji: "⚡", ring: "ring-violet-500/40", glow: "shadow-violet-500/40" },
  { id: "shoulder", abbr: "SD", nameEn: "Shoulder Dystocia", nameAr: "تعسر ولادة الكتف", query: "shoulder dystocia", protocol: "HELPERR", emoji: "🚨", ring: "ring-orange-500/40", glow: "shadow-orange-500/40" },
  { id: "cord", abbr: "UCP", nameEn: "Umbilical Cord Prolapse", nameAr: "تدلي الحبل السري", query: "cord prolapse", protocol: "Knee-chest · STAT CS", emoji: "⏱️", ring: "ring-rose-500/40", glow: "shadow-rose-500/40" },
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
      className="relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-red-950/95 via-rose-900/90 to-red-950/95 border border-red-500/30 shadow-lg shadow-red-900/30"
    >
      {/* pulse line */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="flex items-center justify-between mb-3 px-0.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <motion.span
            className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-red-500/25 ring-1 ring-red-400/40 shrink-0"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Siren className="w-3.5 h-3.5 text-red-200" strokeWidth={2.5} />
          </motion.span>
          <div className="min-w-0">
            <p className="text-[14px] font-black uppercase tracking-[0.18em] text-red-100 leading-none">
              Emergency Protocols
            </p>
            <p className="text-[10.5px] font-semibold text-red-200/80 tracking-wide mt-1 leading-none">
              One-tap lifesaving access
            </p>
          </div>
        </div>
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
            className={`group relative overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm ring-1 ${e.ring} px-2.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300`}
            aria-label={`Open ${e.abbr} ${e.nameEn} protocol`}
          >
            <div className="flex items-start gap-2">
              <span className="text-[18px] leading-none shrink-0 mt-0.5">{e.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-white font-black text-[12px] leading-tight break-words">
                  {e.abbr} <span className="text-red-200/80 font-bold">/</span> {e.nameEn}
                </p>
                <p className="text-red-100/85 text-[10px] leading-tight mt-1 font-semibold break-words" dir="rtl">
                  {e.nameAr}
                </p>
                <p className="text-red-200/85 text-[9.5px] leading-tight mt-1 font-mono break-words">
                  {e.protocol}
                </p>
              </div>
              <ChevronRight className="w-3 h-3 text-red-200/60 group-hover:text-red-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
