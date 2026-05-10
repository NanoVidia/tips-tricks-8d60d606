// Shared client for the admin-control backend function
import { supabase } from "@/integrations/supabase/client";

const TOKEN_KEY = "control_token";
const EXPIRES_KEY = "control_token_expires";

export type AdminTable =
  | "app_settings"
  | "app_translations"
  | "mcq_questions"
  | "surgeries"
  | "case_of_the_day"
  | "home_sections"
  | "tools_protocols"
  | "tools_drugs"
  | "tools_guidelines"
  | "tools_ddx"
  | "exams_meta"
  | "medical_scenarios"
  | "scheduled_notifications";

export const ADMIN_TABLES_META: Record<
  AdminTable,
  { label: string; group: string; icon?: string; description: string; template: Record<string, unknown> }
> = {
  app_translations: { label: "Interface text", group: "ui", icon: "Languages", description: "Edit every visible label, title, helper text, and interface phrase.", template: { key: "new_label", en: "New label", ar: "New label", category: "general", context: "Where this text appears" } },
  app_settings: { label: "General & AI settings", group: "ui", icon: "Settings", description: "Edit global settings, contact data, disclaimers, AI model, AI system addendum, and quick-prompt templates.", template: { key: "ai_system_addendum", value: "", category: "ai", description: "Optional extra instruction appended to the AI mentor prompt" } },
  home_sections: { label: "Home sections", group: "ui", icon: "LayoutGrid", description: "Edit home blocks, titles, subtitles, links, icons, colors, ordering, and visibility.", template: { slot: "new_section", title_en: "New section", title_ar: "New section", subtitle_en: "Short description", subtitle_ar: "Short description", icon: "BookOpen", link: "/", color: "primary", display_order: 0, active: true } },
  mcq_questions: { label: "Question bank", group: "content", icon: "HelpCircle", description: "Edit all exam questions, options, answer index, explanation, references, topic, difficulty, exam tags, and active status.", template: { external_id: "custom-001", topic: "General", difficulty: "medium", exams: [], stem: "Clinical question stem", options: ["Option A", "Option B", "Option C", "Option D"], answer_index: 0, explanation: "Detailed explanation with clinical reasoning and guideline reference.", reference: "Guideline / source", active: true } },
  surgeries: { label: "Surgery library", group: "content", icon: "Scissors", description: "Edit procedures, categories, descriptions, steps JSON, pearls, references, videos, embedded surgery MCQs, and ordering.", template: { external_id: "custom-surgery", category: "Obstetric", name_en: "New procedure", name_ar: "New procedure", description: "Procedure summary", difficulty: 3, display_order: 0, steps: { approach: [], duration: "", indications: [], contraindications: [], preOp: [], steps: [], complications: [], postOp: [], videoTitle: "", videoChannel: "" }, pearls: [], references_list: [], mcqs: [], video_id: "", active: true } },
  medical_scenarios: { label: "Clinical scenarios", group: "content", icon: "Stethoscope", description: "Edit scenarios used on the home page, search, sheets, and AI mentor context.", template: { category: "clinic", title_en: "New scenario", title_ar: "New scenario", situation_en: "Clinical situation", situation_ar: "Clinical situation", action_en: "Recommended action", action_ar: "Recommended action", script_en: "Patient-facing script", script_ar: "Patient-facing script", synonyms: [] } },
  case_of_the_day: { label: "Case of the day", group: "content", icon: "CalendarDays", description: "Edit dated cases, answers, references, and active status.", template: { case_date: new Date().toISOString().slice(0, 10), title: "New case", body: "Case vignette", answer: "Teaching answer", references_list: [], active: true } },
  tools_protocols: { label: "Emergency protocols", group: "tools", icon: "AlertTriangle", description: "Edit emergency protocol titles, steps, targets, color, ordering, and active status.", template: { external_id: "custom-protocol", title: "New protocol", title_ar: "New protocol", steps: [], targets: "Target endpoints", color: "red", display_order: 0, active: true } },
  tools_drugs: { label: "Pregnancy drugs", group: "tools", icon: "Pill", description: "Edit drug names, pregnancy category, trimester guidance, lactation status, notes, and active status.", template: { name: "Drug name", category: "Category", trimester: "Trimester guidance", lactation: "Lactation guidance", notes: "Clinical notes", active: true } },
  tools_guidelines: { label: "International guidelines", group: "tools", icon: "BookOpen", description: "Edit societies, regions, guideline bullets, color, ordering, and active status.", template: { society: "Society", region: "Region", color: "blue", items: [], display_order: 0, active: true } },
  tools_ddx: { label: "Differential diagnosis", group: "tools", icon: "GitBranch", description: "Edit presentations, differential lists, red flags, ordering, and active status.", template: { presentation: "Clinical presentation", differentials: [], red_flags: "Red flags", display_order: 0, active: true } },
  exams_meta: { label: "Exam data", group: "exams", icon: "GraduationCap", description: "Edit exam authorities, fees, duration, syllabus, registration links, references, and active status.", template: { exam_id: "NEW", authority: "Authority", country: "Country", country_code: "XX", flag: "🏳️", platform: "Platform", exam_name: "Exam name", level: "Level", format: "Format", duration: "Duration", questions: 0, pass_mark: "Pass mark", fee_usd: "Fee", validity_years: "Validity", official_url: "https://", register_url: "https://", syllabus: [], refs: [], notes: "", display_order: 0, active: true } },
  scheduled_notifications: { label: "Notifications", group: "notifications", icon: "Bell", description: "Edit mobile notification title, body, timing, repeat pattern, and active status.", template: { title: "Notification title", body: "Notification body", scheduled_at: new Date().toISOString(), repeat_pattern: "none", active: true } },
};

