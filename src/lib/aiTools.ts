// Client-side execution of AI tool calls.
// Keeping the logic here (instead of in the edge function) means the bot uses
// the same calculations the user sees in the /tools page — single source of truth.
import { pregnancyDrugs } from "@/data/toolsData";

type ToolResult = Record<string, unknown> | { error: string };

function calcEDD(args: { lmp: string; cycleLength?: number }): ToolResult {
  const cycle = Math.max(21, Math.min(45, args.cycleLength ?? 28));
  const lmpDate = new Date(args.lmp);
  if (isNaN(lmpDate.getTime())) return { error: "Invalid LMP date — expected YYYY-MM-DD." };

  const adjustment = cycle - 28;
  const edd = new Date(lmpDate);
  edd.setDate(edd.getDate() + 280 + adjustment);

  const today = new Date();
  const diffDays = Math.floor((today.getTime() - lmpDate.getTime()) / 86400000);
  const gaWeeks = Math.floor(diffDays / 7);
  const gaDays = diffDays % 7;
  const daysToEDD = Math.floor((edd.getTime() - today.getTime()) / 86400000);
  const trimester = gaWeeks < 13 ? 1 : gaWeeks < 28 ? 2 : 3;

  return {
    edd: edd.toISOString().slice(0, 10),
    gestationalAge: `${gaWeeks}w${gaDays}d`,
    trimester,
    daysToEDD,
    cycleAdjustment: adjustment,
  };
}

function calcBishop(args: {
  dilation: number; effacement: number; station: number;
  consistency: "firm" | "medium" | "soft"; position: "posterior" | "mid" | "anterior";
}): ToolResult {
  const dilScore = args.dilation === 0 ? 0 : args.dilation < 2 ? 1 : args.dilation < 4 ? 2 : 3;
  const effScore = args.effacement < 40 ? 0 : args.effacement < 60 ? 1 : args.effacement < 80 ? 2 : 3;
  const staScore = args.station <= -3 ? 0 : args.station <= -2 ? 1 : args.station <= 0 ? 2 : 3;
  const consScore = { firm: 0, medium: 1, soft: 2 }[args.consistency];
  const posScore = { posterior: 0, mid: 1, anterior: 2 }[args.position];
  const total = dilScore + effScore + staScore + consScore + posScore;
  const interpretation =
    total <= 5 ? "Unfavorable — consider cervical ripening (PGE2 / Foley)"
    : total <= 7 ? "Intermediate — induction may succeed; ripening optional"
    : "Favorable — proceed with oxytocin / amniotomy";
  return { total, max: 13, breakdown: { dilation: dilScore, effacement: effScore, station: staScore, consistency: consScore, position: posScore }, interpretation };
}

function calcMgSO4(args: { weightKg?: number; renalImpairment: boolean }): ToolResult {
  const maintenance = args.renalImpairment ? "0.5 g/h IV" : "1–2 g/h IV";
  return {
    loadingDose: "4–6 g IV over 15–20 min",
    maintenance,
    renalAdjusted: args.renalImpairment,
    monitoring: ["Reflexes hourly", "RR > 12", "Urine ≥ 30 mL/h", "SpO₂"],
    therapeuticLevel: "4.8–8.4 mg/dL",
    antidote: "Calcium gluconate 1 g IV over 10 min if toxicity",
    weightKg: args.weightKg ?? null,
  };
}

function calcBMI(args: { weightKg: number; heightCm: number; twin?: boolean }): ToolResult {
  const m = args.heightCm / 100;
  if (m <= 0) return { error: "Invalid height." };
  const bmi = args.weightKg / (m * m);
  let category: string, gainSingleton: string, gainTwin: string;
  if (bmi < 18.5) { category = "Underweight"; gainSingleton = "12.5–18 kg"; gainTwin = "—"; }
  else if (bmi < 25) { category = "Normal"; gainSingleton = "11.5–16 kg"; gainTwin = "17–25 kg"; }
  else if (bmi < 30) { category = "Overweight"; gainSingleton = "7–11.5 kg"; gainTwin = "14–23 kg"; }
  else { category = "Obese"; gainSingleton = "5–9 kg"; gainTwin = "11–19 kg"; }
  return { bmi: +bmi.toFixed(1), category, recommendedGain: args.twin ? gainTwin : gainSingleton, source: "IOM 2009" };
}

function checkDrugSafety(args: { drugs: string[] }): ToolResult {
  const results = args.drugs.map((q) => {
    const needle = q.trim().toLowerCase();
    const match = pregnancyDrugs.find((d) => d.name.toLowerCase().includes(needle) || needle.includes(d.name.toLowerCase().split(" ")[0]));
    if (!match) return { drug: q, found: false };
    return { drug: match.name, found: true, fdaCategory: match.category, trimester: match.trimester, lactation: match.lactation, notes: match.notes };
  });
  const dangerous = results.filter((r) => r.found && (r.fdaCategory?.includes("D") || r.fdaCategory?.includes("X")));
  return { results, warning: dangerous.length > 0 ? `⚠️ ${dangerous.length} drug(s) FDA category D/X — review carefully` : null };
}

