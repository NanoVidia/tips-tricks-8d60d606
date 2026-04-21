import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calculator, Pill, GitBranch, BookMarked } from "lucide-react";
import { springTransition } from "@/lib/motion";

interface Tool {
  id: string;
  label: string;
  to: string;
  hint: string;
  Icon: typeof Calculator;
  ring: string;
  iconColor: string;
}

const TOOLS: Tool[] = [
  { id: "calc", label: "Calculators", to: "/tools?tab=calculators", hint: "EDD · BMI · GFR", Icon: Calculator, ring: "ring-sky-500/30", iconColor: "text-sky-500" },
  { id: "drugs", label: "Drug safety", to: "/tools?tab=drugs", hint: "Pregnancy · Lact.", Icon: Pill, ring: "ring-violet-500/30", iconColor: "text-violet-500" },
  { id: "ddx", label: "DDx", to: "/tools?tab=ddx", hint: "Differentials", Icon: GitBranch, ring: "ring-emerald-500/30", iconColor: "text-emerald-500" },
  { id: "guide", label: "Guidelines", to: "/tools?tab=guidelines", hint: "ACOG · RCOG", Icon: BookMarked, ring: "ring-amber-500/30", iconColor: "text-amber-500" },
];

/** Quick access strip to clinical reference tools. */
export function QuickToolsStrip() {
  return (
    <motion.section
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springTransition}
      aria-label="Quick clinical tools"
      className="space-y-2.5"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Clinical tools
        </span>
        <Link
          to="/tools"
          className="text-[10px] font-bold text-primary hover:underline tracking-wide"
        >
          Open all →
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {TOOLS.map((t, idx) => (
          <motion.div
            key={t.id}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springTransition, delay: 0.05 + idx * 0.04 }}
          >
            <Link
              to={t.to}
              className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-md ring-1 ${t.ring} transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
              aria-label={t.label}
            >
              <div className={`w-8 h-8 rounded-lg bg-muted/60 group-hover:bg-muted flex items-center justify-center transition-colors ${t.iconColor}`}>
                <t.Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="text-center min-w-0 w-full">
                <p className="text-[10px] font-bold text-foreground leading-tight truncate">{t.label}</p>
                <p className="text-[8.5px] text-muted-foreground leading-tight truncate mt-0.5">{t.hint}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