export const TABLE_GROUPS: Record<string, { label: string; icon: string }> = {
  ui: { label: "Interface & appearance", icon: "Palette" },
  content: { label: "Educational content", icon: "BookOpen" },
  tools: { label: "Clinical tools", icon: "Stethoscope" },
  exams: { label: "Exams", icon: "GraduationCap" },
  notifications: { label: "Notifications", icon: "Bell" },
};

export function getStoredToken(): string | null {
  const tok = localStorage.getItem(TOKEN_KEY);
  const exp = localStorage.getItem(EXPIRES_KEY);
  if (!tok || !exp) return null;
  if (new Date(exp) < new Date()) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    return null;
  }
  return tok;
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

async function call<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = getStoredToken();
  const { data, error } = await supabase.functions.invoke("admin-control", {
    body: { action, token, ...payload },
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as T;
}

export async function adminLogin(password: string) {
  const { data, error } = await supabase.functions.invoke("admin-control", {
    body: { action: "login", password },
  });
  if (error) throw new Error(error.message);
  const res = data as { token?: string; expiresAt?: string; error?: string };
  if (res.error) throw new Error(res.error);
  if (!res.token || !res.expiresAt) throw new Error("invalid response");
  localStorage.setItem(TOKEN_KEY, res.token);
  localStorage.setItem(EXPIRES_KEY, res.expiresAt);
  return res;
}

export async function adminLogout() {
  try {
    await call("logout");
  } catch {
    // Ignore logout failures
  }
  clearStoredToken();
}

export async function adminVerify() {
  return call<{ ok: boolean; expiresAt: string }>("verify");
}

export async function adminStats() {
  return call<{ counts: Record<string, number> }>("stats");
}

export async function adminList<T = Record<string, unknown>>(
  table: AdminTable,
  opts: {
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
  } = {},
) {
  return call<{ items: T[]; total: number }>("list", { table, ...opts });
}

export async function adminGet<T = Record<string, unknown>>(table: AdminTable, id: string) {
  return call<{ item: T | null }>("get", { table, id });
}

export async function adminCreate<T = Record<string, unknown>>(
  table: AdminTable,
  record: Record<string, unknown>,
) {
  return call<{ item: T }>("create", { table, record });
}

export async function adminUpdate<T = Record<string, unknown>>(
  table: AdminTable,
  id: string,
  record: Record<string, unknown>,
) {
  return call<{ item: T }>("update", { table, id, record });
}

export async function adminDelete(table: AdminTable, id: string) {
  return call<{ ok: boolean }>("delete", { table, id });
}

export async function adminBulkInsert(table: AdminTable, records: Record<string, unknown>[]) {
  return call<{ items: unknown[]; inserted: number }>("bulk_insert", { table, records });
}

// ---------- Billing monitor ----------
export interface BillingMonitorData {
  stats: {
    total: number;
    active: number;
    trial: number;
    expired: number;
    canceled: number;
    byPlan: Record<string, number>;
  };
  events24h: number;
  events7d: number;
  eventTypes: Record<string, number>;
  subscriptions: Array<{
    id: string;
    user_id: string;
    plan: string | null;
    status: string;
    product_id: string | null;
    order_id: string | null;
    purchase_token: string | null;
    auto_renewing: boolean;
    current_period_end: string | null;
    trial_ends_at: string | null;
    last_verified_at: string | null;
    created_at: string;
    updated_at: string;
  }>;
  events: Array<{
    id: string;
    user_id: string | null;
    event_type: string;
    notification_type: number | null;
    product_id: string | null;
    order_id: string | null;
    purchase_token: string | null;
    raw_payload: Record<string, unknown>;
    processed: boolean;
    created_at: string;
  }>;
}

export async function adminBillingMonitor(opts: { eventsLimit?: number; subsLimit?: number } = {}) {
  return call<BillingMonitorData>("billing_monitor", opts);
}

