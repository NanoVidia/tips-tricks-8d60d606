import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Crown,
  Sparkles,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Bell,
  CreditCard,
  Unlock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId, TRIAL_DAYS } from "@/lib/billing/plans";
import { grantEntitlement } from "@/lib/billing/trial";
import { getLivePrice, isBillingAvailable } from "@/lib/billing/store";
import { getRememberedTokens } from "@/lib/billing/device";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";
import { toast } from "sonner";

interface PaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
}

type Step = "plans" | "trial-explainer";

export function Paywall({ open, onOpenChange, reason }: PaywallProps) {
  // Live localized prices from Google Play (null on web preview).
  const [livePrices, setLivePrices] = useState<Record<PlanId, string | null>>({
    monthly: null,
    yearly: null,
    lifetime: null,
  });

  useEffect(() => {
    const refresh = () => {
      setLivePrices({
        monthly: getLivePrice("monthly"),
        yearly: getLivePrice("yearly"),
        lifetime: getLivePrice("lifetime"),
      });
    };
    refresh();
    window.addEventListener("billing-products-updated", refresh);
    return () => window.removeEventListener("billing-products-updated", refresh);
  }, []);

  const formatPrice = (planId: PlanId, fallback: number) =>
    livePrices[planId] ?? `$${fallback}`;

  const [selected, setSelected] = useState<PlanId>("yearly");
  const [step, setStep] = useState<Step>("plans");
  const [busy, setBusy] = useState(false);

  const access = useAccess();
  const selectedPlan = PLANS.find((p) => p.id === selected)!;
  // Only show the trial-explainer step when the user is still eligible for
  // the local 7-day intro. After expiry, Google Play is the sole authority
  // on trial eligibility — sending them to the explainer would be misleading.
  const hasTrial = selected !== "lifetime" && access.status !== "expired";

  function handleContinue() {
    if (hasTrial) {
      setStep("trial-explainer");
    } else {
      handlePurchase();
    }
  }

  async function handlePurchase() {
    setBusy(true);
    try {
      const native = (window as unknown as { CdvPurchase?: unknown }).CdvPurchase;
      if (native) {
        const { purchase } = await import("@/lib/billing/store");
        await purchase(selected);
      } else if (import.meta.env.DEV) {
        // Developer preview ONLY — never reached in production builds.
        await new Promise((r) => setTimeout(r, 400));
        grantEntitlement(selected);
        toast.success("Subscription activated (preview mode only)");
      } else {
        toast.error("Purchases are only available in the Google Play app.");
        return;
      }
      onOpenChange(false);
      setStep("plans");
    } catch (e) {
      toast.error("Could not complete purchase. Please try again.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  function handleManage() {
    import("@/lib/billing/device").then((m) => m.openManageSubscription());
  }

  async function handleRestore() {
    setBusy(true);
    const loadingId = toast.loading("Restoring from Google Play…");
    let gotEntitlement = false;
    const onEntitlement = () => { gotEntitlement = true; };
    window.addEventListener("entitlement-changed", onEntitlement);
    try {
      const { restore } = await import("@/lib/billing/store");
      await restore();
      // Wait up to 8s for the approved callback → verify-purchase → grantEntitlement.
      for (let i = 0; i < 16 && !gotEntitlement; i++) {
        await new Promise((r) => setTimeout(r, 500));
      }
      // Fallback: ask the server directly with any tokens we've remembered.
      if (!gotEntitlement) {
        const tokens = getRememberedTokens().map((t) => t.purchaseToken);
        if (tokens.length > 0) {
          const { data } = await supabase.functions.invoke<{ hasAccess: boolean; plan: PlanId | null }>(
            "check-access",
            { body: { purchaseTokens: tokens } },
          );
          if (data?.hasAccess && data.plan) {
            grantEntitlement(data.plan);
            gotEntitlement = true;
          }
        }
      }
      toast.dismiss(loadingId);
      if (gotEntitlement) {
        toast.success("Subscription restored successfully.");
        onOpenChange(false);
      } else {
        toast.info(
          "No active subscription found for this Google account. Make sure you are using the same account used for purchase.",
        );
      }
    } catch {
      toast.dismiss(loadingId);
      toast.error("Could not connect to Google Play. Please try again later.");
    } finally {
      window.removeEventListener("entitlement-changed", onEntitlement);
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setStep("plans");
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl p-0 overflow-hidden border-t-2 border-primary/20"
      >
        <div className="h-full overflow-y-auto px-5 pt-6 pb-8">
          <AnimatePresence mode="wait">
            {step === "plans" ? (
              <motion.div
                key="plans"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="text-center mb-5">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-3"
                  >
                    <Crown className="w-7 h-7 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-black tracking-tight">Unlock Full Access</h2>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    {reason ?? `Try ${TRIAL_DAYS} days free, then choose the plan that works for you.`}
                  </p>
                </div>

                {/* Free features hint */}
                <div className="rounded-xl bg-muted/40 border border-border/60 p-3 mb-5 text-[12px] leading-relaxed">
                  <div className="font-bold mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Always free
                  </div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Daily case question</li>
                    <li>• AI assistant</li>
                  </ul>
                </div>

                {/* Plans */}
                <div className="space-y-2.5 mb-5">
                  {PLANS.map((p) => {
                    const isSelected = selected === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelected(p.id)}
                        className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="font-black text-[15px]">{p.labelEn}</span>
                              {p.badge && (
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  {p.badge}
                                </span>
                              )}
                              {p.highlight && (
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  Most popular
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {p.id === "lifetime"
                                ? "One-time payment — lifetime access"
                                : `${TRIAL_DAYS} days free, then auto-renews`}
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <div className="font-black text-lg leading-none">{formatPrice(p.id, p.price)}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{p.per}</div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? "border-primary bg-primary" : "border-border"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* CTA */}
                <Button
                  onClick={handleContinue}
                  disabled={busy}
                  className="w-full h-12 text-[15px] font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md"
                >
                  {hasTrial ? (
                    <>
                      Start 7 days free
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                    </>
                  ) : (
                    "Continue via Google Play"
                  )}
                </Button>

                <div className="flex items-center justify-between mt-3 text-[11px]">
                  <button
                    type="button"
                    onClick={handleRestore}
                    disabled={busy}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-3 h-3" /> Restore purchases
                  </button>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <ShieldCheck className="w-3 h-3" /> Secure payment via Google Play
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 mt-3 text-[11px]">
                  <button type="button" onClick={handleManage} className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                    Manage subscription
                  </button>
                  <span className="text-muted-foreground/40">•</span>
                  <a href="/terms" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Terms</a>
                  <span className="text-muted-foreground/40">•</span>
                  <a href="/privacy" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Privacy</a>
                </div>

                <p className="text-[10.5px] text-muted-foreground/80 text-center leading-relaxed mt-4">
                  Subscription renews automatically unless cancelled at least 24 hours before the end of the current period.
                  You can cancel at any time from Google Play settings.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="trial"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg mb-3"
                  >
                    <Sparkles className="w-7 h-7 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-black tracking-tight">
                    7 days free — no charge today
                  </h2>
                  <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                    Enjoy full access for one week. If the app is not for you, cancel anytime before day 7
                    and you will not be charged.
                  </p>
                </div>

                {/* Timeline */}
                <div className="relative mb-6 rounded-2xl border-2 border-border bg-card p-5">
                  {/* vertical line */}
                  <div className="absolute left-[34px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-400 via-amber-400 to-primary" />

                  {/* Step 1 — today */}
                  <div className="relative flex gap-3 mb-5">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-4 ring-emerald-500/15">
                      <Unlock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="font-bold text-[14px]">Today — immediate free access</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        Your free trial begins with full features. Nothing is charged to your card now.
                      </div>
                    </div>
                  </div>

                  {/* Step 2 — day 5 */}
                  <div className="relative flex gap-3 mb-5">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md ring-4 ring-amber-500/15">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="font-bold text-[14px]">Day 5 — reminder</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        We send a notification 48 hours before the trial ends so you can decide freely.
                      </div>
                    </div>
                  </div>

                  {/* Step 3 — day 7 */}
                  <div className="relative flex gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md ring-4 ring-primary/15">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="font-bold text-[14px]">
                        Day 7 — subscription starts at {formatPrice(selected, selectedPlan.price)}
                        <span className="text-muted-foreground font-medium"> {selectedPlan.per}</span>
                      </div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        Unless cancelled beforehand from Google Play settings. Cancel in seconds, no questions asked.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reassurance */}
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 mb-5 text-[12px] leading-relaxed text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold mb-0.5">No surprises</div>
                      You will receive a clear reminder before the trial ends. If you forget to cancel
                      after being charged, contact us and we will be happy to help.
                    </div>
                  </div>
                </div>

                {/* Selected plan summary */}
                <div className="rounded-xl bg-muted/40 border border-border/60 p-3 mb-5 flex items-center justify-between text-[12px]">
                  <div>
                    <div className="text-muted-foreground">Selected plan</div>
                    <div className="font-bold text-[14px]">{selectedPlan.labelEn}</div>
                  </div>
                  <div className="text-left">
                    <div className="font-black text-base">{formatPrice(selected, selectedPlan.price)}</div>
                    <div className="text-[10px] text-muted-foreground">after trial · {selectedPlan.per}</div>
                  </div>
                </div>

                {/* CTAs */}
                <Button
                  onClick={handlePurchase}
                  disabled={busy}
                  className="w-full h-12 text-[15px] font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md text-white hover:opacity-95"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 ml-1.5" />
                      Start free trial now
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("plans")}
                  disabled={busy}
                  className="w-full mt-3 inline-flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Back to plan selection
                </button>

                <p className="text-[10.5px] text-muted-foreground/80 text-center leading-relaxed mt-4">
                  By tapping "Start free trial" you agree to begin a subscription that auto-renews at {formatPrice(selected, selectedPlan.price)}{" "}
                  {selectedPlan.per} after the {TRIAL_DAYS}-day trial period, via your Google Play account.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
