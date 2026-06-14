import { useState } from "react";
import { Crown } from "lucide-react";
import { Paywall } from "./Paywall";
import { useAccess } from "@/hooks/useAccess";

/**
 * App-wide trial countdown banner. Renders on every page (including the home)
 * whenever the trial is in its last 3 days. Hidden once the user is paid or
 * the trial has expired (the lock screen / auto-paywall take over).
 */
export function GlobalTrialBanner() {
  const access = useAccess();
  const [open, setOpen] = useState(false);

  const visible = access.status === "trial" && access.daysLeft <= 3 && access.daysLeft > 0;
  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/30 text-[12px] font-medium"
        dir="rtl"
      >
        <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
          <Crown className="w-3.5 h-3.5" />
          تنتهي تجربتك خلال {access.daysLeft} {access.daysLeft === 1 ? "يوم" : "أيام"}
        </span>
        <span className="text-primary font-bold">اشترك الآن ←</span>
      </button>
      <Paywall open={open} onOpenChange={setOpen} reason="تجربتك المجانية على وشك الانتهاء" />
    </>
  );
}
