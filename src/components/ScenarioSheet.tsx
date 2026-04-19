import { motion } from "framer-motion";
import { MessageCircle, Share2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PhIcon } from "@/components/ui/PhIcon";
import { BookmarkButton } from "@/components/tools/BookmarkButton";
import { useToast } from "@/hooks/use-toast";

type ScenarioCategory = "clinic" | "or_labor" | "behavior" | "qa";

interface Scenario {
  id: string;
  category: ScenarioCategory;
  title_en: string;
  situation_en: string;
  action_en: string;
  script_en: string;
}

interface ScenarioSheetProps {
  scenario: Scenario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAI: (s: Scenario) => void;
  categoryConfig: Record<
    ScenarioCategory,
    { phName: string; iconBg: string; gradient: string }
  >;
  t: (k: string) => string;
}

const SECTIONS = [
  {
    key: "situation_en",
    label: "Situation",
    accent: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
    bar: "bg-sky-500",
  },
  {
    key: "action_en",
    label: "Clinical Action",
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    bar: "bg-emerald-500",
  },
  {
    key: "script_en",
    label: "Patient Script",
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    bar: "bg-amber-500",
  },
] as const;

export function ScenarioSheet({
  scenario,
  open,
  onOpenChange,
  onAI,
  categoryConfig,
  t,
}: ScenarioSheetProps) {
  const { toast } = useToast();

  if (!scenario) return null;
  const cfg = categoryConfig[scenario.category];

  const handleShare = async () => {
    const text = `${scenario.title_en}\n\n${scenario.situation_en}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: scenario.title_en, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard ✓" });
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 max-h-[92vh] overflow-hidden rounded-t-3xl sm:rounded-2xl sm:right-4 sm:left-auto sm:top-4 sm:bottom-4 sm:inset-y-auto sm:max-w-md sm:h-auto sm:max-h-[calc(100vh-2rem)] flex flex-col gap-0 border-t-2 border-primary/20"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="flex flex-col h-full overflow-hidden"
        >
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-2 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="px-5 pt-3 pb-4 border-b border-border/40 bg-gradient-to-br from-card to-muted/30">
            <div className="flex items-start gap-3 pr-8">
              <div
                className={`shrink-0 w-11 h-11 rounded-xl ${cfg.iconBg} flex items-center justify-center shadow-md ring-1 ring-white/20`}
              >
                <PhIcon name={cfg.phName as never} size={20} tone="white" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-editorial text-[17px] font-bold text-foreground leading-snug">
                  {scenario.title_en}
                </h2>
              </div>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-1.5 mt-3 pl-[56px]">
              <BookmarkButton id={`scenario:${scenario.id}`} label={scenario.title_en} size="sm" />
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share"
                className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body - scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {SECTIONS.map((s, i) => (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                className="relative rounded-2xl bg-card border border-border/50 p-4 overflow-hidden"
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar}`} aria-hidden="true" />
                <div
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.16em] border ${s.accent} mb-2`}
                >
                  {s.label}
                </div>
                <p className="text-[14px] leading-7 text-foreground">
                  {scenario[s.key as keyof Scenario] as string}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="px-5 py-4 border-t border-border/40 bg-card">
            <Button
              onClick={() => onAI(scenario)}
              className="w-full h-11 rounded-xl gradient-ink text-paper font-semibold gap-2 shadow-editorial hover:shadow-gold border border-gold/20"
              style={{ color: "hsl(40 30% 96%)" }}
            >
              <MessageCircle className="w-4 h-4 text-gold" />
              {t("discussAI")}
            </Button>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
