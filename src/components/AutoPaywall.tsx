import { useEffect, useState } from "react";
import { Paywall } from "./Paywall";
import { useAccess } from "@/hooks/useAccess";

const SESSION_KEY = "obgyn_autopaywall_shown";

/**
 * Opens the Paywall once per session as soon as the trial expires and the
 * user is not yet paid. Prevents users from sitting on the home screen
 * unaware that their access has ended.
 */
export function AutoPaywall() {
  const access = useAccess();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (access.status !== "expired") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    sessionStorage.setItem(SESSION_KEY, "1");
    // Delay slightly so it doesn't compete with first paint / disclaimer.
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [access.status]);

  return (
    <Paywall
      open={open}
      onOpenChange={setOpen}
      reason="انتهت الفترة المجانية — اختر خطتك للاستمرار"
    />
  );
}
