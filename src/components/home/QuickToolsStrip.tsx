import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calculator, Pill, GitBranch, BookMarked, ChevronRight } from "lucide-react";
import { springTransition } from "@/lib/motion";

interface Tool {
  id: string;
  label: string;
  to: string;
  hint: string;
  Icon: typeof Calculator;
  ring: string;
  iconColor: string;
  bg: string;
}

const TOOLS: Tool[] = [
  { id: "calc",  label: "Calculators",      to: "/tools?tab=calculators", hint: "EDD · BMI · GFR",   Icon: Calculator, ring: "ring-sky-500/30",     iconColor: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-500/10" },
  { id: "drugs", label: "Drug Safety",      to: "/tools?tab=drugs",       hint: "Pregnancy · Lactation", Icon: Pill,   ring: "ring-violet-500/30",  iconColor: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  { id: "ddx",   label: "Differential Dx",  to: "/tools?tab=ddx",         hint: "Symptom-based",     Icon: GitBranch, ring: "ring-emerald-500/30", iconColor: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  { id: "guide", label: "Guidelines",       to: "/tools?tab=guidelines",  hint: "ACOG · RCOG · NICE", Icon: BookMarked, ring: "ring-amber-500/30",  iconColor: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-500/10" },
];

/** Quick access strip to clinical reference tools. */
interface Props {
  textScale?: { section: string; sub: string; card: string; hint: string };
}

export function QuickToolsStrip({ textScale }: Props) {
  const scale = textScale ?? { section: "text-[14px]", sub: "text-[10.5px]", card: "text-[11.5px]", hint: "text-[9.5px]" };
  return (
    <motion.section
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springTransition}
      aria-label="Quick clinical tools"
      className="space-y-3.5"
    >
      <div className="flex items-start justify-between px-1 gap-2">
        <div className="min-w-0 space-y-1.5">
          <p className={`${scale.section} font-black uppercase tracking-[0.18em] text-foreground leading-[1.2]`}>
            Clinical Tools
          </p>
          <p className={`${scale.sub} text-muted-foreground leading-[1.35]`}>
            Calculators, drug safety & guidelines
          </p>
        </div>
        <Link
          to="/tools"
          className="inline-flex items-center gap-0.5 text-[11px] font-bold text-primary hover:underline tracking-wide shrink-0"
        >
          View all
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map((t, idx) => (
          <motion.div
            key={t.id}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springTransition, delay: 0.05 + idx * 0.04 }}
          >
            <Link
              to={t.to}
              className={`group flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-md ring-1 ${t.ring} transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
              aria-label={t.label}
            >
              <div className={`w-9 h-9 rounded-lg ${t.bg} flex items-center justify-center shrink-0 ${t.iconColor}`}>
                <t.Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`${scale.card} font-bold text-foreground leading-[1.2] break-words`}>{t.label}</p>
                <p className={`${scale.hint} text-muted-foreground leading-[1.25] mt-1 truncate`}>{t.hint}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
