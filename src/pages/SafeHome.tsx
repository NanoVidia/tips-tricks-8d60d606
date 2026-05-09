import { useMemo, useState } from "react";
import { SAFE_QUESTIONS, type SafeQuestion } from "@/data/safeQuestions";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Shuffle, FileText, ShieldCheck } from "lucide-react";
import SafeLegal from "./SafeLegal";

const LEGAL_ACCEPTED_KEY = "safe_legal_accepted_v1";

/**
 * Safe Mode landing page.
 * Renders 100 NON-clinical professional questions.
 */
export default function SafeHome() {
  const [accepted, setAccepted] = useState<boolean>(() => {
    try { return localStorage.getItem(LEGAL_ACCEPTED_KEY) === "1"; } catch { return false; }
  });
  const [view, setView] = useState<{ name: "quiz" } | { name: "legal"; section?: string }>({ name: "quiz" });
  const [order, setOrder] = useState<number[]>(() => SAFE_QUESTIONS.map((_, i) => i));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const acceptLegal = () => {
    try { localStorage.setItem(LEGAL_ACCEPTED_KEY, "1"); } catch { /* ignore */ }
    setAccepted(true);
  };
  const openLegal = (section?: string) => setView({ name: "legal", section });
  if (view.name === "legal") return <SafeLegal onBack={() => setView({ name: "quiz" })} initialSection={view.section} />;

  const q: SafeQuestion = useMemo(() => SAFE_QUESTIONS[order[idx]], [order, idx]);


  const choose = (i: number) => {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
    setAnswered((a) => a + 1);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    setPicked(null);
    setRevealed(false);
    setIdx((i) => (i + 1) % SAFE_QUESTIONS.length);
  };

  const prev = () => {
    setPicked(null);
    setRevealed(false);
    setIdx((i) => (i - 1 + SAFE_QUESTIONS.length) % SAFE_QUESTIONS.length);
  };

  const shuffle = () => {
    const arr = [...order];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setIdx(0);
    setPicked(null);
    setRevealed(false);
  };

  const reset = () => {
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setScore(0);
    setAnswered(0);
  };

  if (!accepted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-[17px] leading-tight">Welcome to Tips &amp; Tricks</h2>
              <p className="text-[12px] text-muted-foreground">Please review and accept to continue</p>
            </div>
          </div>
          <div className="rounded-xl bg-muted/60 border border-border p-3 text-[13px] leading-relaxed max-h-56 overflow-y-auto">
            <p className="mb-2">
              This app provides <strong>general-knowledge entertainment only</strong>.
              It is <strong>not</strong> medical, legal, or professional advice.
            </p>
            <p className="mb-2">
              Quiz progress is stored locally on your device. No personal data is collected.
            </p>
            <p>
              By tapping <strong>Accept &amp; Continue</strong> you confirm you are 18+
              and agree to the Terms, Disclaimer, and Privacy notice.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openLegal("terms")}
            className="text-[12px] text-primary underline"
          >
            Read full Terms &amp; Disclaimer →
          </button>
          <Button onClick={acceptLegal} className="w-full" size="lg">
            <Check className="w-4 h-4 mr-1.5" /> Accept &amp; Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg">
            Q
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-[16px] leading-tight truncate">
              Tips &amp; Tricks — General Knowledge
            </h1>
            <p className="text-[11px] text-muted-foreground leading-tight">
              100 non-clinical questions · history, language, communication, career
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4 pb-32">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Question</p>
            <p className="text-lg font-black tabular-nums">{idx + 1}<span className="text-muted-foreground text-sm">/{SAFE_QUESTIONS.length}</span></p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Answered</p>
            <p className="text-lg font-black tabular-nums">{answered}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Score</p>
            <p className="text-lg font-black tabular-nums">{score}</p>
          </div>
        </div>

        {/* Question card */}
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
            Question #{q.id}
          </p>
          <h2 className="text-[17px] font-bold leading-snug mb-4">{q.q}</h2>

          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const isCorrect = revealed && i === q.answer;
              const isWrongPick = revealed && picked === i && i !== q.answer;
              const base = "w-full text-left rounded-xl border px-3 py-2.5 text-[14px] transition-colors flex items-start gap-2";
              let cls = "border-border bg-background hover:bg-muted";
              if (isCorrect) cls = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100";
              else if (isWrongPick) cls = "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100";
              else if (revealed) cls = "border-border bg-background opacity-70";

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={revealed}
                  className={`${base} ${cls}`}
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

          {revealed && q.explain && (
            <div className="mt-4 rounded-xl bg-muted/60 border border-border p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Explanation</p>
              <p className="text-[13px] leading-relaxed">{q.explain}</p>
            </div>
          )}
        </article>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={prev} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button onClick={next} className="flex-1">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={shuffle} className="flex-1">
            <Shuffle className="w-4 h-4 mr-1" /> Shuffle
          </Button>
          <Button variant="ghost" onClick={reset} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-1" /> Reset score
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground pt-2">
          For general professional knowledge only. Not medical advice.
        </p>
      </main>

      <footer className="border-t border-border bg-card/60">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: "about", label: "About" },
              { id: "faq", label: "FAQ" },
              { id: "credits", label: "Credits & Sources" },
              { id: "changelog", label: "Changelog" },
              { id: "storage", label: "Storage Notice" },
            ].map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => openLegal(it.id)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-[12px] font-semibold hover:bg-muted transition-colors"
              >
                {it.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => openLegal("terms")}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline mx-auto block"
          >
            <FileText className="w-4 h-4 inline" /> Terms &amp; Disclaimer
          </button>
          <p className="text-[10px] text-muted-foreground text-center">
            © {new Date().getFullYear()} Tips &amp; Tricks · Educational entertainment only
          </p>
        </div>
      </footer>
    </div>
  );
}
