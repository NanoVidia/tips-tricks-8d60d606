import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function DisclaimerSplash({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <svg viewBox="0 0 64 64" className="w-20 h-20 mx-auto" fill="none">
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <ellipse key={angle} cx="32" cy="18" rx="6" ry="12" className="fill-primary/30" transform={`rotate(${angle} 32 32)`} />
          ))}
          <circle cx="32" cy="32" r="6" className="fill-primary" />
          <polyline points="8,32 20,32 24,22 28,42 32,28 36,36 40,32 56,32" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>

        <h1 className="text-xl font-bold text-foreground">OB/GYN Clinical Reference</h1>

        <div className="bg-card border border-border rounded-xl p-5 text-left space-y-3">
          <p className="text-sm font-semibold text-destructive">⚠️ Important Disclaimer</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This is an <strong className="text-foreground">educational reference tool for healthcare professionals only</strong> and does not provide medical diagnosis, treatment recommendations, or clinical advice.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All clinical decisions must be made by qualified practitioners based on individual patient assessment.
          </p>
          <p dir="rtl" className="text-sm text-muted-foreground leading-relaxed">
            هذه أداة مرجعية تعليمية للمتخصصين في الرعاية الصحية فقط ولا تقدم تشخيصاً طبياً أو نصائح علاجية.
          </p>
        </div>

        <Button onClick={onAccept} className="w-full h-12 rounded-xl text-base">
          I understand — Continue
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
