import { Lock } from "lucide-react";

/**
 * Global freeze overlay — blocks all pointer/keyboard interaction with the app.
 * Removed only when the user types "فك التجميد" (unfreeze).
 */
export const FreezeOverlay = () => {
  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Application frozen"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/40 backdrop-blur-[2px] cursor-not-allowed select-none"
      style={{ pointerEvents: "all" }}
      onClickCapture={(e) => { e.stopPropagation(); e.preventDefault(); }}
      onMouseDownCapture={(e) => { e.stopPropagation(); e.preventDefault(); }}
      onTouchStartCapture={(e) => { e.stopPropagation(); e.preventDefault(); }}
      onKeyDownCapture={(e) => { e.stopPropagation(); e.preventDefault(); }}
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/90 border border-border shadow-editorial">
        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
          Frozen
        </span>
      </div>
    </div>
  );
};
