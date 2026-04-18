// عميل موحد للتعامل مع Edge Function admin-control
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
  { label: string; group: string; icon?: string }
> = {
  app_translations: { label: "نصوص الواجهة", group: "ui", icon: "Languages" },
  app_settings: { label: "إعدادات عامة", group: "ui", icon: "Settings" },
  home_sections: { label: "أقسام الصفحة الرئيسية", group: "ui", icon: "LayoutGrid" },
  mcq_questions: { label: "بنك الأسئلة", group: "content", icon: "HelpCircle" },
  surgeries: { label: "موسوعة الجراحات", group: "content", icon: "Scissors" },
  medical_scenarios: { label: "السيناريوهات السريرية", group: "content", icon: "Stethoscope" },
  case_of_the_day: { label: "حالة اليوم", group: "content", icon: "CalendarDays" },
  tools_protocols: { label: "بروتوكولات الطوارئ", group: "tools", icon: "AlertTriangle" },
  tools_drugs: { label: "أدوية الحمل", group: "tools", icon: "Pill" },
  tools_guidelines: { label: "الإرشادات الدولية", group: "tools", icon: "BookOpen" },
  tools_ddx: { label: "التشخيص التفريقي", group: "tools", icon: "GitBranch" },
  exams_meta: { label: "بيانات الامتحانات", group: "exams", icon: "GraduationCap" },
  scheduled_notifications: { label: "الإشعارات", group: "notifications", icon: "Bell" },
};

export const TABLE_GROUPS: Record<string, { label: string; icon: string }> = {
  ui: { label: "الواجهة والمظهر", icon: "Palette" },
  content: { label: "المحتوى التعليمي", icon: "BookOpen" },
  tools: { label: "الأدوات الطبية", icon: "Stethoscope" },
  exams: { label: "الامتحانات", icon: "GraduationCap" },
  notifications: { label: "الإشعارات", icon: "Bell" },
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
    // تجاهل
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
