// Anonymous trial registration. Binds the 7-day free trial to a device_id
// stored server-side so that clearing app data or changing the device clock
// cannot extend the trial.
//
// Request:  POST { deviceId: string }
// Response: { trialStartedAt: ISO, trialEndsAt: ISO, daysLeft: number }
//
// Idempotent: first call inserts a row; subsequent calls return the original
// timestamps.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "method-not-allowed" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { deviceId } = await req.json().catch(() => ({}));
    if (!deviceId || typeof deviceId !== "string" || deviceId.length < 8 || deviceId.length > 128) {
      return json({ error: "bad-deviceId" }, 400);
    }

    // Look up existing trial for this device.
    const { data: existing, error: selErr } = await supabase
      .from("trial_starts")
      .select("started_at, ends_at")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (selErr) {
      console.error("trial_starts select error", selErr);
      return json({ error: "internal" }, 500);
    }

    if (existing) {
      const startedAt = new Date(existing.started_at).getTime();
      const endsAt = existing.ends_at
        ? new Date(existing.ends_at).getTime()
        : startedAt + TRIAL_DAYS * DAY_MS;
      const daysLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / DAY_MS));
      return json({
        trialStartedAt: new Date(startedAt).toISOString(),
        trialEndsAt: new Date(endsAt).toISOString(),
        daysLeft,
      });
    }

    // First-ever launch for this device → create a row.
    const now = Date.now();
    const endsAt = now + TRIAL_DAYS * DAY_MS;
    const { error: insErr } = await supabase.from("trial_starts").insert({
      device_id: deviceId,
      started_at: new Date(now).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
    });
    if (insErr) {
      // Race: another concurrent request inserted first — re-read.
      const { data: again } = await supabase
        .from("trial_starts")
        .select("started_at, ends_at")
        .eq("device_id", deviceId)
        .maybeSingle();
      if (again) {
        const s = new Date(again.started_at).getTime();
        const e = again.ends_at ? new Date(again.ends_at).getTime() : s + TRIAL_DAYS * DAY_MS;
        return json({
          trialStartedAt: new Date(s).toISOString(),
          trialEndsAt: new Date(e).toISOString(),
          daysLeft: Math.max(0, Math.ceil((e - Date.now()) / DAY_MS)),
        });
      }
      console.error("trial_starts insert error", insErr);
      return json({ error: "internal" }, 500);
    }

    return json({
      trialStartedAt: new Date(now).toISOString(),
      trialEndsAt: new Date(endsAt).toISOString(),
      daysLeft: TRIAL_DAYS,
    });
  } catch (e) {
    console.error("start-trial error", e);
    return json({ error: "internal", detail: (e as Error).message }, 500);
  }
});
