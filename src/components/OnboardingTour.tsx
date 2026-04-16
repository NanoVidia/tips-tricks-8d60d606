import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bot, Wrench, Star, X, ArrowRight, ArrowLeft } from "lucide-react";

const STORAGE_KEY = "onboarding.v1.completed";

const steps = [
  {
    icon: Search,
    title: "Smart Search",
    body: "Type any clinical scenario — handles typos and synonyms across 200+ entries. Hit ↓ to preview matches instantly.",
  },
  {
    icon: Bot,
    title: "AI Bedside Assistant",
    body: "The blue bot bottom-right runs real calculators (EDD, Bishop, MgSO₄, BMI) and checks drug safety in pregnancy.",
  },
  {
    icon: Wrench,
    title: "Clinical Tools Suite",
    body: "Open the Tools page for emergency protocols, FDA drug categories, MCQs, and quick-reference DDx tables.",
  },
  {
    icon: Star,
    title: "Pin your favorites",
    body: "Tap the star next to any calculator, protocol or drug — they sync to a personal Favorites tab on every device using this browser.",
  },
] as const;

/**
 * First-visit onboarding — 4 steps, dismissible, persisted in localStorage.
 * Renders nothing on subsequent visits. Honors prefers-reduced-motion.
 */
export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = window.localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Slight delay so the page paints first
      const t = setTimeout(() => setOpen(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setOpen(false);
  };

  const next = () => {
    if (step === steps.length - 1) { close(); return; }
    setStep((s) => s + 1);
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  if (!open) return null;
  const Step = steps[step];
  const Icon = Step.icon;
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-foreground/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={close}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <motion.div
          key="card"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-card border border-border/60 rounded-3xl overflow-hidden shadow-editorial"
        >
          {/* Top gold hairline */}
          <div className="h-[2px] gradient-gold" />

          <button
            onClick={close}
            aria-label="Skip onboarding"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 pt-7">
            <span className="eyebrow text-gold">Welcome · Step {step + 1} of {steps.length}</span>

            <div className="mt-4 mb-5 flex justify-center">
              <motion.div
                key={step}
                initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="w-16 h-16 rounded-2xl gradient-ink flex items-center justify-center shadow-editorial"
              >
                <Icon className="w-8 h-8 text-gold" strokeWidth={1.5} />
              </motion.div>
            </div>

            <motion.div
              key={`text-${step}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <h2
                id="onboarding-title"
                className="font-editorial text-2xl font-bold leading-tight text-foreground mb-2"
              >
                {Step.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {Step.body}
              </p>
            </motion.div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mt-6" role="tablist">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === step}
                  aria-label={`Go to step ${i + 1}`}
                  onClick={() => setStep(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === step
                      ? "w-6 h-1.5 bg-gold"
                      : "w-1.5 h-1.5 bg-border hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={step === 0 ? close : prev}
                className="flex-1 h-11 rounded-xl border border-border/60 bg-card hover:bg-muted/60 text-sm font-semibold text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-1.5"
              >
                {step === 0 ? "Skip" : (<><ArrowLeft className="w-3.5 h-3.5" /> Back</>)}
              </button>
              <button
                onClick={next}
                className="flex-1 h-11 rounded-xl gradient-ink text-paper text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-editorial hover:shadow-gold"
                style={{ color: "hsl(40 30% 96%)" }}
              >
                {isLast ? "Start exploring" : "Next"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
