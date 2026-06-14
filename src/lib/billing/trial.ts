// Trial tracker. The 7-day free trial begins on first app launch.
//
// Two layers:
//   1. localStorage — used immediately on cold boot for instant UI.
//   2. Server (trial_starts) — bound to device_id, prevents extension by
//      clearing app data or changing the device clock. Reconciled async via
//      `syncTrialWithServer()` called on app boot.
//
// Paid entitlements always win over trial state.

import { TRIAL_DAYS } from "./plans";
import { getDeviceId } from "./device";
import { supabase } from "@/integrations/supabase/client";

const TRIAL_KEY = "obgyn_trial_started_at";
const TRIAL_SYNCED_KEY = "obgyn_trial_synced"; // "1" after first server sync
const ENTITLEMENT_KEY = "obgyn_entitlement"; // "monthly" | "yearly" | "lifetime"
const ENTITLEMENT_EXPIRES_KEY = "obgyn_entitlement_expires_at";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AccessState {
  hasAccess: boolean;
  status: "trial" | "paid" | "expired";
  daysLeft: number;
  trialEndsAt: string | null;
  paidPlan: "monthly" | "yearly" | "lifetime" | null;
  /** True until the first server reconciliation completes (or its timeout). */
  loading?: boolean;
}

function startTrialIfNeeded(): number {
  const existing = localStorage.getItem(TRIAL_KEY);
  if (existing) return parseInt(existing, 10);
  const now = Date.now();
  localStorage.setItem(TRIAL_KEY, String(now));
  return now;
}

export function getAccessState(): AccessState {
  // Paid entitlement wins.
  const paid = localStorage.getItem(ENTITLEMENT_KEY) as AccessState["paidPlan"];
  const paidExp = localStorage.getItem(ENTITLEMENT_EXPIRES_KEY);
  if (paid === "lifetime") {
    return { hasAccess: true, status: "paid", daysLeft: 9999, trialEndsAt: null, paidPlan: "lifetime" };
  }
  if (paid && paidExp && Date.now() < parseInt(paidExp, 10)) {
    return { hasAccess: true, status: "paid", daysLeft: 0, trialEndsAt: null, paidPlan: paid };
  }

  const startedAt = startTrialIfNeeded();
  const endsAt = startedAt + TRIAL_DAYS * DAY_MS;
  const remaining = endsAt - Date.now();
  const daysLeft = Math.max(0, Math.ceil(remaining / DAY_MS));
  const trialActive = remaining > 0;

  return {
    hasAccess: trialActive,
    status: trialActive ? "trial" : "expired",
    daysLeft,
    trialEndsAt: new Date(endsAt).toISOString(),
    paidPlan: null,
  };
}

/**
 * Reconciles the local trial start with the server-side record bound to
 * device_id. Safe to call multiple times; the server is the source of truth.
 * If the server's start is older than the local one (e.g. user cleared data),
 * we adopt the server's timestamp — preventing trial extension by data wipe.
 */
export async function syncTrialWithServer(): Promise<void> {
  try {
    const deviceId = getDeviceId();
    const { data, error } = await supabase.functions.invoke<{
      trialStartedAt: string;
      trialEndsAt: string;
      daysLeft: number;
    }>("start-trial", { body: { deviceId } });

    if (error || !data?.trialStartedAt) return;

    const serverStart = new Date(data.trialStartedAt).getTime();
    const local = localStorage.getItem(TRIAL_KEY);
    const localStart = local ? parseInt(local, 10) : Number.MAX_SAFE_INTEGER;

    // Adopt server timestamp whenever it's earlier — server is authoritative.
    if (serverStart < localStart) {
      localStorage.setItem(TRIAL_KEY, String(serverStart));
      window.dispatchEvent(new Event("entitlement-changed"));
    } else if (!local) {
      localStorage.setItem(TRIAL_KEY, String(serverStart));
    }
    localStorage.setItem(TRIAL_SYNCED_KEY, "1");
  } catch (err) {
    console.warn("[trial] server sync failed", err);
  }
}

export function grantEntitlement(plan: "monthly" | "yearly" | "lifetime") {
  localStorage.setItem(ENTITLEMENT_KEY, plan);
  if (plan === "monthly") {
    localStorage.setItem(ENTITLEMENT_EXPIRES_KEY, String(Date.now() + 31 * DAY_MS));
  } else if (plan === "yearly") {
    localStorage.setItem(ENTITLEMENT_EXPIRES_KEY, String(Date.now() + 366 * DAY_MS));
  } else {
    localStorage.removeItem(ENTITLEMENT_EXPIRES_KEY);
  }
  window.dispatchEvent(new Event("entitlement-changed"));
}

export function clearEntitlement() {
  localStorage.removeItem(ENTITLEMENT_KEY);
  localStorage.removeItem(ENTITLEMENT_EXPIRES_KEY);
  window.dispatchEvent(new Event("entitlement-changed"));
}
