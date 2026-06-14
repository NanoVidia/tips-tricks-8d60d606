// Server-side verification of Google Play purchases & subscriptions.
//
// Client flow (Capacitor / cordova-plugin-purchase):
//   1. Play Billing returns { productId, purchaseToken } on approval.
//   2. Client POSTs them to this function.
//   3. We call Google Play Developer API to confirm the token is genuine and
//      get the real expiry / state, then upsert into `subscriptions`.
//   4. Client receives { ok, plan, expiresAt } and unlocks features.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PACKAGE_NAME = "app.lovable.tipstricks";
const PRODUCT_TO_PLAN: Record<string, "monthly" | "yearly" | "lifetime"> = {
  tt_monthly: "monthly",
  tt_yearly: "yearly",
  tt_lifetime: "lifetime",
};

// ---------- Google OAuth ----------
function b64url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
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
  const raw = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("missing-service-account");
  const sa = JSON.parse(raw);

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const enc = new TextEncoder();
  const input = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(enc.encode(JSON.stringify(claim)))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(input)));
  const jwt = `${input}.${b64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`google-oauth-failed: ${JSON.stringify(j)}`);
  cachedToken = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

// ---------- Google Play API ----------
async function fetchSubscription(productId: string, token: string, accessToken: string) {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${productId}/tokens/${encodeURIComponent(token)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  return { ok: r.ok, status: r.status, body: await r.json() };
}
async function fetchProduct(productId: string, token: string, accessToken: string) {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/products/${productId}/tokens/${encodeURIComponent(token)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  return { ok: r.ok, status: r.status, body: await r.json() };
}
async function acknowledgeSubscription(productId: string, token: string, accessToken: string) {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${productId}/tokens/${encodeURIComponent(token)}:acknowledge`;
  await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: "{}" });
}
async function acknowledgeProduct(productId: string, token: string, accessToken: string) {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/products/${productId}/tokens/${encodeURIComponent(token)}:acknowledge`;
  await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: "{}" });
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method-not-allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { productId, purchaseToken, deviceId } = await req.json();
    if (!productId || !purchaseToken || typeof productId !== "string" || typeof purchaseToken !== "string") {
      return new Response(JSON.stringify({ error: "bad-request", detail: "productId & purchaseToken required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = PRODUCT_TO_PLAN[productId];
    if (!plan) {
      return new Response(JSON.stringify({ error: "unknown-product", productId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional auth — if user is logged in we'll persist server-side.
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (data?.user) userId = data.user.id;
    }

    const accessToken = await getGoogleAccessToken();

    let valid = false;
    let expiresAt: string | null = null;
    let orderId: string | null = null;
    let autoRenewing = false;
    let raw: unknown = null;

    let isPending = false;

    if (plan === "lifetime") {
      const resp = await fetchProduct(productId, purchaseToken, accessToken);
      raw = resp.body;
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: "google-rejected", status: resp.status, body: resp.body }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // purchaseState: 0 = purchased, 1 = canceled, 2 = pending
      const state = (resp.body as any).purchaseState;
      valid = state === 0;
      isPending = state === 2;
      orderId = (resp.body as any).orderId ?? null;
      if (valid && (resp.body as any).acknowledgementState === 0) {
        await acknowledgeProduct(productId, purchaseToken, accessToken).catch(() => {});
      }
    } else {
      const resp = await fetchSubscription(productId, purchaseToken, accessToken);
      raw = resp.body;
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: "google-rejected", status: resp.status, body: resp.body }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const b = resp.body as any;
      const expiryMs = b.expiryTimeMillis ? parseInt(b.expiryTimeMillis, 10) : 0;
      // paymentState: 0 = pending, 1 = received, 2 = free trial, 3 = pending deferred upgrade
      isPending = b.paymentState === 0 || b.paymentState === 3;
      valid = expiryMs > Date.now() && (b.paymentState === 1 || b.paymentState === 2);
      expiresAt = expiryMs ? new Date(expiryMs).toISOString() : null;
      orderId = b.orderId ?? null;
      autoRenewing = !!b.autoRenewing;
      if (valid && b.acknowledgementState === 0) {
        await acknowledgeSubscription(productId, purchaseToken, accessToken).catch(() => {});
      }
    }

    // Persist subscription keyed on purchase_token (works with or without user).
    // Status must match DB enum: {trial, active, expired, cancelled, on_hold, paused, refunded}
    const status = valid ? "active" : "expired";
    const subRow = {
      user_id: userId, // nullable — anonymous device-bound purchases supported
      plan,
      status,
      purchase_token: purchaseToken,
      product_id: productId,
      order_id: orderId,
      auto_renewing: autoRenewing,
      current_period_end: expiresAt,
      last_verified_at: new Date().toISOString(),
    };
    const { error: upsertErr } = await supabase
      .from("subscriptions")
      .upsert(subRow, { onConflict: "purchase_token" });
    if (upsertErr) console.error("subscriptions upsert failed", upsertErr);

    await supabase.from("purchase_events").insert({
      user_id: userId,
      event_type: userId ? "client_verify" : "client_verify_anon",
      product_id: productId,
      purchase_token: purchaseToken,
      order_id: orderId,
      raw_payload: { ...(raw as object), deviceId: deviceId ?? null },
      processed: true,
    });

    return new Response(
      JSON.stringify({ ok: valid, plan, expiresAt, autoRenewing, orderId }),
      { status: valid ? 200 : 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("verify-purchase error", e);
    return new Response(JSON.stringify({ error: "internal", detail: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
