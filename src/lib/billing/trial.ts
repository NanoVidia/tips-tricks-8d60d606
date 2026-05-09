// Local trial tracker. The 7-day free trial begins on first app launch and
// is stored in localStorage. When the device-only trial ends, the user must
// purchase a plan via Google Play Billing for full access to continue.
//
// On native (Android), this state will eventually be reconciled with the
// server-verified `subscriptions` row keyed by user_id; until auth is added,
// the device record is the source of truth.

import { TRIAL_DAYS } from "./plans";

const TRIAL_KEY = "obgyn_trial_started_at";
const ENTITLEMENT_KEY = "obgyn_entitlement"; // "monthly" | "yearly" | "lifetime"
const ENTITLEMENT_EXPIRES_KEY = "obgyn_entitlement_expires_at";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AccessState {
  /** True when the user can access locked features. */
  hasAccess: boolean;
  /** "trial" while in the free 7 days, "paid" after a purchase, "expired" otherwise. */
  status: "trial" | "paid" | "expired";
  /** Days remaining in the trial (0 once expired). */
  daysLeft: number;
  /** Trial end date (ISO). */
  trialEndsAt: string | null;
  /** Active paid plan, if any. */
  paidPlan: "monthly" | "yearly" | "lifetime" | null;
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

/** Called by the billing layer after Google Play confirms a successful purchase. */
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

/** For testing / restore failures. */
export function clearEntitlement() {
  localStorage.removeItem(ENTITLEMENT_KEY);
  localStorage.removeItem(ENTITLEMENT_EXPIRES_KEY);
  window.dispatchEvent(new Event("entitlement-changed"));
}
