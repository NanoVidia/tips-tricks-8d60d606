import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId, TRIAL_DAYS } from "@/lib/billing/plans";
import { grantEntitlement } from "@/lib/billing/trial";
import { toast } from "sonner";

interface PaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional context line, e.g. "Trial expired — unlock to continue". */
  reason?: string;
}

/**
 * Subscription paywall. On Android (native build) this triggers Google Play
 * Billing through the Capacitor purchase plugin. In web preview it falls
 * back to a local entitlement grant for testing only.
 */
export function Paywall({ open, onOpenChange, reason }: PaywallProps) {
  const [selected, setSelected] = useState<PlanId>("yearly");
  const [busy, setBusy] = useState(false);

  async function handlePurchase() {
    setBusy(true);
    try {
      // Native Google Play Billing path (cordova-plugin-purchase) — wired on
      // Android only. The shape is intentionally tolerant: if the plugin is
      // not present (e.g. web preview), we fall back to a local grant.
      const native = (window as unknown as { CdvPurchase?: unknown }).CdvPurchase;
      if (native) {
        // Real billing flow lives in src/lib/billing/store.ts (added when the
        // Capacitor plugin is installed). For now, route through the shim.
        const { purchase } = await import("@/lib/billing/store");
        await purchase(selected);
      } else {
        // Web preview fallback — clearly marked.
        await new Promise((r) => setTimeout(r, 600));
        grantEntitlement(selected);
        toast.success("تم تفعيل الاشتراك (وضع المعاينة)");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error("تعذّر إتمام الشراء. حاول مجدداً.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setBusy(true);
    try {
      const { restore } = await import("@/lib/billing/store");
      await restore();
      toast.success("تمت استعادة المشتريات");
    } catch {
      toast.error("لا توجد مشتريات سابقة لاستعادتها");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl p-0 overflow-hidden border-t-2 border-primary/20"
      >
        <div className="h-full overflow-y-auto px-5 pt-6 pb-8" dir="rtl">
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
                      <div className="flex items-center gap-2 mb-0.5">
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
                          : `يشمل ${TRIAL_DAYS} أيام تجربة مجانية`}
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <div className="font-black text-lg leading-none">${p.price}</div>
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
            onClick={handlePurchase}
            disabled={busy}
            className="w-full h-12 text-[15px] font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "متابعة عبر Google Play"}
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

          <p className="text-[10.5px] text-muted-foreground/80 text-center leading-relaxed mt-4">
            يتم التجديد تلقائياً ما لم يتم الإلغاء قبل 24 ساعة من نهاية الفترة.
            يمكنك الإلغاء في أي وقت من إعدادات Google Play.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
