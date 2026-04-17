import { AlertTriangle, Info } from "lucide-react";

/**
 * Compact one-line disclaimer to place beside AI replies, tool outputs,
 * and inside chat bubbles. Keeps the user reminded that nothing here
 * substitutes for clinical judgment.
 */
export function InlineDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex items-start gap-1.5 text-[10px] leading-snug text-muted-foreground italic ${className}`}
    >
      <Info className="w-3 h-3 mt-0.5 shrink-0 opacity-70" />
      <span>
        Educational reference only — not a substitute for clinical judgment or
        individualized care.
      </span>
    </p>
  );
}

/**
 * Full disclaimer banner for page tops / tool sections.
 */
export function DisclaimerBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2 text-[11px] leading-snug text-amber-900 dark:text-amber-200 ${className}`}
      role="note"
    >
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>
        <strong className="font-semibold">Educational use only.</strong> All
        content (AI responses, calculators, drug info, surgery library, MCQs)
        is for healthcare-professional reference. Verify against current
        guidelines and apply clinical judgment for every patient.
      </span>
    </div>
  );
}
