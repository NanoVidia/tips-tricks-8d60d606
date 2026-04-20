import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PhIcon } from "@/components/ui/PhIcon";
import { BookmarkButton } from "@/components/tools/BookmarkButton";

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

export function ScenarioCard({
  id,
  title,
  situation,
  category,
  index,
  onOpen,
  categoryConfig,
  highlight,
}: ScenarioCardProps) {
  const cfg = categoryConfig[category];

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
      className="group relative text-left bg-card rounded-2xl border border-border/50 shadow-sm p-4 sm:p-5 hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col gap-2.5 overflow-hidden"
    >
      {/* Subtle gradient accent on hover */}
      <span
        className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${cfg.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
        aria-hidden="true"
      />

      {/* Top row: icon + title */}
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

      {/* Middle: situation preview */}
      <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 pl-[46px] -mt-1">
        <HighlightedText text={situation} query={highlight} />
      </p>

      {/* Bottom row: bookmark + open */}
      <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-border/40">
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
