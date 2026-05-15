import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";

export function DisclaimerSplash({ onAccept }: { onAccept: () => void }) {
  const { t } = useTranslations();

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo — 64×64 grid, 4px safe area, golden-ratio petal geometry */}
        <svg viewBox="0 0 64 64" className="w-20 h-20 mx-auto" fill="none" role="img" aria-label="App logo">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.95" />
              <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          {/* Outer ring — 1px stroke, 28r keeps 4px safe area */}
          <circle cx="32" cy="32" r="28" className="stroke-primary/25" strokeWidth="1" />
          {/* 6 petals — radial symmetry, rounded caps */}
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <path
              key={angle}
              d="M32 12 C 36 18, 36 24, 32 30 C 28 24, 28 18, 32 12 Z"
              fill="url(#logoGrad)"
              transform={`rotate(${angle} 32 32)`}
            />
          ))}
          {/* Core — 1:φ ratio to outer ring */}
          <circle cx="32" cy="32" r="5" className="fill-primary" />
          <circle cx="32" cy="32" r="2" className="fill-background" />
          {/* ECG pulse — baseline at y=46, amplitude 6 */}
          <polyline
            points="10,46 22,46 25,38 29,52 33,42 37,48 40,46 54,46"
            className="stroke-primary"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>

        <h1 className="text-xl font-bold text-foreground">{t("appTitle")}</h1>

        <div className="bg-card border border-border rounded-xl p-5 text-start space-y-3">
          <p className="text-sm font-semibold text-destructive">{t("disclaimer")}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("disclaimerText1")}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("disclaimerText2")}</p>
        </div>

        <Button onClick={onAccept} className="w-full h-12 rounded-xl text-base">
          {t("continueBtn")}
        </Button>
      </div>
    </div>
  );
}

export function useDisclaimer() {
  const [accepted, setAccepted] = useState(() => localStorage.getItem("obgyn_disclaimer") === "accepted");
  const accept = () => {
    localStorage.setItem("obgyn_disclaimer", "accepted");
    setAccepted(true);
  };
  return { accepted, accept };
}
