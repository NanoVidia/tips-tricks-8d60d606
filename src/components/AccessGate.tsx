import { ReactNode, useEffect, useState } from "react";
import { Lock, Crown, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Paywall } from "./Paywall";
import { useAccess } from "@/hooks/useAccess";

interface AccessGateProps {
  /** Content shown when the user has access (trial or paid). */
  children: ReactNode;
  /** Short label used on the lock screen. */
  featureLabel?: string;
}

/**
 * Wraps any locked area. While the trial is active or the user is paid, the
 * children render normally. Otherwise a full-page lock screen is shown with a
 * single CTA to open the Paywall.
 *
 * While the server access check is still pending on cold boot we render a
 * quiet spinner instead of flashing the "expired" screen at paid users.
 */
export function AccessGate({ children, featureLabel = "This section" }: AccessGateProps) {
  const access = useAccess();
  const [paywallOpen, setPaywallOpen] = useState(false);

  // If the user becomes paid (purchase / restore) while the paywall is open,
  // close it immediately so they aren't staring at a sales sheet.
  useEffect(() => {
    if (access.status === "paid" && paywallOpen) setPaywallOpen(false);
  }, [access.status, paywallOpen]);

  if (access.hasAccess) {
    return <>{children}</>;
  }

  // Avoid flashing the lock screen during the brief server reconciliation
  // window on cold boot — paid users would otherwise see "Trial ended"
  // for a fraction of a second.
  if (access.loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-5 py-10">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-4">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tight mb-2">Free Trial Ended</h1>
        <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-5">
          {featureLabel} is available to subscribers only. Subscribe for full access to the question
          bank, exams, clinical scenarios, and surgery library.
        </p>

        <div className="rounded-xl bg-muted/40 border border-border/60 p-3 mb-5 text-[12px] text-left">
          <div className="font-bold mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Always free
          </div>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Daily case question</li>
            <li>• AI assistant</li>
          </ul>
        </div>

        <Button
          onClick={() => setPaywallOpen(true)}
          className="w-full h-12 text-[15px] font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md"
        >
          <Crown className="w-4 h-4" />
          View Subscription Plans
        </Button>

        <Paywall
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          reason="Free trial ended — choose a plan to continue"
        />
      </div>
    </div>
  );
}
