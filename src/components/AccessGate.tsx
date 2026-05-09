import { ReactNode, useState } from "react";
import { Lock, Crown, Sparkles } from "lucide-react";
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
 */
export function AccessGate({ children, featureLabel = "هذا القسم" }: AccessGateProps) {
  const access = useAccess();
  const [paywallOpen, setPaywallOpen] = useState(false);

  if (access.hasAccess) {
    return (
      <>
        {access.status === "trial" && access.daysLeft <= 3 && (
          <TrialBanner daysLeft={access.daysLeft} onUpgrade={() => setPaywallOpen(true)} />
        )}
        {children}
        <Paywall open={paywallOpen} onOpenChange={setPaywallOpen} />
      </>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-5 py-10" dir="rtl">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-4">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tight mb-2">انتهت الفترة المجانية</h1>
        <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-5">
          {featureLabel} متاح للمشتركين فقط. اشترك للوصول الكامل إلى بنك الأسئلة،
          الاختبارات، السيناريوهات، ومكتبة العمليات.
        </p>

        <div className="rounded-xl bg-muted/40 border border-border/60 p-3 mb-5 text-[12px] text-right">
          <div className="font-bold mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            ما زال متاحاً مجاناً
          </div>
          <ul className="space-y-1 text-muted-foreground">
            <li>• حالة سؤال اليوم</li>
            <li>• المساعد الذكي</li>
          </ul>
        </div>

        <Button
          onClick={() => setPaywallOpen(true)}
          className="w-full h-12 text-[15px] font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md"
        >
          <Crown className="w-4 h-4" />
          عرض خطط الاشتراك
        </Button>

        <Paywall
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          reason="انتهت الفترة المجانية — اختر خطتك للاستمرار"
        />
      </div>
    </div>
  );
}

function TrialBanner({ daysLeft, onUpgrade }: { daysLeft: number; onUpgrade: () => void }) {
  return (
    <button
      type="button"
      onClick={onUpgrade}
      className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-y border-amber-500/30 text-[12px] font-medium"
      dir="rtl"
    >
      <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
        <Crown className="w-3.5 h-3.5" />
        تنتهي تجربتك خلال {daysLeft} {daysLeft === 1 ? "يوم" : "أيام"}
      </span>
      <span className="text-primary font-bold">اشترك الآن ←</span>
    </button>
  );
}
