import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calculateAttendanceRate, calculateAverageAge } from "@/lib/kindergarten/calculations";
import { KINDERGARTEN_ROUTES } from "@/lib/kindergarten/types";

describe("kindergarten module", () => {
  it("registers all required kindergarten routes in App.tsx", () => {
    const appPath = path.resolve(process.cwd(), "src/App.tsx");
    const appSource = fs.readFileSync(appPath, "utf-8");

    KINDERGARTEN_ROUTES.forEach((route) => {
      expect(appSource).toContain(`path="${route}"`);
    });
  });

  it("calculates attendance and age summary helpers", () => {
    expect(
      calculateAttendanceRate([
        { childId: "1", date: "2026-05-28", status: "present" },
        { childId: "2", date: "2026-05-28", status: "absent" },
        { childId: "3", date: "2026-05-28", status: "present" },
      ]),
    ).toBe(67);

    expect(
      calculateAverageAge([
        { id: "1", name: "A", age: 4, guardianName: "G", phone: "1", allergies: [] },
        { id: "2", name: "B", age: 5, guardianName: "G", phone: "2", allergies: [] },
      ]),
    ).toBe(4.5);
  });
});
