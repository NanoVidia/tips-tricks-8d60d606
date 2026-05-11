import { useState } from "react";
import { BookOpen, Crown, Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { FAMOUS_WOMEN, SELF_CARE_HABITS, WORDS_OF_THE_DAY, dailyIndex } from "@/data/safeContent";
import { Button } from "@/components/ui/button";

export default function DiscoverTab() {
  const [womanIdx, setWomanIdx] = useState(() => dailyIndex(FAMOUS_WOMEN.length));
  const [wordIdx, setWordIdx] = useState(() => dailyIndex(WORDS_OF_THE_DAY.length));

  const woman = FAMOUS_WOMEN[womanIdx];
  const word = WORDS_OF_THE_DAY[wordIdx];

  const move = (setter: (n: number) => void, cur: number, len: number, dir: 1 | -1) =>
    setter((cur + dir + len) % len);

  return (
    <div className="space-y-4">
      {/* Famous Women in History */}
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-amber-500" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Famous Women in History
          </p>
        </div>
        <h3 className="text-[18px] font-bold leading-tight">{woman.name}</h3>
        <p className="text-[12px] text-muted-foreground mt-0.5">{woman.era}</p>
        <p className="text-[14px] leading-relaxed mt-2 text-foreground">{woman.known_for}</p>
        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => move(setWomanIdx, womanIdx, FAMOUS_WOMEN.length, -1)}>
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => move(setWomanIdx, womanIdx, FAMOUS_WOMEN.length, 1)}>
            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
          <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
            {womanIdx + 1} / {FAMOUS_WOMEN.length}
          </span>
        </div>
      </article>

      {/* Word of the day */}
      <article className="rounded-2xl border border-border bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/20 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            Word of the Day
          </p>
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="text-[22px] font-black tracking-tight">{word.word}</h3>
          <span className="text-[12px] italic text-muted-foreground">{word.pos}</span>
        </div>
        <p className="text-[14px] leading-relaxed mt-2 text-foreground">{word.meaning}</p>
        <p className="text-[13px] leading-relaxed mt-2 italic text-muted-foreground">
          “{word.example}”
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => move(setWordIdx, wordIdx, WORDS_OF_THE_DAY.length, 1)}
        >
          Next word <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </article>

      {/* Self-care habits */}
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-4 h-4 text-emerald-500" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Everyday Habits
          </p>
        </div>
        <ul className="space-y-2">
          {SELF_CARE_HABITS.map((h) => (
            <li
              key={h.title}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-background px-3 py-2.5"
            >
              <span className="text-[18px] leading-none mt-0.5" aria-hidden="true">{h.emoji}</span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold leading-tight">{h.title}</p>
                <p className="text-[12.5px] text-muted-foreground leading-snug mt-0.5">{h.tip}</p>
              </div>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
