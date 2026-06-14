// Google Play Real-Time Developer Notifications (RTDN) webhook.
//
// Google Play sends Pub/Sub push notifications here for subscription
// lifecycle events (renewals, cancellations, refunds, etc). We re-fetch
// the authoritative state from Google Play API and update `subscriptions`.
//
// Pub/Sub push payload shape:
//   { message: { data: <base64 JSON>, messageId, publishTime }, subscription }
// The decoded data is:
//   { version, packageName, eventTimeMillis,
//     subscriptionNotification?: { version, notificationType, purchaseToken, subscriptionId },
//     oneTimeProductNotification?: { version, notificationType, purchaseToken, sku },
//     testNotification?: { version } }

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PACKAGE_NAME = "app.lovable.tipstricks";
const PRODUCT_TO_PLAN: Record<string, "monthly" | "yearly" | "lifetime"> = {
  tt_monthly: "monthly",
  tt_yearly: "yearly",
  tt_lifetime: "lifetime",
};

// ---- Google OAuth (same helper as verify-purchase) ----
function b64url(bytes: Uint8Array): string {
  let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function pemToDer(pem: string): Uint8Array {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
let cachedToken: { token: string; exp: number } | null = null;
async function getGoogleAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const sa = JSON.parse(Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")!);
  const enc = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);
  const input = `${b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })))}.${b64url(enc.encode(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  })))}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToDer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(input)));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${input}.${b64url(sig)}` }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`oauth: ${JSON.stringify(j)}`);
  cachedToken = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

// notificationType reference: https://developer.android.com/google/play/billing/rtdn-reference
// IMPORTANT: returned values MUST match DB enum subscription_status:
//   {trial, active, expired, cancelled, on_hold, paused, refunded}
type SubStatus = "active" | "expired" | "cancelled" | "on_hold" | "paused" | "refunded";
function statusFromSubNotificationType(t: number): SubStatus {
  switch (t) {
    case 1: // RECOVERED
    case 2: // RENEWED
    case 4: // PURCHASED
    case 7: // RESTARTED
    case 8: // PRICE_CHANGE_CONFIRMED
    case 9: // DEFERRED
      return "active";
    case 3: // CANCELED (still active until expiry — user opted out of renewal)
      return "cancelled";
    case 5: // ON_HOLD (payment failed, retrying — entitlement revoked)
      return "on_hold";
    case 6: // IN_GRACE_PERIOD (payment failed, still has access)
      return "active";
    case 10: // PAUSED
    case 11: // PAUSE_SCHEDULE_CHANGED
      return "paused";
    case 12: // REVOKED (refund issued)
      return "refunded";
    case 13: // EXPIRED
      return "expired";
    default:
      console.warn("RTDN unknown notificationType", t);
      return "active";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const envelope = await req.json();
    const dataB64 = envelope?.message?.data;
    if (!dataB64) {
      // Acknowledge empty/health pings so Pub/Sub stops retrying.
      return new Response("ok", { status: 200, headers: corsHeaders });
    }
    const decoded = JSON.parse(atob(dataB64));

    // Always log raw payload for audit
    await supabase.from("purchase_events").insert({
      event_type: "rtdn",
      product_id: decoded?.subscriptionNotification?.subscriptionId ?? decoded?.oneTimeProductNotification?.sku ?? null,
      purchase_token: decoded?.subscriptionNotification?.purchaseToken ?? decoded?.oneTimeProductNotification?.purchaseToken ?? null,
      notification_type: decoded?.subscriptionNotification?.notificationType ?? decoded?.oneTimeProductNotification?.notificationType ?? null,
      raw_payload: decoded,
      processed: false,
    });

    if (decoded.testNotification) {
      console.log("RTDN test notification received", decoded.testNotification);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }
    if (decoded.packageName && decoded.packageName !== PACKAGE_NAME) {
      console.warn("RTDN packageName mismatch", decoded.packageName);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const accessToken = await getGoogleAccessToken();

    // ---- Subscriptions ----
    if (decoded.subscriptionNotification) {
      const { subscriptionId, purchaseToken, notificationType } = decoded.subscriptionNotification;
      const plan = PRODUCT_TO_PLAN[subscriptionId];
      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${subscriptionId}/tokens/${encodeURIComponent(purchaseToken)}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const body = await r.json();
      if (!r.ok) {
        console.error("RTDN google fetch failed", r.status, body);
        return new Response("ok", { status: 200, headers: corsHeaders });
      }
      const expiryMs = body.expiryTimeMillis ? parseInt(body.expiryTimeMillis, 10) : 0;
      const status = statusFromSubNotificationType(notificationType);

      // Upsert by purchase_token (works for anonymous device-bound purchases).
      await supabase.from("subscriptions").upsert({
        purchase_token: purchaseToken,
        plan,
        status,
        product_id: subscriptionId,
        order_id: body.orderId ?? null,
        auto_renewing: !!body.autoRenewing,
        current_period_end: expiryMs ? new Date(expiryMs).toISOString() : null,
        last_verified_at: new Date().toISOString(),
      }, { onConflict: "purchase_token" });
    }

    // ---- One-time products (lifetime) ----
    if (decoded.oneTimeProductNotification) {
      const { sku, purchaseToken, notificationType } = decoded.oneTimeProductNotification;
      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/products/${sku}/tokens/${encodeURIComponent(purchaseToken)}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const body = await r.json();
      if (!r.ok) {
        console.error("RTDN one-time fetch failed", r.status, body);
        return new Response("ok", { status: 200, headers: corsHeaders });
      }
      // ONE_TIME_PRODUCT notificationType: 1=PURCHASED, 2=CANCELED/refunded
      const status: SubStatus = notificationType === 2 ? "refunded" : body.purchaseState === 1 ? "cancelled" : "active";
      await supabase.from("subscriptions").upsert({
        purchase_token: purchaseToken,
        plan: "lifetime",
        status,
        product_id: sku,
        order_id: body.orderId ?? null,
        last_verified_at: new Date().toISOString(),
      }, { onConflict: "purchase_token" });
    }

    // Mark event as processed
    await supabase
      .from("purchase_events")
      .update({ processed: true })
      .eq("purchase_token", decoded?.subscriptionNotification?.purchaseToken ?? decoded?.oneTimeProductNotification?.purchaseToken ?? "")
      .eq("processed", false);

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("rtdn handler error", e);
    // Return 200 so Pub/Sub doesn't endlessly retry — we logged the raw payload.
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
});
