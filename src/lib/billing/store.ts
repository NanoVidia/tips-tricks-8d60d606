// Google Play Billing integration via cordova-plugin-purchase (RMC IAP).
//
// On native Android (Capacitor), `window.CdvPurchase` is injected by the
// plugin after `deviceready`. Calling `store.order(productId)` opens the
// **official Google Play purchase sheet** on the device — no custom UI.
//
// On web preview, the plugin is absent → `getStore()` throws and the
// Paywall falls back to a local entitlement grant for testing.
//
// Flow on a real device:
//   1. App boot → initStore() registers products & queries Google Play
//      for live localized prices (via `store.initialize()`).
//   2. User taps a plan → purchase(planId) → store.order(productId)
//      → Google Play sheet opens (handles card, trial, regional pricing).
//   3. On approval → server-verify via `verify-purchase` edge function
//      (calls Google Play Developer API to confirm authenticity).
//   4. Only after server confirms → grant entitlement + p.finish()
//      (acknowledges the transaction with Google Play).

import { PLANS, type PlanId } from "./plans";
import { grantEntitlement } from "./trial";
import { getDeviceId, rememberPurchaseToken } from "./device";
import { supabase } from "@/integrations/supabase/client";

type ApprovedPayload = {
  id: string;
  transaction?: { purchaseToken?: string; nativePurchase?: { purchaseToken?: string } };
  finish: () => void;
};

type ProductInfo = {
  id: string;
  pricing?: {
    price?: string;          // localized e.g. "$7.99" or "٧٫٩٩ US$"
    priceMicros?: number;
    currency?: string;
  };
  offers?: Array<{
    pricingPhases?: Array<{
      price?: string;
      priceMicros?: number;
      currency?: string;
      billingPeriod?: string;
    }>;
  }>;
  title?: string;
  description?: string;
};

type GlobalWithStore = typeof window & {
  CdvPurchase?: {
    store: {
      register: (products: unknown[]) => void;
      initialize: (platforms?: string[]) => Promise<void>;
      order: (productOrId: string | ProductInfo) => Promise<unknown>;
      restorePurchases: () => Promise<void>;
      get: (id: string) => ProductInfo | undefined;
      products: ProductInfo[];
      when: () => {
        approved: (cb: (p: ApprovedPayload) => void) => void;
        finished: (cb: (p: { id: string }) => void) => void;
        productUpdated?: (cb: (p: ProductInfo) => void) => void;
      };
      verbosity?: number;
    };
    ProductType: { PAID_SUBSCRIPTION: string; NON_CONSUMABLE: string };
    Platform: { GOOGLE_PLAY: string };
    LogLevel?: { DEBUG: number; INFO: number; WARNING: number; ERROR: number };
  };
};

let initialized = false;
let initPromise: Promise<void> | null = null;

function getStore() {
  const w = window as GlobalWithStore;
  if (!w.CdvPurchase) throw new Error("billing-plugin-missing");
  return w.CdvPurchase;
}

export function isBillingAvailable(): boolean {
  return typeof window !== "undefined" && !!(window as GlobalWithStore).CdvPurchase;
}

async function verifyOnServer(productId: string, purchaseToken: string) {
  const { data, error } = await supabase.functions.invoke("verify-purchase", {
    body: { productId, purchaseToken, deviceId: getDeviceId() },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error("server-verification-failed");
  return data as { ok: true; plan: PlanId; expiresAt: string | null };
}

/**
 * Initialize Google Play Billing. Safe to call multiple times — the actual
 * registration happens once. Resolves when `store.initialize()` completes
 * and Google Play has returned product metadata (prices, titles, offers).
 */
export async function initStore(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!isBillingAvailable()) {
      // Web preview — silently skip. Paywall will use the local fallback.
      return;
    }

    const { store, ProductType, Platform, LogLevel } = getStore();

    if (LogLevel) store.verbosity = LogLevel.WARNING;

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
        rememberPurchaseToken(p.id, token);
        const result = await verifyOnServer(p.id, token);
        grantEntitlement(result.plan);
        p.finish(); // acknowledges with Google Play
      } catch (err) {
        // Do NOT call finish() — Play will retry on next launch and
        // the RTDN webhook keeps a server-side record either way.
        console.error("[billing] server verification failed", err);
      }
    });

    // Notify React when product metadata changes (live prices arriving).
    const w = store.when();
    if (w.productUpdated) {
      w.productUpdated(() => {
        window.dispatchEvent(new Event("billing-products-updated"));
      });
    }

    await store.initialize([Platform.GOOGLE_PLAY]);
    initialized = true;
    window.dispatchEvent(new Event("billing-products-updated"));
  })();

  return initPromise;
}

/**
 * Returns live Google Play product info for a plan, or null on web/preview.
 * Call after `initStore()` has resolved (or listen to `billing-products-updated`).
 */
export function getProductInfo(planId: PlanId): ProductInfo | null {
  if (!isBillingAvailable()) return null;
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return null;
  try {
    return getStore().store.get(plan.productId) ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the localized display price (e.g. "$7.99", "٤٩٫٩٩ US$") from
 * Google Play, or `null` if not available yet (still loading or web preview).
 */
export function getLivePrice(planId: PlanId): string | null {
  const info = getProductInfo(planId);
  if (!info) return null;
  // Subscriptions: price lives inside offers → pricingPhases → last phase.
  const phases = info.offers?.[0]?.pricingPhases;
  if (phases && phases.length > 0) {
    const recurring = phases[phases.length - 1];
    if (recurring?.price) return recurring.price;
  }
  return info.pricing?.price ?? null;
}

/**
 * Triggers the **official Google Play purchase sheet** for the given plan.
 * The sheet is rendered natively by Google Play Services, not by the app.
 * Resolves as soon as the sheet is dismissed; success is delivered via the
 * `approved` callback registered in `initStore()`.
 */
export async function purchase(planId: PlanId) {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error("unknown-plan");
  await initStore();
  const { store } = getStore();
  // Prefer passing the live product object — picks up the active offer
  // (with the 7-day free trial) automatically.
  const product = store.get(plan.productId);
  await store.order(product ?? plan.productId);
}

export async function restore() {
  await initStore();
  await getStore().store.restorePurchases();
}
