// Unified backend function for all control-panel operations.
// Handles login, session verification, and CRUD for allowed tables.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-token",
};

const SESSION_DURATION_HOURS = 24;

// Allowed tables and searchable columns.
const ALLOWED_TABLES: Record<string, { searchCols?: string[]; orderCol?: string }> = {
  app_settings: { searchCols: ["key", "category", "description"], orderCol: "key" },
  app_translations: { searchCols: ["key", "ar", "en", "category"], orderCol: "category" },
  mcq_questions: { searchCols: ["topic", "stem", "explanation"], orderCol: "created_at" },
  surgeries: { searchCols: ["name_en", "name_ar", "category"], orderCol: "display_order" },
  case_of_the_day: { searchCols: ["title", "body"], orderCol: "case_date" },
  home_sections: { searchCols: ["title_ar", "title_en", "slot"], orderCol: "display_order" },
  tools_protocols: { searchCols: ["title", "title_ar"], orderCol: "display_order" },
  tools_drugs: { searchCols: ["name", "category", "notes"], orderCol: "name" },
  tools_guidelines: { searchCols: ["society", "region"], orderCol: "display_order" },
  tools_ddx: { searchCols: ["presentation", "red_flags"], orderCol: "display_order" },
  exams_meta: { searchCols: ["exam_id", "authority", "exam_name"], orderCol: "display_order" },
  medical_scenarios: { searchCols: ["title_en", "title_ar", "category"], orderCol: "title_en" },
  scheduled_notifications: { searchCols: ["title", "body"], orderCol: "scheduled_at" },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (!action) return json({ error: "missing action" }, 400);

    // ========== LOGIN ==========
    if (action === "login") {
      const password = String(body.password ?? "");
      const adminPwd = Deno.env.get("ADMIN_PASSWORD") ?? "";
      if (!adminPwd) return json({ error: "ADMIN_PASSWORD not configured" }, 500);
      if (password !== adminPwd) return json({ error: "invalid password" }, 401);

      // Clean expired sessions.
      await supabase.rpc("cleanup_expired_admin_sessions");

      const token = generateToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 3600_000).toISOString();
      const { error } = await supabase
        .from("admin_sessions")
        .insert({ token, expires_at: expiresAt });
      if (error) return json({ error: error.message }, 500);

      return json({ token, expiresAt });
    }

    // ========== All remaining operations require a valid token ==========
    const token =
      req.headers.get("x-admin-token") ?? (body.token as string | undefined) ?? "";
    if (!token) return json({ error: "missing token" }, 401);

    const { data: session, error: sessErr } = await supabase
      .from("admin_sessions")
      .select("expires_at")
      .eq("token", token)
      .maybeSingle();

    if (sessErr || !session) return json({ error: "invalid session" }, 401);
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from("admin_sessions").delete().eq("token", token);
      return json({ error: "session expired" }, 401);
    }

    // ========== LOGOUT ==========
    if (action === "logout") {
      await supabase.from("admin_sessions").delete().eq("token", token);
      return json({ ok: true });
    }

    // ========== VERIFY ==========
    if (action === "verify") {
      return json({ ok: true, expiresAt: session.expires_at });
    }

    // ========== STATS ==========
    if (action === "stats") {
      const tables = Object.keys(ALLOWED_TABLES);
      const counts: Record<string, number> = {};
      await Promise.all(
        tables.map(async (t) => {
          const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
          counts[t] = count ?? 0;
        }),
      );
      return json({ counts });
    }

    // ========== BILLING MONITOR ==========
    // Aggregates subscriptions + recent purchase_events for the admin dashboard.
    if (action === "billing_monitor") {
      const eventsLimit = Math.min(Number(body.eventsLimit ?? 100), 500);
      const subsLimit = Math.min(Number(body.subsLimit ?? 100), 500);

      const [subsRes, eventsRes, allSubsCount] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(subsLimit),
        supabase
          .from("purchase_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(eventsLimit),
        supabase.from("subscriptions").select("status, plan", { count: "exact" }),
      ]);

      if (subsRes.error) return json({ error: subsRes.error.message }, 500);
      if (eventsRes.error) return json({ error: eventsRes.error.message }, 500);

      const subs = subsRes.data ?? [];
      const events = eventsRes.data ?? [];
      const allSubs = allSubsCount.data ?? [];

      // Aggregate stats from full subscriptions table.
      const now = Date.now();
      const stats = {
        total: allSubs.length,
        active: 0,
        trial: 0,
        expired: 0,
        canceled: 0,
        byPlan: { monthly: 0, yearly: 0, lifetime: 0 } as Record<string, number>,
      };
      for (const s of allSubs) {
        const status = (s as { status?: string }).status ?? "unknown";
        if (status === "active") stats.active++;
        else if (status === "trial") stats.trial++;
        else if (status === "expired") stats.expired++;
        else if (status === "canceled") stats.canceled++;
        const plan = (s as { plan?: string }).plan;
        if (plan && stats.byPlan[plan] !== undefined) stats.byPlan[plan]++;
      }

      // Event breakdown last 24h / 7d.
      const day = 24 * 60 * 60 * 1000;
      const events24h = events.filter(
        (e) => now - new Date((e as { created_at: string }).created_at).getTime() < day,
      ).length;
      const events7d = events.filter(
        (e) => now - new Date((e as { created_at: string }).created_at).getTime() < 7 * day,
      ).length;
      const eventTypes: Record<string, number> = {};
      for (const e of events) {
        const t = (e as { event_type?: string }).event_type ?? "unknown";
        eventTypes[t] = (eventTypes[t] ?? 0) + 1;
      }

      return json({
        stats,
        events24h,
        events7d,
        eventTypes,
        subscriptions: subs,
        events,
      });
    }

    // ========== Generic CRUD operations ==========
    const table = body.table as string;
    if (!table || !ALLOWED_TABLES[table]) {
      return json({ error: "invalid table" }, 400);
    }

    const meta = ALLOWED_TABLES[table];

    // LIST
    if (action === "list") {
      const search = (body.search as string | undefined)?.trim() ?? "";
      const limit = Math.min(Number(body.limit ?? 50), 200);
      const offset = Math.max(Number(body.offset ?? 0), 0);
      const orderCol = (body.orderBy as string | undefined) ?? meta.orderCol ?? "created_at";
      const ascending = body.ascending !== false;

      let q = supabase.from(table).select("*", { count: "exact" });
      if (search && meta.searchCols?.length) {
        const ors = meta.searchCols.map((c) => `${c}.ilike.%${search}%`).join(",");
        q = q.or(ors);
      }
      q = q.order(orderCol, { ascending }).range(offset, offset + limit - 1);

      const { data, count, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json({ items: data ?? [], total: count ?? 0 });
    }

    // GET ONE
    if (action === "get") {
      const id = body.id as string;
      if (!id) return json({ error: "missing id" }, 400);
      const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ item: data });
    }

    // CREATE
    if (action === "create") {
      const record = body.record as Record<string, unknown>;
      if (!record || typeof record !== "object") return json({ error: "missing record" }, 400);
      const { data, error } = await supabase.from(table).insert(record).select().single();
      if (error) return json({ error: error.message }, 500);
      return json({ item: data });
    }

    // UPDATE
    if (action === "update") {
      const id = body.id as string;
      const record = body.record as Record<string, unknown>;
      if (!id || !record) return json({ error: "missing id or record" }, 400);
      const { data, error } = await supabase
        .from(table)
        .update(record)
        .eq("id", id)
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ item: data });
    }

    // DELETE
    if (action === "delete") {
      const id = body.id as string;
      if (!id) return json({ error: "missing id" }, 400);
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // BULK INSERT for JSON imports.
    if (action === "bulk_insert") {
      const records = body.records as Record<string, unknown>[];
      if (!Array.isArray(records) || records.length === 0) {
        return json({ error: "missing records array" }, 400);
      }
      if (records.length > 1000) return json({ error: "max 1000 records" }, 400);
      const { data, error } = await supabase.from(table).insert(records).select();
      if (error) return json({ error: error.message }, 500);
      return json({ items: data ?? [], inserted: data?.length ?? 0 });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
