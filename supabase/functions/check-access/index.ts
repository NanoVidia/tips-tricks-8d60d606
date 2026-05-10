// Authoritative entitlement check — single source of truth for paid access.
//
// Client calls this on app boot, on focus, and after a purchase. We:
//   1. Read the user's `subscriptions` row from the DB (kept fresh by the
//      `play-rtdn-webhook` for cancellations/renewals/refunds).
//   2. If the row is older than STALE_MS, re-verify with Google Play
//      Developer API to pick up off-band changes (e.g. user refunded
//      via Play Store outside the RTDN window).
//   3. Return a simple { hasAccess, status, plan, expiresAt } payload
//      that the client uses to gate locked features.
//
// Anonymous (no JWT) callers receive { hasAccess: false, status: "anonymous" }
// so the client falls back to the local 7-day trial timer.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const PACKAGE_NAME = "app.lovable.tipstricks";
const STALE_MS = 6 * 60 * 60 * 1000; // re-verify with Google every 6h

type Plan = "monthly" | "yearly" | "lifetime";

// ---------- Google OAuth (same approach as verify-purchase) ----------
function b64url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function pemToDer(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let cachedToken: { token: string; exp: number } | null = null;

async function getGoogleAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const raw = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
  if (!raw) return null;
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
  if (!res.ok) {
    console.error("google-oauth-failed", j);
    return null;
  }
  cachedToken = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

async function refreshFromGoogle(
  productId: string,
  purchaseToken: string,
  plan: Plan,
  accessToken: string,
): Promise<{ valid: boolean; expiresAt: string | null; autoRenewing: boolean } | null> {
  try {
    if (plan === "lifetime") {
      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/products/${productId}/tokens/${encodeURIComponent(purchaseToken)}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!r.ok) return null;
      const b = await r.json();
      // 0 = purchased, 1 = canceled, 2 = pending
      return { valid: b.purchaseState === 0, expiresAt: null, autoRenewing: false };
    } else {
      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${productId}/tokens/${encodeURIComponent(purchaseToken)}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!r.ok) return null;
      const b = await r.json();
      const expiryMs = b.expiryTimeMillis ? parseInt(b.expiryTimeMillis, 10) : 0;
      // paymentState: 1 = received, 2 = free trial → both grant access
      const valid = expiryMs > Date.now() && (b.paymentState === 1 || b.paymentState === 2);
      return {
        valid,
        expiresAt: expiryMs ? new Date(expiryMs).toISOString() : null,
        autoRenewing: !!b.autoRenewing,
      };
    }
  } catch (e) {
    console.error("refreshFromGoogle error", e);
    return null;
  }
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // Anonymous → fall back to local trial. Client uses this to short-circuit.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({
      hasAccess: false,
      status: "anonymous",
      plan: null,
      expiresAt: null,
      checkedAt: new Date().toISOString(),
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Validate JWT — uses signing-keys (verify_jwt = false in config).
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) {
    return json({ error: "unauthorized" }, 401);
  }
  const userId = claimsData.claims.sub as string;

  // 1) Read DB row
  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (subErr) {
    console.error("subscriptions select error", subErr);
    return json({ error: "internal" }, 500);
  }

  if (!sub) {
    return json({
      hasAccess: false,
      status: "no-subscription",
      plan: null,
      expiresAt: null,
      checkedAt: new Date().toISOString(),
    });
  }

  // 2) If stale and we have a token + product, re-verify with Google
  let plan: Plan | null = (sub.plan as Plan) ?? null;
  let status: string = sub.status ?? "expired";
  let expiresAt: string | null = sub.current_period_end ?? null;
  let autoRenewing: boolean = sub.auto_renewing ?? false;

  const lastVerifiedMs = sub.last_verified_at ? new Date(sub.last_verified_at).getTime() : 0;
  const isStale = Date.now() - lastVerifiedMs > STALE_MS;

  if (isStale && sub.purchase_token && sub.product_id && plan) {
    const accessToken = await getGoogleAccessToken();
    if (accessToken) {
      const fresh = await refreshFromGoogle(sub.product_id, sub.purchase_token, plan, accessToken);
      if (fresh) {
        status = fresh.valid ? "active" : "expired";
        expiresAt = fresh.expiresAt ?? expiresAt;
        autoRenewing = fresh.autoRenewing;
        await supabase
          .from("subscriptions")
          .update({
            status,
            current_period_end: expiresAt,
            auto_renewing: autoRenewing,
            last_verified_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }
  }

  // 3) Compute access — lifetime is always-on, others must not be expired
  let hasAccess = false;
  if (plan === "lifetime" && status === "active") {
    hasAccess = true;
  } else if (status === "active" && expiresAt && new Date(expiresAt).getTime() > Date.now()) {
    hasAccess = true;
  } else if (status === "trial" && sub.trial_ends_at && new Date(sub.trial_ends_at).getTime() > Date.now()) {
    hasAccess = true;
  }

  return json({
    hasAccess,
    status,
    plan,
    expiresAt,
    autoRenewing,
    trialEndsAt: sub.trial_ends_at,
    checkedAt: new Date().toISOString(),
  });
});
