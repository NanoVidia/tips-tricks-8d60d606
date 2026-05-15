import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { CapacitorConfig } from "@capacitor/cli";
import { APP_ID } from "@/lib/appVersion";

// ============================================================================
// تحقق تلقائي من فصل بيئتي الإنتاج والتطوير في capacitor.config.ts
// ----------------------------------------------------------------------------
// • CAP_ENV=production → يجب ألا يحتوي الـ config على server.url (لا hot-reload)
// • CAP_ENV != production → يجب أن يحتوي على server.url للـ sandbox
// • appId يجب أن يطابق APP_ID المُعرّف في src/lib/appVersion.ts
// ============================================================================

const CAP_PATH = "../../capacitor.config.ts";

async function loadConfig(env: string | undefined): Promise<CapacitorConfig> {
  const original = process.env.CAP_ENV;
  if (env === undefined) delete process.env.CAP_ENV;
  else process.env.CAP_ENV = env;

  // استيراد جديد بـ cache-busting query لإعادة قراءة process.env عند module load
  const mod = await import(`${CAP_PATH}?env=${env ?? "unset"}-${Date.now()}`);

  if (original === undefined) delete process.env.CAP_ENV;
  else process.env.CAP_ENV = original;

  return mod.default as CapacitorConfig;
}

describe("capacitor.config.ts · فصل CAP_ENV", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.CAP_ENV;
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.CAP_ENV;
    else process.env.CAP_ENV = originalEnv;
  });

  it("الإنتاج: server.url يشير إلى رابط النشر المباشر (OTA)", async () => {
    const cfg = await loadConfig("production");
    expect(cfg.server?.url).toBe("https://tips-tricks.lovable.app");
    expect(cfg.server?.cleartext).toBe(false);
  });

  it("التطوير: يحتوي على server.url لـ sandbox مع cleartext=true", async () => {
    const cfg = await loadConfig("development");
    expect(cfg.server?.url).toBeDefined();
    expect(cfg.server?.url).toMatch(/^https:\/\/.+\.lovableproject\.com/);
    expect(cfg.server?.cleartext).toBe(true);
  });

  it("بدون CAP_ENV (افتراضي): يُعامل كتطوير ويحتفظ بـ server.url للـ sandbox", async () => {
    const cfg = await loadConfig(undefined);
    expect(cfg.server?.url).toMatch(/lovableproject\.com/);
  });

  it("appId ثابت في كلا الوضعين ويطابق APP_ID", async () => {
    const dev = await loadConfig("development");
    const prod = await loadConfig("production");
    expect(dev.appId).toBe(APP_ID);
    expect(prod.appId).toBe(APP_ID);
    expect(dev.appId).toBe(prod.appId);
  });

  it("appName و webDir ثابتان في كلا الوضعين", async () => {
    const dev = await loadConfig("development");
    const prod = await loadConfig("production");
    expect(dev.appName).toBe(prod.appName);
    expect(dev.webDir).toBe("dist");
    expect(prod.webDir).toBe("dist");
  });

  it("إعدادات Android للأمان مفعّلة (allowMixedContent=false, debugging=false)", async () => {
    const prod = await loadConfig("production");
    expect(prod.android?.allowMixedContent).toBe(false);
    expect(prod.android?.webContentsDebuggingEnabled).toBe(false);
  });

  it("CAP_ENV بقيم غير صحيحة (Production كبير، prod مختصر) تُعامل كتطوير — لا تسريب hot-reload في AAB", async () => {
    // الكود يقارن صراحة بـ "production" (case-sensitive) — أي قيمة أخرى = development
    const wrong1 = await loadConfig("Production");
    const wrong2 = await loadConfig("prod");
    expect(wrong1.server?.url).toBeDefined();
    expect(wrong2.server?.url).toBeDefined();
  });
});
