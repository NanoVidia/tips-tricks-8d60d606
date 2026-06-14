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
        toast.success("تم تفعيل الاشتراك (وضع المعاينة فقط)");
      } else {
        toast.error("الشراء متاح فقط داخل تطبيق Google Play.");
        return;
      }
      onOpenChange(false);
      setStep("plans");
    } catch (e) {
      toast.error("تعذّر إتمام الشراء. حاول مجدداً.");
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
    // Listen for entitlement-changed for up to 5s after restore() — the
    // approved callback fires asynchronously when Google Play replays
    // owned purchases.
    let gotEntitlement = false;
    const onEntitlement = () => { gotEntitlement = true; };
    window.addEventListener("entitlement-changed", onEntitlement);
    try {
      const { restore } = await import("@/lib/billing/store");
      await restore();
      // Wait up to 5s for verify-purchase + grantEntitlement to fire.
      await new Promise((r) => setTimeout(r, 5000));
      if (gotEntitlement) {
        toast.success("تمت استعادة اشتراكك بنجاح");
        onOpenChange(false);
      } else {
        toast.info("لم يتم العثور على اشتراك مرتبط بحساب Google Play هذا");
      }
    } catch {
      toast.error("تعذّر الاتصال بـ Google Play. حاول لاحقاً.");
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
        <div className="h-full overflow-y-auto px-5 pt-6 pb-8" dir="rtl">
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
                  <h2 className="text-xl font-black tracking-tight">افتح الوصول الكامل</h2>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    {reason ?? `جرّب ${TRIAL_DAYS} أيام مجاناً، ثم اختر الخطة الأنسب لك.`}
                  </p>
                </div>

                {/* Free features hint */}
                <div className="rounded-xl bg-muted/40 border border-border/60 p-3 mb-5 text-[12px] leading-relaxed">
                  <div className="font-bold mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    يبقى مجانياً دائماً
                  </div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• حالة سؤال اليوم</li>
                    <li>• المساعد الذكي</li>
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
                        className={`w-full text-right rounded-2xl border-2 p-4 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="font-black text-[15px]">{p.labelAr}</span>
                              {p.badge && (
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  {p.badge}
                                </span>
                              )}
                              {p.highlight && (
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  الأكثر اختياراً
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {p.id === "lifetime"
                                ? "دفعة واحدة — وصول دائم"
                                : `${TRIAL_DAYS} أيام مجاناً، ثم تجديد تلقائي`}
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
                      ابدأ ٧ أيام مجاناً
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                    </>
                  ) : (
                    "متابعة عبر Google Play"
                  )}
                </Button>

                <div className="flex items-center justify-between mt-3 text-[11px]">
                  <button
                    type="button"
                    onClick={handleRestore}
                    disabled={busy}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-3 h-3" /> استعادة المشتريات
                  </button>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <ShieldCheck className="w-3 h-3" /> دفع آمن عبر Google Play
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 mt-3 text-[11px]">
                  <button type="button" onClick={handleManage} className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                    إدارة الاشتراك
                  </button>
                  <span className="text-muted-foreground/40">•</span>
                  <a href="/terms" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">الشروط</a>
                  <span className="text-muted-foreground/40">•</span>
                  <a href="/privacy" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">الخصوصية</a>
                </div>

                <p className="text-[10.5px] text-muted-foreground/80 text-center leading-relaxed mt-4">
                  يتم التجديد تلقائياً ما لم يتم الإلغاء قبل 24 ساعة من نهاية الفترة.
                  يمكنك الإلغاء في أي وقت من إعدادات Google Play.
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
                    ٧ أيام مجاناً — لن يتم خصم أي مبلغ اليوم
                  </h2>
                  <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                    استمتع بالوصول الكامل لمدة أسبوع. إن لم يعجبك التطبيق، ألغِ في أي وقت قبل اليوم السابع
                    ولن يتم خصم شيء.
                  </p>
                </div>

                {/* Timeline */}
                <div className="relative mb-6 rounded-2xl border-2 border-border bg-card p-5">
                  {/* vertical line */}
                  <div className="absolute right-[34px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-400 via-amber-400 to-primary" />

                  {/* Step 1 — today */}
                  <div className="relative flex gap-3 mb-5">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-4 ring-emerald-500/15">
                      <Unlock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="font-bold text-[14px]">اليوم — وصول فوري مجاناً</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        تبدأ تجربتك المجانية بكامل المزايا. لن يخصم شيء من بطاقتك الآن.
                      </div>
                    </div>
                  </div>

                  {/* Step 2 — day 5 */}
                  <div className="relative flex gap-3 mb-5">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md ring-4 ring-amber-500/15">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="font-bold text-[14px]">اليوم الخامس — تذكير</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        نُرسل لك إشعاراً قبل ٤٨ ساعة من انتهاء التجربة، حتى تقرر بحرية.
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
                        اليوم السابع — يبدأ الاشتراك بـ {formatPrice(selected, selectedPlan.price)}
                        <span className="text-muted-foreground font-medium"> {selectedPlan.per}</span>
                      </div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        ما لم تُلغِ قبل ذلك من إعدادات Google Play. الإلغاء في ثانيتين، بدون أسئلة.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reassurance */}
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 mb-5 text-[12px] leading-relaxed text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold mb-0.5">لا مفاجآت</div>
                      ستجد تذكيراً واضحاً قبل انتهاء التجربة. وإن نسيت الإلغاء بعد الخصم، تواصل معنا
                      ويسعدنا مساعدتك.
                    </div>
                  </div>
                </div>

                {/* Selected plan summary */}
                <div className="rounded-xl bg-muted/40 border border-border/60 p-3 mb-5 flex items-center justify-between text-[12px]">
                  <div>
                    <div className="text-muted-foreground">الخطة المختارة</div>
                    <div className="font-bold text-[14px]">{selectedPlan.labelAr}</div>
                  </div>
                  <div className="text-left">
                    <div className="font-black text-base">{formatPrice(selected, selectedPlan.price)}</div>
                    <div className="text-[10px] text-muted-foreground">بعد التجربة • {selectedPlan.per}</div>
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
                      ابدأ التجربة المجانية الآن
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
                  العودة لاختيار خطة أخرى
                </button>

                <p className="text-[10.5px] text-muted-foreground/80 text-center leading-relaxed mt-4">
                  بالضغط على «ابدأ التجربة» فإنك توافق على بدء اشتراك يتجدد تلقائياً بسعر {formatPrice(selected, selectedPlan.price)}{" "}
                  {selectedPlan.per} بعد انتهاء أيام التجربة الـ{TRIAL_DAYS}، عبر حساب Google Play الخاص بك.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
