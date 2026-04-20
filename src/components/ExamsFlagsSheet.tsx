import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight } from "lucide-react";
import { EXAMS } from "@/data/examsData";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/** Dedupe exams by countryCode — show one card per country/authority, keep MRCOG/ABOG separately. */
const CARD_COLORS = [
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-700",
  "from-violet-500 to-indigo-700",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-teal-600",
  "from-red-500 to-rose-700",
  "from-fuchsia-500 to-purple-700",
  "from-lime-500 to-green-700",
  "from-orange-500 to-red-600",
  "from-indigo-500 to-blue-700",
  "from-pink-500 to-rose-700",
  "from-slate-500 to-slate-700",
];

export function ExamsFlagsSheet({ open, onOpenChange }: Props) {
  const navigate = useNavigate();

  const go = (examId: string) => {
    onOpenChange(false);
    setTimeout(() => navigate(`/exams?exam=${examId}`), 150);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[82vh] overflow-y-auto">
        <SheetHeader className="pb-3 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-sm shadow-violet-500/30">
              <GraduationCap className="w-4 h-4 text-white" />
            </span>
            Prometric & Licensing Exams
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {EXAMS.length} exams
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-2.5 pt-4 pb-2">
          {EXAMS.map((exam, idx) => {
            const color = CARD_COLORS[idx % CARD_COLORS.length];
            return (
              <motion.button
                key={exam.id}
                type="button"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.04 * idx, type: "spring", stiffness: 260, damping: 22 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => go(exam.id)}
                className={`group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${color} shadow-md shadow-black/10 text-left`}
                aria-label={`Open ${exam.authority} exam`}
              >
                {/* Shimmer */}
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                  aria-hidden
                />
                {/* Huge flag watermark */}
                <div
                  className="absolute -bottom-5 -right-3 text-[88px] leading-none opacity-20 pointer-events-none select-none"
                  aria-hidden
                >
                  {exam.flag}
                </div>

                <div className="relative flex flex-col gap-2.5 min-h-[108px]">
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="w-11 h-11 rounded-2xl bg-white/25 backdrop-blur-sm ring-1 ring-white/30 flex items-center justify-center text-[22px] leading-none shadow-inner"
                      animate={{ y: [0, -2, 0], rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 3.5 + idx * 0.15, repeat: Infinity, ease: "easeInOut", delay: idx * 0.1 }}
                    >
                      {exam.flag}
                    </motion.span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 ring-1 ring-white/30 text-white text-[9px] font-bold uppercase tracking-[0.15em] backdrop-blur-sm">
                      {exam.id}
                    </span>
                  </div>
                  <div className="mt-auto">
                    <p className="text-white font-bold text-[13px] leading-tight line-clamp-2">
                      {exam.country}
                    </p>
                    <p className="text-white/80 text-[9px] font-bold uppercase tracking-[0.18em] mt-1 line-clamp-1">
                      {exam.platform} · {exam.level}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => { onOpenChange(false); setTimeout(() => navigate("/exams"), 150); }}
          className="w-full mt-2 mb-2 py-2.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground text-[12px] font-bold flex items-center justify-center gap-1.5 border border-border/50 transition"
        >
          Open full exams hub
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </SheetContent>
    </Sheet>
  );
}
