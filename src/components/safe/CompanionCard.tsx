import { useEffect, useState } from "react";
import { AIRobot } from "@/components/AIRobot";
import { COMPANION_TIPS, MOODS } from "@/data/safeExams";
import { RefreshCw, Wind, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOOD_KEY = "safe_mood_today_v1";

/**
 * Friendly mascot card — pure visual companion. NOT an AI chat. NOT a
 * recommendation engine. Just a rotating set of generic lifestyle tips
 * and a non-medical mood check-in.
 */
export default function CompanionCard() {
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * COMPANION_TIPS.length));
  const [mood, setMood] = useState<string | null>(null);
  const [breathing, setBreathing] = useState(false);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    try { setMood(localStorage.getItem(MOOD_KEY)); } catch { /* ignore */ }
  }, []);

  // Auto-rotate tip every 8s.
  useEffect(() => {
    const id = setInterval(() => {
      setTipIdx((i) => (i + 1) % COMPANION_TIPS.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // Simple 4-4-4 box-breathing cycle (generic relaxation, not medical).
  useEffect(() => {
    if (!breathing) return;
    const cycle: Array<"in" | "hold" | "out"> = ["in", "hold", "out", "hold"];
    let i = 0;
    setPhase(cycle[0]);
    const id = setInterval(() => {
      i = (i + 1) % cycle.length;
      setPhase(cycle[i]);
    }, 4000);
    return () => clearInterval(id);
  }, [breathing]);

  const pickMood = (id: string) => {
    setMood(id);
    try { localStorage.setItem(MOOD_KEY, id); } catch { /* ignore */ }
  };

  const phaseLabel = phase === "in" ? "Breathe in" : phase === "out" ? "Breathe out" : "Hold";

  return (
    <section className="rounded-3xl overflow-hidden border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100/60 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-orange-950/30 dark:border-orange-900/40 shadow-sm">
      <div className="p-4 flex items-start gap-3">
        <div className="shrink-0">
          <AIRobot size={64} />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            Daily Companion
          </p>
          <p className="text-[13.5px] leading-snug text-foreground mt-1">
            {COMPANION_TIPS[tipIdx]}
          </p>
          <button
            type="button"
            onClick={() => setTipIdx((i) => (i + 1) % COMPANION_TIPS.length)}
            className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Another tip
          </button>
        </div>
      </div>

      {/* Mood check-in */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Smile className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
            How are you feeling?
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => pickMood(m.id)}
              aria-pressed={mood === m.id}
              className={`px-2.5 py-1.5 rounded-full border text-[12px] font-semibold flex items-center gap-1 transition-colors ${
                mood === m.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              <span aria-hidden="true">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Breathing timer */}
      <div className="px-4 pb-4">
        {!breathing ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setBreathing(true)}
          >
            <Wind className="w-3.5 h-3.5 mr-1.5" /> One-minute breathing pause
          </Button>
        ) : (
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <div
              className={`mx-auto w-20 h-20 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center transition-transform duration-[4000ms] ease-in-out ${
                phase === "in" ? "scale-110" : phase === "out" ? "scale-90" : "scale-100"
              }`}
              aria-hidden="true"
            >
              <Wind className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
            </div>
            <p className="text-[14px] font-bold mt-3">{phaseLabel}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Generic relaxation exercise — not medical advice.
            </p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setBreathing(false)}>
              Stop
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
