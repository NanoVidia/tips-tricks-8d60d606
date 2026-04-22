import { useEffect, useState } from "react";
import { motion, AnimatePresence, useDragControls, type PanInfo } from "framer-motion";
import {
  LayoutGrid, BookOpen, Sparkles, Zap, ChevronUp, X, Flame, ChevronRight,
} from "lucide-react";
import { springTransition, TRANSITION_CLASS } from "@/lib/motion";
import { useActivityTracker, type TabId } from "@/hooks/useActivityTracker";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Active tab — drives sub-categories + most-viewed lists. */
  tab: TabId | null;
  tabLabel: string;
  /** Open the full browse view for the active tab. */
  onBrowse: () => void;
  /** Jump to MCQ practice (Exams tab) for this topic. */
  onMCQs: () => void;
  /** Jump to Tools / Quick reference (calculators, drugs, protocols). */
  onQuickReference: () => void;
  /** Open the AI assistant. */
  onAskAI: () => void;
  /** Filter the active tab by a sub-topic search query. */
  onPickTopic: (q: string) => void;
  /** Open a specific scenario by id (resolved from views map). */
  onOpenScenario: (id: string, title: string) => void;
}

const SUB_TOPICS: Record<TabId, { label: string; q: string }[]> = {
  qa: [
    { label: "MgSO₄ dosing", q: "magnesium" },
    { label: "Eclampsia", q: "eclampsia" },
    { label: "GDM", q: "gestational diabetes" },
    { label: "PPH protocol", q: "postpartum hemorrhage" },
    { label: "Red flags", q: "red flag" },
    { label: "Guidelines", q: "guideline" },
  ],
  clinic: [
    { label: "Antenatal", q: "prenatal" },
    { label: "Hypertension", q: "hypertension" },
    { label: "Diabetes", q: "diabetes" },
    { label: "Preeclampsia", q: "preeclampsia" },
    { label: "Bleeding", q: "bleeding" },
    { label: "Menopause", q: "menopause" },
  ],
  or_labor: [
    { label: "C-section", q: "cesarean" },
    { label: "Shoulder dystocia", q: "shoulder dystocia" },
    { label: "PPH", q: "postpartum hemorrhage" },
    { label: "Breech", q: "breech" },
    { label: "Forceps", q: "forceps" },
    { label: "Hysterectomy", q: "hysterectomy" },
  ],
  behavior: [
    { label: "Anxious patient", q: "anxious" },
    { label: "Bad news", q: "bad news" },
    { label: "Consent", q: "consent" },
    { label: "Refusal", q: "refusal" },
    { label: "Confidentiality", q: "confidentiality" },
    { label: "Ethics", q: "ethics" },
  ],
};

const CORE_ACTIONS = [
  { id: "browse",  label: "Browse Library",      icon: LayoutGrid, hint: "All scenarios in this section" },
  { id: "mcqs",    label: "Test Me with MCQs",   icon: Zap,        hint: "Practice board-style questions" },
  { id: "quick",   label: "Quick Reference",     icon: BookOpen,   hint: "Drugs · Calculators · Guides" },
  { id: "ai",      label: "Ask AI Mentor",       icon: Sparkles,   hint: "Instant clinical guidance" },
] as const;

