import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, AlertCircle, Clock3, ShieldCheck } from "lucide-react";
import { PhIcon } from "@/components/ui/PhIcon";
import { BookmarkButton } from "@/components/tools/BookmarkButton";
import {
  getClinicalTags,
  URGENCY_LABEL,
  type Urgency,
  type Specialty,
  type EvidenceLevel,
} from "@/lib/clinicalTags";

type ScenarioCategory = "clinic" | "or_labor" | "behavior" | "qa";

interface ScenarioCardProps {
  id: string;
  title: string;
  situation: string;
  category: ScenarioCategory;
  index: number;
  onOpen: () => void;
  categoryConfig: Record<
    ScenarioCategory,
    { phName: string; iconBg: string; gradient: string }
  >;
  highlight?: string;
  /** Optional raw scenario fields for richer tag detection. */
  action?: string;
  script?: string;
  synonyms?: string[] | null;
}

/** Render text with case-insensitive highlighted matches of `query`. */
function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const tokens = Array.from(
    new Set(
      query
        .trim()
        .split(/\s+/)
        .filter((t) => t.length >= 2)
        .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    )
  );
  if (tokens.length === 0) return <>{text}</>;
  const re = new RegExp(`(${tokens.join("|")})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        re.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-400/40 text-foreground rounded-[3px] px-[2px] py-0"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/* ---------- badge styles (semantic tokens + accent colors) ---------- */

const URGENCY_STYLE: Record<Urgency, { cls: string; Icon: typeof AlertTriangle }> = {
  critical: {
    cls: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 ring-1 ring-red-500/20",
    Icon: AlertTriangle,
  },
  urgent: {
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    Icon: AlertCircle,
  },
  routine: {
    cls: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    Icon: ShieldCheck,
  },
};

const SPECIALTY_STYLE: Record<Specialty, string> = {
  OB: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
  GYN: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/25",
  Fertility: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  "Gyn Surgery": "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
  "OB Anesthesia": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
  "OB Emergency": "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25",
};

const EVIDENCE_STYLE: Record<EvidenceLevel, string> = {
  A: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  B: "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25",
  C: "bg-slate-500/12 text-slate-700 dark:text-slate-300 border-slate-500/25",
};

export function ScenarioCard({
  id,
  title,
  situation,
  category,
  index,
  onOpen,
  categoryConfig,
  highlight,
  action,
  script,
  synonyms,
}: ScenarioCardProps) {
  const cfg = categoryConfig[category];
  const tags = getClinicalTags({
    category,
    title_en: title,
    situation_en: situation,
    action_en: action,
    script_en: script,
    synonyms: synonyms ?? null,
  });
  const u = URGENCY_STYLE[tags.urgency];

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.04, 0.4),
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      className="group relative text-left bg-card rounded-2xl border border-border/50 shadow-sm p-3.5 sm:p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col gap-2 overflow-hidden"
    >
      {/* Top accent bar — red for critical for instant recognition */}
      <span
        className={`absolute inset-x-0 top-0 h-[2px] ${
          tags.urgency === "critical"
            ? "bg-gradient-to-r from-red-500 via-red-500 to-red-400 opacity-100"
            : `bg-gradient-to-r ${cfg.gradient} opacity-0 group-hover:opacity-100 transition-opacity`
        }`}
        aria-hidden="true"
      />

      {/* Header: icon + title */}
      <div className="flex items-start gap-2.5">
        <div
          className={`shrink-0 w-9 h-9 rounded-xl ${cfg.iconBg} flex items-center justify-center shadow-sm ring-1 ring-white/20`}
        >
          <PhIcon name={cfg.phName as never} size={16} tone="white" weight="duotone" />
        </div>
        <h3 className="flex-1 text-[14px] font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          <HighlightedText text={title} query={highlight} />
        </h3>
      </div>

      {/* Situation preview */}
      <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 pl-[46px] -mt-0.5">
        <HighlightedText text={situation} query={highlight} />
      </p>

      {/* Clinical badges row */}
      <div className="flex flex-wrap items-center gap-1.5 pl-[46px] mt-0.5">
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider border ${u.cls}`}
          aria-label={`Urgency: ${URGENCY_LABEL[tags.urgency]}`}
        >
          <u.Icon className="w-2.5 h-2.5" strokeWidth={2.5} />
          {URGENCY_LABEL[tags.urgency]}
        </span>
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border ${SPECIALTY_STYLE[tags.specialty]}`}
          aria-label={`Specialty: ${tags.specialty}`}
        >
          {tags.specialty}
        </span>
        <span
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border ${EVIDENCE_STYLE[tags.evidence]}`}
          aria-label={`Evidence level ${tags.evidence}`}
          title="Evidence level (heuristic)"
        >
          <span className="opacity-70">EL</span>
          {tags.evidence}
        </span>
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold text-muted-foreground border border-border/60 bg-muted/40"
          aria-label={`Approximately ${tags.readMin} minute read`}
        >
          <Clock3 className="w-2.5 h-2.5" strokeWidth={2.5} />
          {tags.readMin}m
        </span>
      </div>

      {/* Footer: bookmark + open */}
      <div className="flex items-center justify-between pt-2 mt-auto border-t border-border/40">
        <div onClick={(e) => e.stopPropagation()}>
          <BookmarkButton id={`scenario:${id}`} label={title} size="sm" />
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wider group-hover:gap-1.5 transition-all">
          Open
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </motion.button>
  );
}
