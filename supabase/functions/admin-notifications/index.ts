import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function bad(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return bad("POST only");

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return bad("invalid json");
  }

  const { action, password } = payload ?? {};
  if (!password || password !== ADMIN_PASSWORD) return unauthorized();

  try {
    if (action === "login") {
      return ok({ ok: true });
    }

    if (action === "list") {
      const { data, error } = await admin
        .from("scheduled_notifications")
        .select("*")
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return ok({ items: data });
    }

    if (action === "create") {
      const { title, body, scheduled_at, repeat_pattern } = payload;
      if (!title || !body || !scheduled_at) return bad("missing fields");
      if (!["none", "daily", "weekly"].includes(repeat_pattern ?? "none"))
        return bad("invalid repeat_pattern");
      const { data, error } = await admin
        .from("scheduled_notifications")
        .insert({
          title: String(title).slice(0, 200),
          body: String(body).slice(0, 1000),
          scheduled_at,
          repeat_pattern: repeat_pattern ?? "none",
          active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return ok({ item: data });
    }

    if (action === "toggle") {
      const { id, active } = payload;
      if (!id) return bad("missing id");
      const { error } = await admin
        .from("scheduled_notifications")
        .update({ active: !!active })
        .eq("id", id);
      if (error) throw error;
      return ok({ ok: true });
    }

    if (action === "delete") {
      const { id } = payload;
      if (!id) return bad("missing id");
      const { error } = await admin.from("scheduled_notifications").delete().eq("id", id);
      if (error) throw error;
      return ok({ ok: true });
    }

    return bad("unknown action");
  } catch (e) {
    console.error("admin-notifications error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
