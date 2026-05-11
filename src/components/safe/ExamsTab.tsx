import { useMemo, useState } from "react";
import { SAFE_EXAMS, type ExamCategory, type SafeExamQuestion } from "@/data/safeExams";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronRight, ArrowLeft, Trophy, RotateCcw } from "lucide-react";

type View =
  | { name: "list" }
  | { name: "quiz"; cat: ExamCategory; idx: number; picked: number | null; revealed: boolean; score: number }
  | { name: "result"; cat: ExamCategory; score: number };

export default function ExamsTab() {
  const [view, setView] = useState<View>({ name: "list" });

  if (view.name === "list") {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
            Practice Exams
          </p>
          <p className="text-[13px] text-foreground leading-snug">
            Pick a category and try a short, fun knowledge round. For entertainment only.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {SAFE_EXAMS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                setView({ name: "quiz", cat, idx: 0, picked: null, revealed: false, score: 0 })
              }
              className="text-left rounded-2xl border border-border bg-card p-4 shadow-sm hover:bg-muted/40 transition-colors flex items-center gap-3"
            >
              <span className="text-[26px] leading-none" aria-hidden="true">{cat.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold leading-tight">{cat.title}</p>
                <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">
                  {cat.blurb} · {cat.questions.length} questions
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view.name === "result") {
    const total = view.cat.questions.length;
    const pct = Math.round((view.score / total) * 100);
    return (
      <div className="space-y-4">
        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {view.cat.title}
          </p>
          <h3 className="text-[28px] font-black mt-1 tabular-nums">
            {view.score} / {total}
          </h3>
          <p className="text-[14px] text-muted-foreground mt-1">{pct}% correct</p>
        </article>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setView({ name: "list" })}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
          <Button
            className="flex-1"
            onClick={() =>
              setView({ name: "quiz", cat: view.cat, idx: 0, picked: null, revealed: false, score: 0 })
            }
          >
            <RotateCcw className="w-4 h-4 mr-1.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  // Quiz view
  const q: SafeExamQuestion = view.cat.questions[view.idx];
  const total = view.cat.questions.length;

  const choose = (i: number) => {
    if (view.revealed) return;
    setView({
      ...view,
      picked: i,
      revealed: true,
      score: view.score + (i === q.answer ? 1 : 0),
    });
  };

  const next = () => {
    if (view.idx + 1 >= total) {
      setView({ name: "result", cat: view.cat, score: view.score });
      return;
    }
    setView({ ...view, idx: view.idx + 1, picked: null, revealed: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setView({ name: "list" })}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <p className="text-[12px] text-muted-foreground ml-auto tabular-nums">
          Q {view.idx + 1} / {total} · Score {view.score}
        </p>
      </div>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
          {view.cat.emoji} {view.cat.title}
        </p>
        <h2 className="text-[16px] font-bold leading-snug mb-4">{q.q}</h2>

        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const isCorrect = view.revealed && i === q.answer;
            const isWrongPick = view.revealed && view.picked === i && i !== q.answer;
            let cls = "border-border bg-background hover:bg-muted";
            if (isCorrect) cls = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100";
            else if (isWrongPick) cls = "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100";
            else if (view.revealed) cls = "border-border bg-background opacity-70";
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                disabled={view.revealed}
                className={`w-full text-left rounded-xl border px-3 py-2.5 text-[14px] transition-colors flex items-start gap-2 ${cls}`}
              >
                <span className="shrink-0 w-6 h-6 rounded-full border border-current/40 flex items-center justify-center text-[11px] font-black">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
                {isCorrect && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
                {isWrongPick && <X className="w-4 h-4 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {view.revealed && q.explain && (
          <div className="mt-4 rounded-xl bg-muted/60 border border-border p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Explanation
            </p>
            <p className="text-[13px] leading-relaxed">{q.explain}</p>
          </div>
        )}
      </article>

      <Button onClick={next} disabled={!view.revealed} className="w-full">
        {view.idx + 1 >= total ? "See result" : "Next question"}
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