export function executeTool(name: string, args: Record<string, unknown>): ToolResult {
  try {
    switch (name) {
      case "calculate_edd": return calcEDD(args as Parameters<typeof calcEDD>[0]);
      case "calculate_bishop_score": return calcBishop(args as Parameters<typeof calcBishop>[0]);
      case "calculate_mgso4": return calcMgSO4(args as Parameters<typeof calcMgSO4>[0]);
      case "calculate_bmi": return calcBMI(args as Parameters<typeof calcBMI>[0]);
      case "check_drug_safety": return checkDrugSafety(args as Parameters<typeof checkDrugSafety>[0]);
      default: return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tool execution failed" };
  }
}

export const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  calculate_edd: { label: "EDD calculator", icon: "👶" },
  calculate_bishop_score: { label: "Bishop Score", icon: "📊" },
  calculate_mgso4: { label: "MgSO₄ dosing", icon: "💉" },
  calculate_bmi: { label: "BMI + weight gain", icon: "⚖️" },
  check_drug_safety: { label: "Drug safety check", icon: "💊" },
};

/* ---------------- Save-to-Tools bridge ----------------
 * Maps an AI tool call → the matching /tools calculator id, plus a
 * prefill payload that the calculator reads on mount via sessionStorage.
 * `null` means: no matching UI calculator (e.g. drug safety opens the Drugs tab).
 */
export type SaveTarget = {
  /** Tab id on the /tools page (calc | drugs | …). */
  tab: "calc" | "drugs";
  /** Calculator id for `?calc=…` (only for tab === "calc"). */
  calcId?: string;
  /** Values written to sessionStorage under `prefill:<calcId>` for the calc to consume. */
  prefill?: Record<string, string | number | boolean>;
  /** For drug safety: query string to seed the drug search. */
  drugQuery?: string;
};

export function getSaveTarget(name: string, rawArgs: string): SaveTarget | null {
  let args: Record<string, unknown> = {};
  try { args = JSON.parse(rawArgs || "{}"); } catch { /* keep empty */ }

  switch (name) {
    case "calculate_edd": {
      const lmp = typeof args.lmp === "string" ? args.lmp : "";
      const cycle = typeof args.cycleLength === "number" ? args.cycleLength : 28;
      return { tab: "calc", calcId: "edd", prefill: { lmp, cycle } };
    }
    case "calculate_bishop_score": {
      // Map raw clinical values → 0..3 indices used by the Bishop UI.
      const dilation = Number(args.dilation ?? 0);
      const effacement = Number(args.effacement ?? 0);
      const station = Number(args.station ?? -3);
      const consistency = String(args.consistency ?? "firm");
      const position = String(args.position ?? "posterior");

      const dil = dilation === 0 ? 0 : dilation < 3 ? 1 : dilation < 5 ? 2 : 3;
      const eff = effacement < 40 ? 0 : effacement < 60 ? 1 : effacement < 80 ? 2 : 3;
      const sta = station <= -3 ? 0 : station <= -2 ? 1 : station <= 0 ? 2 : 3;
      const cons = ({ firm: 0, medium: 1, soft: 2 } as const)[consistency as "firm"] ?? 0;
      const pos = ({ posterior: 0, mid: 1, anterior: 2 } as const)[position as "posterior"] ?? 0;
      return {
        tab: "calc", calcId: "bishop",
        prefill: { dilation: dil, effacement: eff, station: sta, consistency: cons, position: pos },
      };
    }
    case "calculate_mgso4": {
      const weight = typeof args.weightKg === "number" ? args.weightKg : 70;
      const renal = !!args.renalImpairment;
      return { tab: "calc", calcId: "mgso4", prefill: { weight, renal } };
    }
    case "calculate_bmi": {
      const weight = Number(args.weightKg ?? 70);
      const height = Number(args.heightCm ?? 165);
      const twin = !!args.twin;
      return { tab: "calc", calcId: "bmi", prefill: { weight, height, twin } };
    }
    case "check_drug_safety": {
      const drugs = Array.isArray(args.drugs) ? (args.drugs as unknown[]).map(String) : [];
      return { tab: "drugs", drugQuery: drugs[0] ?? "" };
    }
    default:
      return null;
  }
}

/** Build the URL for the /tools page with any required query params. */
export function buildSaveToToolsUrl(target: SaveTarget): string {
  const params = new URLSearchParams();
  params.set("tab", target.tab);
  if (target.calcId) params.set("calc", target.calcId);
  if (target.drugQuery) params.set("q", target.drugQuery);
  return `/tools?${params.toString()}`;
}

const PREFILL_PREFIX = "prefill:";

/** Persist prefill payload so the calculator can pick it up on mount. */
export function stashPrefill(target: SaveTarget) {
  if (target.calcId && target.prefill && typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(
        PREFILL_PREFIX + target.calcId,
        JSON.stringify(target.prefill),
      );
    } catch { /* storage may be unavailable */ }
  }
}

/** Read & clear the one-shot prefill for a given calc id. */
export function consumePrefill<T = Record<string, unknown>>(calcId: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PREFILL_PREFIX + calcId);
    if (!raw) return null;
    window.sessionStorage.removeItem(PREFILL_PREFIX + calcId);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
