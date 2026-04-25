import { ArrowRight, Microscope, BookOpen, AlertTriangle, AlertCircle, ShieldCheck } from "lucide-react";
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

function ClinicalVisual({ visual }: { visual: TrustedClinicalVisual | null }) {
  return (
    <div className="w-[74px] min-h-[92px] rounded-xl border border-border/70 bg-muted/40 flex flex-col items-center justify-center gap-1.5 shrink-0 p-2">
      <div className="w-9 h-9 rounded-lg bg-info-soft text-info flex items-center justify-center">
        <Microscope className="w-4.5 h-4.5" strokeWidth={2.5} />
      </div>
      <span className="text-[9px] font-black text-center leading-tight text-foreground break-words">
        {visual?.label ?? "Clinical note"}
      </span>
    </div>
  );
}

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
      <button type="button" onClick={onOpen} className="w-full text-left p-3.5 flex gap-3 active:bg-muted/35 transition-colors">
        <ClinicalVisual visual={visual} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 w-7 h-7 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0`}>
              <PhIcon name={cfg.phName as never} size={13} tone="white" weight="duotone" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground leading-tight">
                {categoryLabel}
              </p>
              <h3 className="text-[15px] font-black text-foreground leading-snug break-words">
                {scenario.title_en}
              </h3>
            </div>
          </div>

          <p className="text-[12px] text-muted-foreground leading-relaxed break-words line-clamp-3">
            {scenario.situation_en}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border ${urgency.cls}`}>
              <urgency.Icon className="w-3 h-3" strokeWidth={2.5} />
              {URGENCY_LABEL[tags.urgency]}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black bg-info-soft text-info border border-info/20">
              {tags.specialty}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-muted/60 text-muted-foreground border border-border/60">
              <BookOpen className="w-3 h-3" />
              {visual?.reference ?? "Curated app content"}
            </span>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-1" />
      </button>
      <div className="px-3.5 py-2 border-t border-border/50 bg-muted/25 flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground">Ranked by clinical relevance</span>
        <BookmarkButton id={`scenario:${scenario.id}`} label={scenario.title_en} size="sm" />
      </div>
    </motion.article>
  );
}