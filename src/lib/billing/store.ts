// Google Play Billing shim with server-side verification.
//
// On native Android (Capacitor), wraps `cordova-plugin-purchase` (RMC IAP).
// On web preview, the plugin is absent and these functions throw, so the
// Paywall component falls back to local entitlement for testing.
//
// Flow:
//   1. Play Billing returns { productId, purchaseToken } on approval.
//   2. We POST them to the `verify-purchase` edge function which calls the
//      Google Play Developer API to confirm authenticity.
//   3. Only after the server confirms, we grant the local entitlement and
//      acknowledge the transaction (`p.finish()`).

import { PLANS, type PlanId } from "./plans";
import { grantEntitlement } from "./trial";
import { supabase } from "@/integrations/supabase/client";

type ApprovedPayload = {
  id: string;
  transaction?: { purchaseToken?: string; nativePurchase?: { purchaseToken?: string } };
  finish: () => void;
};

type GlobalWithStore = typeof window & {
  CdvPurchase?: {
    store: {
      register: (products: unknown[]) => void;
      initialize: (platforms?: string[]) => Promise<void>;
      order: (productId: string) => Promise<void>;
      restorePurchases: () => Promise<void>;
      when: () => {
        approved: (cb: (p: ApprovedPayload) => void) => void;
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

async function verifyOnServer(productId: string, purchaseToken: string) {
  const { data, error } = await supabase.functions.invoke("verify-purchase", {
    body: { productId, purchaseToken },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error("server-verification-failed");
  return data as { ok: true; plan: PlanId; expiresAt: string | null };
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

  store.when().approved(async (p) => {
    try {
      const token =
        p.transaction?.purchaseToken ?? p.transaction?.nativePurchase?.purchaseToken;
      if (!token) throw new Error("missing-purchase-token");
      const result = await verifyOnServer(p.id, token);
      grantEntitlement(result.plan);
      p.finish();
    } catch (err) {
      // Do NOT call finish() — Play will retry verification on next app launch
      // and the user keeps a record server-side via RTDN webhook.
      console.error("[billing] server verification failed", err);
    }
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
