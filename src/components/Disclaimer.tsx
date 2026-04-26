import { AlertTriangle, Info } from "lucide-react";
import { useAppSettings, defaultSettings } from "@/hooks/useAppSettings";

/**
 * Compact one-line disclaimer to place beside AI replies, tool outputs,
 * and inside chat bubbles. Text driven by app_settings.disclaimer_short.
 */
export function InlineDisclaimer({ className = "" }: { className?: string }) {
  const { get } = useAppSettings();
  const text = get("disclaimer_short") ?? defaultSettings.disclaimer_short;
  return (
    <p
      className={`flex items-start gap-1.5 text-[10px] leading-snug text-muted-foreground italic ${className}`}
    >
      <Info className="w-3 h-3 mt-0.5 shrink-0 opacity-70" />
      <span>{text}</span>
    </p>
  );
}

/**
 * Full disclaimer banner for page tops / tool sections.
 * Text driven by app_settings.disclaimer_long.
 */
export function DisclaimerBanner({ className = "" }: { className?: string }) {
  const { get } = useAppSettings();
  const text = get("disclaimer_long") ?? defaultSettings.disclaimer_long;
  // Highlight the first sentence as a bold lead when present.
  const dotIdx = text.indexOf(".");
  const head = dotIdx > 0 ? text.slice(0, dotIdx + 1) : "";
  const rest = dotIdx > 0 ? text.slice(dotIdx + 1) : text;
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2 text-[11px] leading-snug text-amber-900 dark:text-amber-200 ${className}`}
      role="note"
    >
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>
        {head && <strong className="font-semibold">{head}</strong>}
        {rest}
      </span>
    </div>
  );
}
