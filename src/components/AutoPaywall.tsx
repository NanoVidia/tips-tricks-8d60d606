import { useEffect, useState } from "react";
import { Paywall } from "./Paywall";
import { useAccess } from "@/hooks/useAccess";

const SESSION_KEY = "obgyn_autopaywall_last_shown";
const REOPEN_AFTER_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Opens the Paywall automatically when the trial has expired and the user is
 * not paid yet. Shown at most once per 6 hours (timestamp in sessionStorage),
 * and force-opened when a notification deep-links with `?paywall=1`.
 * Auto-closes the sheet when the user becomes paid (after purchase/restore).
 */
export function AutoPaywall() {
  const access = useAccess();
  const [open, setOpen] = useState(false);

  // Auto-close when user becomes paid (purchase / restore success).
  useEffect(() => {
    if (access.status === "paid" && open) setOpen(false);
  }, [access.status, open]);

  useEffect(() => {
    // Deep link from notification tap: ?paywall=1 forces the sheet open.
    const params = new URLSearchParams(window.location.search);
    if (params.get("paywall") === "1" && access.status !== "paid") {
      setOpen(true);
      return;
    }

    if (access.status !== "expired") return;

    const last = parseInt(sessionStorage.getItem(SESSION_KEY) ?? "0", 10);
    if (last && Date.now() - last < REOPEN_AFTER_MS) return;

    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    // Delay slightly so it doesn't compete with first paint / disclaimer.
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [access.status]);

  return (
    <Paywall
      open={open}
      onOpenChange={setOpen}
      reason="Free trial ended — choose a plan to continue"
    />
  );
}
