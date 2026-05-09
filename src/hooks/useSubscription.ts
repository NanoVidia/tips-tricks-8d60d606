// Re-export of useAccess under the more conventional `useSubscription` name.
// Same hook — kept for consumers that prefer the subscription-centric API.
//
// Returns:
//   { hasAccess, status, daysLeft, trialEndsAt, paidPlan }
//
// Status values:
//   "trial"   → in the 7-day free trial
//   "paid"    → active monthly / yearly / lifetime
//   "expired" → trial ended, no purchase

export { useAccess as useSubscription } from "./useAccess";
export type { AccessState as SubscriptionState } from "@/lib/billing/trial";
