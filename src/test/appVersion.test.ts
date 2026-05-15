import { describe, expect, it } from "vitest";
import {
  APP_BUILD_DATE,
  APP_ID,
  APP_VERSION_CODE,
  APP_VERSION_LABEL,
  APP_VERSION_NAME,
} from "@/lib/appVersion";

describe("app version metadata", () => {
  it("exposes a valid semver version and positive build code", () => {
    // القيم تتغير مع كل بناء عبر workflow `Build Android AAB`،
    // لذا نتحقق من الشكل لا من قيمة محددة.
    expect(APP_VERSION_NAME).toMatch(/^\d+\.\d+\.\d+$/);
    expect(APP_VERSION_CODE).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(APP_VERSION_CODE)).toBe(true);
    expect(APP_VERSION_LABEL).toBe(`${APP_VERSION_NAME} (build ${APP_VERSION_CODE})`);
  });

  it("keeps capacitor.config.ts and appVersion.ts in sync", async () => {
    const cap = await import("../../capacitor.config");
    expect(cap.APP_VERSION_NAME).toBe(APP_VERSION_NAME);
    expect(cap.APP_VERSION_CODE).toBe(APP_VERSION_CODE);
  });

  it("exposes app id and build date for version info screen", () => {
    expect(APP_ID).toBe("app.lovable.tipstricks");
    expect(typeof APP_BUILD_DATE).toBe("string");
    expect(APP_BUILD_DATE.length).toBeGreaterThan(0);
  });
});
