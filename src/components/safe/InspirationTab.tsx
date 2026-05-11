import { useState } from "react";
import { Heart, Quote, Sparkles, RefreshCw, PencilLine } from "lucide-react";
import { AFFIRMATIONS, MOTHERHOOD_WISDOM, REFLECTION_PROMPTS, dailyIndex } from "@/data/safeContent";
import { Button } from "@/components/ui/button";

export default function InspirationTab() {
  const [affirmIdx, setAffirmIdx] = useState(() => dailyIndex(AFFIRMATIONS.length));
  const [wisdomIdx, setWisdomIdx] = useState(() => dailyIndex(MOTHERHOOD_WISDOM.length));
  const [promptIdx, setPromptIdx] = useState(() => dailyIndex(REFLECTION_PROMPTS.length));

  const cycle = (setter: (n: number) => void, current: number, len: number) =>
    setter((current + 1) % len);

  return (
    <div className="space-y-4">
      {/* Daily affirmation */}
      <article className="rounded-2xl border border-border bg-gradient-to-br from-pink-50 to-amber-50 dark:from-pink-950/30 dark:to-amber-950/20 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">
            Daily Affirmation
          </p>
        </div>
        <p className="text-[18px] font-bold leading-snug text-foreground italic">
          “{AFFIRMATIONS[affirmIdx]}”
        </p>
        <button
          type="button"
          onClick={() => cycle(setAffirmIdx, affirmIdx, AFFIRMATIONS.length)}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-pink-700 dark:text-pink-300 hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Show another
        </button>
      </article>

      {/* Motherhood wisdom */}
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-rose-500" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Motherhood Wisdom
          </p>
        </div>
        <Quote className="w-5 h-5 text-muted-foreground/40 mb-1" />
        <p className="text-[15px] leading-relaxed text-foreground">
          {MOTHERHOOD_WISDOM[wisdomIdx].quote}
        </p>
        <p className="text-[12px] text-muted-foreground mt-2">— {MOTHERHOOD_WISDOM[wisdomIdx].origin}</p>
        <button
          type="button"
          onClick={() => cycle(setWisdomIdx, wisdomIdx, MOTHERHOOD_WISDOM.length)}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Next quote
        </button>
      </article>

      {/* Reflection prompt */}
      <article className="rounded-2xl border border-border bg-muted/40 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <PencilLine className="w-4 h-4 text-indigo-500" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Today's Reflection
          </p>
        </div>
        <p className="text-[15px] leading-relaxed text-foreground">
          {REFLECTION_PROMPTS[promptIdx]}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => cycle(setPromptIdx, promptIdx, REFLECTION_PROMPTS.length)}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> New prompt
        </Button>
      </article>
    </div>
  );
}
