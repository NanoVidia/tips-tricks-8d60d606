// Thin Google Play Billing shim.
//
// On native Android (Capacitor), this wraps `cordova-plugin-purchase` (RMC IAP)
// which talks directly to Google Play Billing Library v7 and renders the
// official Play bottom-sheet payment UI — no external website, no redirect.
//
// On web preview, the plugin is absent and the functions throw, so the Paywall
// component falls back to a local entitlement for testing.
//
// To enable real billing on Android:
//   1. bun add cordova-plugin-purchase
//   2. npx cap sync android
//   3. Add products in Google Play Console with IDs from `plans.ts`.
//   4. Wire the Service Account JSON into the `verify-purchase` edge function.

import { PLANS, type PlanId } from "./plans";
import { grantEntitlement } from "./trial";

type GlobalWithStore = typeof window & {
  CdvPurchase?: {
    store: {
      register: (products: unknown[]) => void;
      initialize: (platforms?: string[]) => Promise<void>;
      order: (productId: string) => Promise<void>;
      restorePurchases: () => Promise<void>;
      when: () => {
        approved: (cb: (p: { id: string; verify: () => Promise<unknown>; finish: () => void }) => void) => void;
        verified: (cb: (p: { id: string; finish: () => void }) => void) => void;
        finished: (cb: (p: { id: string }) => void) => void;
      };
    };
    ProductType: { PAID_SUBSCRIPTION: string; NON_CONSUMABLE: string };
    Platform: { GOOGLE_PLAY: string };
  };
};

let initialized = false;

function getStore() {
  const w = window as GlobalWithStore;
  if (!w.CdvPurchase) throw new Error("billing-plugin-missing");
  return w.CdvPurchase;
}

export async function initStore() {
  if (initialized) return;
  const { store, ProductType, Platform } = getStore();

  store.register(
    PLANS.map((p) => ({
      id: p.productId,
      type: p.id === "lifetime" ? ProductType.NON_CONSUMABLE : ProductType.PAID_SUBSCRIPTION,
      platform: Platform.GOOGLE_PLAY,
    })),
  );

  store.when().approved((p) => p.verify());
  store.when().verified((p) => {
    const plan = PLANS.find((x) => x.productId === p.id);
    if (plan) grantEntitlement(plan.id);
    p.finish();
  });

  await store.initialize([Platform.GOOGLE_PLAY]);
  initialized = true;
}

export async function purchase(planId: PlanId) {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error("unknown-plan");
  await initStore();
  await getStore().store.order(plan.productId);
}

export async function restore() {
  await initStore();
  await getStore().store.restorePurchases();
}
