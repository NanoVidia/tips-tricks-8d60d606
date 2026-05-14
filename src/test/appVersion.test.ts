import { describe, expect, it } from "vitest";
import {
  APP_BUILD_DATE,
  APP_ID,
  APP_VERSION_CODE,
  APP_VERSION_LABEL,
  APP_VERSION_NAME,
} from "@/lib/appVersion";

describe("app version metadata", () => {
  it("uses initial app version values", () => {
    expect(APP_VERSION_NAME).toBe("1.0.1");
    expect(APP_VERSION_CODE).toBe(1);
    expect(APP_VERSION_LABEL).toBe("1.0.1 (build 1)");
  });

  it("exposes app id and build date for version info screen", () => {
    expect(APP_ID).toBe("app.lovable.tipstricks");
    expect(typeof APP_BUILD_DATE).toBe("string");
    expect(APP_BUILD_DATE.length).toBeGreaterThan(0);
  });
});
