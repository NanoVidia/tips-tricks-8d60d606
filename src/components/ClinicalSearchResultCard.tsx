import { ArrowRight, BookOpen, AlertTriangle, AlertCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { BookmarkButton } from "@/components/tools/BookmarkButton";
import { PhIcon } from "@/components/ui/PhIcon";
import { getClinicalTags, URGENCY_LABEL, type Urgency } from "@/lib/clinicalTags";
import { resolveTrustedClinicalVisual, type SearchScenario, type TrustedClinicalVisual } from "@/lib/clinicalSearch";

type ScenarioCategory = "clinic" | "or_labor" | "behavior" | "qa";

interface ClinicalSearchResultCardProps {
  scenario: SearchScenario;
  index: number;
  onOpen: () => void;
  categoryConfig: Record<ScenarioCategory, { phName: string; iconBg: string; gradient: string }>;
  categoryLabel: string;
}

const URGENCY_STYLE: Record<Urgency, { cls: string; Icon: typeof AlertTriangle }> = {
  critical: { cls: "bg-danger-soft text-danger border-danger/25", Icon: AlertTriangle },
  urgent: { cls: "bg-warning-soft text-warning border-warning/25", Icon: AlertCircle },
  routine: { cls: "bg-success-soft text-success border-success/25", Icon: ShieldCheck },
};

export function ClinicalSearchResultCard({ scenario, index, onOpen, categoryConfig, categoryLabel }: ClinicalSearchResultCardProps) {
  const tags = getClinicalTags({
    category: scenario.category,
    title_en: scenario.title_en,
    situation_en: scenario.situation_en,
    action_en: scenario.action_en,
    script_en: scenario.script_en,
    synonyms: scenario.synonyms,
  });
  const urgency = URGENCY_STYLE[tags.urgency];
  const visual = resolveTrustedClinicalVisual(scenario);
  const cfg = categoryConfig[scenario.category];

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.18), duration: 0.28 }}
      className="rounded-2xl border border-border/70 bg-card shadow-editorial overflow-hidden"
    >
      <button type="button" onClick={onOpen} className="w-full text-left p-3.5 active:bg-muted/35 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-muted text-[11px] font-black tabular-nums text-muted-foreground border border-border/70">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border ${urgency.cls}`}>
                  <urgency.Icon className="w-3 h-3" strokeWidth={2.5} />
                  {URGENCY_LABEL[tags.urgency]}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-muted/60 text-muted-foreground border border-border/60">
                  <PhIcon name={cfg.phName as never} size={11} tone="gold" weight="duotone" />
                  {categoryLabel}
                </span>
              </div>
              <h3 className="text-flow-safe text-[16px] font-black text-foreground leading-snug" lang="en">
                {scenario.title_en}
              </h3>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-1" />
        </div>

        <div className="mt-2.5 space-y-2 pl-9">
          <p className="text-flow-safe text-[12px] text-muted-foreground leading-relaxed line-clamp-2" lang="en">
            {scenario.situation_en}
          </p>
          <div className="rounded-xl border border-border/60 bg-muted/35 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground leading-tight">Immediate action</p>
            <p className="text-flow-safe mt-1 text-[12px] font-semibold text-foreground/85 leading-relaxed line-clamp-2" lang="en">
              {scenario.action_en || scenario.script_en || "Open for protocol details."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-info-soft text-info border border-info/20">
              <BookOpen className="w-3 h-3 shrink-0" />
              <span className="text-flow-compact truncate">{visual?.reference ?? "Curated app content"}</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">Open protocol</span>
          </div>
        </div>
      </button>
      <div className="px-3.5 py-2 border-t border-border/50 bg-muted/25 flex items-center justify-between pl-12">
        <span className="text-[10px] font-bold text-muted-foreground">Clinically ranked</span>
        <BookmarkButton id={`scenario:${scenario.id}`} label={scenario.title_en} size="sm" />
      </div>
    </motion.article>
  );
}