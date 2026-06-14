import { useState } from "react";
import { Crown, AlertTriangle } from "lucide-react";
import { Paywall } from "./Paywall";
import { useAccess } from "@/hooks/useAccess";

/**
 * App-wide subscription status banner.
 *
 * Visibility rules:
 *  - paid                       → hidden
 *  - trial, days > 3            → hidden
 *  - trial, 2-3 days left       → amber/orange info banner
 *  - trial, 1 day left          → red urgent banner with pulse
 *  - expired                    → red persistent banner ("انتهت تجربتك")
 */
export function GlobalTrialBanner() {
  const access = useAccess();
  const [open, setOpen] = useState(false);

  if (access.status === "paid") return null;

  // Trial countdown variants
  if (access.status === "trial") {
    if (access.daysLeft > 3 || access.daysLeft <= 0) return null;
    const urgent = access.daysLeft === 1;
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            urgent
              ? "w-full flex items-center justify-between gap-2 px-4 py-2 bg-gradient-to-r from-red-500/15 to-rose-500/15 border-b border-red-500/40 text-[12px] font-medium animate-pulse"
              : "w-full flex items-center justify-between gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/30 text-[12px] font-medium"
          }
          dir="rtl"
        >
          <span
            className={
              urgent
                ? "inline-flex items-center gap-1.5 text-red-700 dark:text-red-300"
                : "inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300"
            }
          >
            <Crown className="w-3.5 h-3.5" />
            {urgent
              ? "تنتهي تجربتك خلال يوم واحد"
              : `تنتهي تجربتك خلال ${access.daysLeft} أيام`}
          </span>
          <span className="text-primary font-bold">اشترك الآن ←</span>
        </button>
        <Paywall
          open={open}
          onOpenChange={setOpen}
          reason="تجربتك المجانية على وشك الانتهاء"
        />
      </>
    );
  }

  // Expired — persistent red banner
  if (access.status === "expired") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-rose-500/20 border-b border-red-500/50 text-[12px] font-medium"
          dir="rtl"
        >
          <span className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            انتهت تجربتك المجانية — اشترك للوصول الكامل
          </span>
          <span className="text-primary font-bold">اشترك الآن ←</span>
        </button>
        <Paywall
          open={open}
          onOpenChange={setOpen}
          reason="انتهت الفترة المجانية — اختر خطتك للاستمرار"
        />
      </>
    );
  }

  return null;
}