export function SmartBottomSheet({
  open, onOpenChange, tab, tabLabel,
  onBrowse, onMCQs, onQuickReference, onAskAI, onPickTopic, onOpenScenario,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const dragControls = useDragControls();
  const { mostViewed } = useActivityTracker();
  const viewed = tab ? mostViewed(5, tab) : mostViewed(5);

  // Reset to collapsed each time the sheet opens
  useEffect(() => {
    if (open) setExpanded(false);
  }, [open]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -40 || info.velocity.y < -300) setExpanded(true);
    else if (info.offset.y > 60 || info.velocity.y > 400) {
      if (expanded) setExpanded(false);
      else onOpenChange(false);
    }
  };

  const trigger = (id: typeof CORE_ACTIONS[number]["id"]) => {
    onOpenChange(false);
    setTimeout(() => {
      if (id === "browse") onBrowse();
      else if (id === "mcqs") onMCQs();
      else if (id === "quick") onQuickReference();
      else if (id === "ai") onAskAI();
    }, 120);
  };

  const subTopics = tab ? SUB_TOPICS[tab] : [];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md"
            aria-hidden
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`${tabLabel} smart hub`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springTransition}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.4 }}
            onDragEnd={onDragEnd}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Drag handle (only this strip listens for drag) */}
            <button
              type="button"
              onPointerDown={(e) => dragControls.start(e)}
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse" : "Expand for more"}
              className="w-full pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            >
              <span className="mx-auto block h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            </button>

            {/* Header */}
            <div className="px-5 pb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Smart hub
                </p>
                <h2 className="text-[15px] font-bold leading-tight truncate">{tabLabel}</h2>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className={cn(
                  "p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground",
                  TRANSITION_CLASS,
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ① Core 4-action grid (always visible) */}
            <div className="px-5 grid grid-cols-2 gap-2.5">
              {CORE_ACTIONS.map((a, i) => {
                const Icon = a.icon;
                return (
                  <motion.button
                    key={a.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springTransition, delay: 0.03 * i }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => trigger(a.id)}
                    className={cn(
                      "group relative flex flex-col items-start gap-1.5 p-3.5 rounded-2xl",
                      "bg-card border border-border/60 hover:border-primary/50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      TRANSITION_CLASS,
                    )}
                  >
                    <span className="w-9 h-9 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center text-primary">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[12px] font-bold text-foreground leading-tight break-words text-left w-full">
                      {a.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight break-words text-left w-full">
                      {a.hint}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* ② Expand toggle (when collapsed) */}
            {!expanded && (
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                onClick={() => setExpanded(true)}
                className={cn(
                  "w-full mt-3 mb-3 mx-auto flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-muted-foreground hover:text-foreground",
                  TRANSITION_CLASS,
                )}
              >
                <ChevronUp className="w-3.5 h-3.5" />
                Pull up for sub-topics & most viewed
              </motion.button>
            )}

            {/* ③ Progressive disclosure — sub-categories + most viewed */}
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="expanded"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={springTransition}
                  className="overflow-hidden"
                >
                  <div className="px-5 pt-4 pb-6 space-y-5 max-h-[55vh] overflow-y-auto">
                    {/* Sub-categories */}
                    {subTopics.length > 0 && (
                      <section>
                        <div className="flex items-center gap-1.5 mb-2">
                          <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            Sub-categories
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {subTopics.map((t, i) => (
                            <motion.button
                              key={t.q}
                              type="button"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ ...springTransition, delay: 0.02 * i }}
                              onClick={() => { onOpenChange(false); setTimeout(() => onPickTopic(t.q), 120); }}
                              className={cn(
                                "px-3 py-1.5 rounded-full bg-muted/60 hover:bg-primary hover:text-primary-foreground border border-border/50 text-[11px] font-semibold",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                TRANSITION_CLASS,
                              )}
                            >
                              {t.label}
                            </motion.button>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Most viewed */}
                    {viewed.length > 0 ? (
                      <section>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Flame className="w-3.5 h-3.5 text-orange-500" />
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            Most viewed
                          </h3>
                        </div>
                        <div className="space-y-1.5">
                          {viewed.map((v, i) => (
                            <motion.button
                              key={v.id}
                              type="button"
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ ...springTransition, delay: 0.03 * i }}
                              onClick={() => { onOpenChange(false); setTimeout(() => onOpenScenario(v.id, v.title), 120); }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-card border border-border/50 hover:border-primary/40 text-left",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                TRANSITION_CLASS,
                              )}
                            >
                              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-[12px] font-bold text-foreground leading-tight truncate">
                                  {v.title}
                                </span>
                                <span className="block text-[9px] text-muted-foreground mt-0.5">
                                  {v.count} {v.count === 1 ? "view" : "views"}
                                </span>
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                            </motion.button>
                          ))}
                        </div>
                      </section>
                    ) : (
                      <p className="text-[11px] text-muted-foreground text-center py-2">
                        Open a few scenarios to see your most viewed list here.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
