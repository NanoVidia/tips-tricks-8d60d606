// Validates GOOGLE_PLAY_SERVICE_ACCOUNT_JSON structure and tries to fetch a Google OAuth token.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

async function signJwt(sa: any): Promise<string> {
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
  return `${input}.${b64url(sig)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const result: Record<string, unknown> = { ok: false, checks: {} as Record<string, unknown> };
  const checks = result.checks as Record<string, unknown>;

  try {
    const raw = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
    checks.secret_present = !!raw;
    if (!raw) throw new Error("Secret not set");

    let sa: any;
    try {
      sa = JSON.parse(raw);
      checks.valid_json = true;
    } catch {
      throw new Error("Secret is not valid JSON");
    }

    const required = ["type", "client_email", "private_key", "private_key_id", "project_id"];
    const missing = required.filter((k) => !sa[k]);
    checks.required_fields = missing.length === 0 ? "ok" : `missing: ${missing.join(", ")}`;
    if (missing.length) throw new Error("Missing required fields");

    checks.type_is_service_account = sa.type === "service_account";
    checks.client_email = sa.client_email;
    checks.project_id = sa.project_id;
    checks.private_key_format =
      typeof sa.private_key === "string" && sa.private_key.includes("BEGIN PRIVATE KEY") ? "ok" : "invalid";

    if (sa.type !== "service_account") throw new Error("type must be 'service_account'");
    if (checks.private_key_format !== "ok") throw new Error("private_key is not a PEM key");

    // Try to obtain Google OAuth token
    const jwt = await signJwt(sa);
    const tokRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
    const tokJson = await tokRes.json();
    checks.google_oauth_status = tokRes.status;
    if (!tokRes.ok) {
      checks.google_oauth_error = tokJson;
      throw new Error("Google rejected the credentials");
    }
    checks.google_oauth = "✅ access_token received";
    result.ok = true;
    result.message = "السر صحيح ويمكنه الاتصال بـ Google Play API";
  } catch (e) {
    result.error = (e as Error).message;
    if (!result.message) {
      result.message = "هناك مشكلة — راجع تفاصيل checks بالأسفل";
    }
  }

  return new Response(JSON.stringify(result, null, 2), {
    status: result.ok ? 200 : 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
