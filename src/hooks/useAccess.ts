import { useEffect, useState } from "react";
import { getAccessState, grantEntitlement, type AccessState } from "@/lib/billing/trial";
import { getRememberedTokens } from "@/lib/billing/device";
import { supabase } from "@/integrations/supabase/client";

interface ServerAccess {
  hasAccess: boolean;
  status: string;
  plan: "monthly" | "yearly" | "lifetime" | null;
  expiresAt: string | null;
  trialEndsAt?: string | null;
}

/**
 * React hook returning the current entitlement state.
 *
 * Resolution order (most authoritative first):
 *   1. Server `check-access` edge function — single source of truth for paid
 *      users. Reflects real-time changes (cancellations, refunds, renewals)
 *      via the `play-rtdn-webhook` and a Google Play re-verify if stale.
 *   2. Local trial / entitlement state (localStorage) — used when offline,
 *      anonymous, or before the server responds.
 *
 * The server check runs on mount, on focus, and every 5 min. A successful
 * server response overrides the local view.
 */
export function useAccess(): AccessState {
  const [state, setState] = useState<AccessState>(() => getAccessState());

  // Local refresh (trial countdown, entitlement events).
  useEffect(() => {
    const refresh = () => setState((prev) => {
      const next = getAccessState();
      // Preserve a stronger server-granted "paid" state if local is weaker.
      if (prev.status === "paid" && next.status !== "paid") return prev;
      return next;
    });
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("entitlement-changed", refresh);
    document.addEventListener("visibilitychange", refresh);
    const id = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("entitlement-changed", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(id);
    };
  }, []);

  // Server reconciliation — authoritative when user is logged in.
  useEffect(() => {
    let cancelled = false;

    async function pullFromServer() {
      try {
        const { data: session } = await supabase.auth.getSession();
        const tokens = getRememberedTokens().map((t) => t.purchaseToken);

        // Nothing to ask the server about — fall back to local trial.
        if (!session.session && tokens.length === 0) return;

        const { data, error } = await supabase.functions.invoke<ServerAccess>("check-access", {
          body: tokens.length > 0 ? { purchaseTokens: tokens } : {},
        });
        if (error || !data || cancelled) return;

        if (data.hasAccess && data.plan) {
          // Mirror locally so offline boots still unlock instantly.
          grantEntitlement(data.plan);
          setState({
            hasAccess: true,
            status: "paid",
            daysLeft: data.plan === "lifetime" ? 9999 : 0,
            trialEndsAt: null,
            paidPlan: data.plan,
          });
        } else if (data.status === "expired" || data.status === "no-subscription") {
          setState((prev) => {
            if (prev.status === "paid") {
              localStorage.removeItem("obgyn_entitlement");
              localStorage.removeItem("obgyn_entitlement_expires_at");
              return getAccessState();
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn("[access] server check failed", err);
      }
    }

    pullFromServer();
    const onFocus = () => pullFromServer();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const id = window.setInterval(pullFromServer, 5 * 60_000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.clearInterval(id);
    };
  }, []);

  return state;
}
