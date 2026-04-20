import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { Stethoscope, ArrowRight } from "lucide-react";
import { PhIcon } from "@/components/ui/PhIcon";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called with a preset search query + activates the clinic tab. */
  onPickTopic: (query: string) => void;
  /** Open the clinic tab with no preset filter (full list). */
  onBrowseAll: () => void;
  /** Total clinic scenarios (for header hint). */
  total: number;
}

type PhName =
  | "Baby" | "Heartbeat" | "Flask" | "Drop" | "Dna" | "Siren"
  | "Pulse" | "GenderFemale" | "Stethoscope" | "FirstAidKit" | "Thermometer";

interface Topic {
  id: string;
  label: string;
  query: string;
  phName: PhName;
  gradient: string; // tailwind gradient (from-... to-...)
}

/**
 * Curated clinical topic filters. Each one maps to a search term that
 * actually exists in scenario titles (verified against the DB dump).
 */
const TOPICS: Topic[] = [
  { id: "prenatal", label: "Antenatal Care", query: "prenatal",        phName: "Baby",         gradient: "from-sky-500 to-blue-700" },
  { id: "htn",      label: "Hypertension",   query: "hypertension",    phName: "Pulse",        gradient: "from-rose-500 to-red-700" },
  { id: "dm",       label: "Diabetes",       query: "diabetes",        phName: "Drop",         gradient: "from-amber-500 to-orange-700" },
  { id: "bleed",    label: "Bleeding",       query: "bleeding",        phName: "Heartbeat",    gradient: "from-red-500 to-rose-700" },
  { id: "preec",    label: "Preeclampsia",   query: "preeclampsia",    phName: "Siren",        gradient: "from-fuchsia-500 to-pink-700" },
  { id: "ptl",      label: "Preterm Labor",  query: "preterm",         phName: "Thermometer",  gradient: "from-indigo-500 to-violet-700" },
  { id: "screen",   label: "Screening",      query: "screening",       phName: "Stethoscope",  gradient: "from-teal-500 to-emerald-700" },
  { id: "menop",    label: "Menopause & AUB",query: "menopause",       phName: "GenderFemale", gradient: "from-purple-500 to-indigo-700" },
  { id: "fertil",   label: "Fertility",      query: "fertility",       phName: "Dna",          gradient: "from-cyan-500 to-sky-700" },
];

export function ClinicTopicsSheet({ open, onOpenChange, onPickTopic, onBrowseAll, total }: Props) {
  const pick = (t: Topic) => {
    onOpenChange(false);
    setTimeout(() => onPickTopic(t.query), 150);
  };

  const all = () => {
    onOpenChange(false);
    setTimeout(onBrowseAll, 150);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="pb-3 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-sm shadow-sky-500/30">
              <Stethoscope className="w-4 h-4 text-white" />
            </span>
            Clinical Scenarios
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {total} scenarios
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-2 pt-4 pb-2">
          {TOPICS.map((t, idx) => (
            <motion.button
              key={t.id}
              type="button"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.04 * idx, type: "spring", stiffness: 260, damping: 22 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => pick(t)}
              className={`group soft-tint relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${t.gradient} shadow-md shadow-black/10 text-left`}
              aria-label={`Filter clinic by ${t.label}`}
            >
              {/* Shimmer */}
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                aria-hidden
              />
              {/* Background icon */}
              <div className="absolute -bottom-3 -right-3 opacity-15 pointer-events-none" aria-hidden>
                <PhIcon name={t.phName} size={72} tone="white" weight="fill" />
              </div>

              <div className="relative flex flex-col gap-2.5 min-h-[108px]">
                <motion.div
                  className="w-11 h-11 rounded-2xl bg-white/25 backdrop-blur-sm ring-1 ring-white/30 flex items-center justify-center shadow-inner"
                  animate={{ y: [0, -2, 0], rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 3.5 + idx * 0.2, repeat: Infinity, ease: "easeInOut", delay: idx * 0.1 }}
                >
                  <PhIcon name={t.phName} size={22} tone="white" weight="duotone" />
                </motion.div>
                <div className="mt-auto">
                  <p className="text-white font-bold text-[13px] leading-tight line-clamp-2">{t.label}</p>
                  <p className="text-white/80 text-[9px] font-bold uppercase tracking-[0.18em] mt-1">
                    Topic
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          onClick={all}
          className="w-full mt-2 mb-2 py-2.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground text-[12px] font-bold flex items-center justify-center gap-1.5 border border-border/50 transition"
        >
          Browse all scenarios
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </SheetContent>
    </Sheet>
  );
}
