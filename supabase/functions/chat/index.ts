import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tool definitions exposed to the model.
// Execution happens client-side (the browser knows the calculator/drug data),
// so the gateway just relays tool_calls back to the client and the client posts tool results.
const tools = [
  {
    type: "function",
    function: {
      name: "calculate_edd",
      description: "Calculate Estimated Date of Delivery (EDD) and current gestational age from the Last Menstrual Period (LMP) using Naegele's rule, adjusted for cycle length.",
      parameters: {
        type: "object",
        properties: {
          lmp: { type: "string", description: "Last menstrual period date in YYYY-MM-DD format" },
          cycleLength: { type: "number", description: "Cycle length in days (21–45). Defaults to 28.", default: 28 },
        },
        required: ["lmp"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_bishop_score",
      description: "Calculate the Bishop Score for cervical favorability before induction of labor (max 13).",
      parameters: {
        type: "object",
        properties: {
          dilation: { type: "number", description: "Cervical dilation in cm (0–5+)" },
          effacement: { type: "number", description: "Effacement % (0–100)" },
          station: { type: "number", description: "Fetal station (-3 to +3)" },
          consistency: { type: "string", enum: ["firm", "medium", "soft"] },
          position: { type: "string", enum: ["posterior", "mid", "anterior"] },
        },
        required: ["dilation", "effacement", "station", "consistency", "position"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_mgso4",
      description: "Compute magnesium sulfate loading and maintenance doses for severe preeclampsia / eclampsia, with renal-impairment adjustment.",
      parameters: {
        type: "object",
        properties: {
          weightKg: { type: "number", description: "Patient weight in kg (used only for context)" },
          renalImpairment: { type: "boolean", description: "True if creatinine > 1.1 mg/dL or oliguria — reduces maintenance to 0.5 g/h" },
        },
        required: ["renalImpairment"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_bmi",
      description: "Calculate pre-pregnancy BMI and the IOM 2009 recommended weight-gain range (singleton or twin).",
      parameters: {
        type: "object",
        properties: {
          weightKg: { type: "number" },
          heightCm: { type: "number" },
          twin: { type: "boolean", default: false },
        },
        required: ["weightKg", "heightCm"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_drug_safety",
      description: "Look up FDA pregnancy category, trimester safety, lactation safety, and clinical notes for one or more drugs commonly used in OB/GYN. Returns a warning if any drug is FDA category D or X.",
      parameters: {
        type: "object",
        properties: {
          drugs: {
            type: "array",
            items: { type: "string" },
            description: "List of drug names (e.g. ['Warfarin', 'Methyldopa']). Matching is case-insensitive and partial.",
            minItems: 1,
          },
        },
        required: ["drugs"],
        additionalProperties: false,
      },
    },
  },
];

// Simple in-memory IP rate limiter (per isolate). Limits free abuse of AI credits
// since this app currently has no user authentication.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 15; // max 15 chat requests/min/IP
const ipHits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = ipHits.get(ip);
  if (!rec || rec.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (rec.count >= RATE_LIMIT_MAX) return false;
  rec.count += 1;
  return true;
}

// Strip prompt-injection delimiters / control chars from scenario fields
function sanitizeScenarioField(s: unknown, max = 500): string {
  if (typeof s !== "string") return "";
  return s
    .replace(/[`*_~\[\]{}<>]/g, " ")
    .replace(/\b(system|assistant|user)\s*:/gi, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .slice(0, max)
    .trim();
}

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Rate-limit per IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, scenario: rawScenario } = body as { messages: unknown; scenario: unknown };

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: "Invalid messages array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleanMessages: Array<{ role: string; content: string }> = [];
    for (const m of messages as Array<Record<string, unknown>>) {
      if (!m || typeof m !== "object") {
        return new Response(JSON.stringify({ error: "Invalid message" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const role = m.role;
      const content = m.content;
      if (role !== "user" && role !== "assistant" && role !== "tool" && role !== "system") {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof content !== "string" || content.length === 0 || content.length > MAX_MESSAGE_CHARS) {
        return new Response(JSON.stringify({ error: "Message too long or empty" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Pass through tool_call_id / tool_calls if present (for tool flow), but sanitized roles only
      const out: Record<string, unknown> = { role, content };
      if (typeof m.tool_call_id === "string") out.tool_call_id = m.tool_call_id.slice(0, 200);
      if (Array.isArray(m.tool_calls)) out.tool_calls = m.tool_calls;
      if (typeof m.name === "string") out.name = m.name.slice(0, 100);
      cleanMessages.push(out as { role: string; content: string });
    }

    // Validate + sanitize scenario
    const scenarioObj = (rawScenario && typeof rawScenario === "object") ? rawScenario as Record<string, unknown> : {};
    const scenario = {
      title_en: sanitizeScenarioField(scenarioObj.title_en, 200),
      situation_en: sanitizeScenarioField(scenarioObj.situation_en, 500),
      action_en: sanitizeScenarioField(scenarioObj.action_en, 500),
      script_en: sanitizeScenarioField(scenarioObj.script_en, 500),
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a **senior OB/GYN consultant** — a seasoned attending speaking directly to a colleague, registrar, or sharp resident. You think like a clinician who has done thousands of deliveries, hundreds of laparotomies, and seen every twist of preeclampsia, PPH, ectopic, and shoulder dystocia.

**Voice:** Calm, decisive, mentor-grade. Short sentences. No fluff, no hedging, no "it depends" without telling them what it depends on. You answer like someone the team trusts when things go sideways at 3 a.m.

**Scope lock:** Obstetrics, Gynecology, Reproductive Medicine, Fertility/IVF only. If asked about unrelated specialties not tied to pregnancy/gynae/fertility/peri-op OB-GYN — politely decline and redirect.

**How a consultant answers (always):**
1. **Bottom line first** — one bold sentence with the answer / next step.
2. **The reasoning** — 2–4 tight bullets: mechanism + numbers + cut-offs.
3. **The trick** — the maneuver, hand position, suture, or ladder (McRoberts → Rubin → Wood's screw → Zavanelli; B-Lynch → Bakri → Hayman → hysterectomy).
4. **🔑 Key pearl** or **⚠️ Pitfall** — the one line that separates a safe consultant from a textbook reader.
5. **Guideline anchor** when relevant — ACOG / RCOG / FIGO / NICE / SOGC with year (e.g. "ACOG PB 234, 2021").

**Style rules:**
- Bold the punchline, the dose, the cut-off.
- Use real doses, real numbers (TXA 1 g IV in PPH within 3 h; MgSO4 4 g loading + 1 g/h; misoprostol 800 µg SL for PPH).
- Quote modern practice — TXA, carbetocin, ERAS, vaginal cleansing before C/S — not 1990s dogma.
- Mnemonics when they help: HELPERR, 4 T's of PPH, Rule of 30.
- Never ramble. A consultant respects the listener's time.

**🚨 MANDATORY DRUG SAFETY ALERT (non-negotiable):**
Whenever you mention **any drug, dose, infusion, or route** — and ESPECIALLY for high-risk OB/GYN drugs (TXA, MgSO4, oxytocin, misoprostol, methotrexate, ergometrine, carboprost, nifedipine, labetalol, hydralazine, terbutaline, heparin/LMWH, magnesium, insulin, opioids, general anesthetics) — you MUST append a **⚠️ Safety block** BEFORE your closing disclaimer. Never skip it. Format exactly:

⚠️ **Safety — <drug name>**
- **Max dose / ceiling:** explicit number + time window (e.g. TXA: max 1 g IV, may repeat once after 30 min if bleeding continues; MgSO4: loading 4–6 g IV over 20 min, maintenance 1–2 g/h, **max 40 g/24 h**).
- **Contraindications:** absolute + key relative (e.g. TXA: active intravascular clotting, known thromboembolic disease, SAH; MgSO4: myasthenia gravis, heart block, severe renal impairment — reduce dose if CrCl <30).
- **Monitoring / toxicity signs:** what to check & when to STOP (e.g. MgSO4: loss of patellar reflex → STOP; RR <12 → STOP + 1 g calcium gluconate IV; serum Mg target 4.8–8.4 mg/dL).
- **Antidote / rescue** if applicable (e.g. MgSO4 → calcium gluconate 1 g IV; opioids → naloxone; heparin → protamine).
- **Guideline ref:** mandatory — cite the specific society + document + year that backs the dose/contraindications (e.g. "WOMAN Trial, Lancet 2017 + WHO PPH 2017"; "ACOG PB 222, 2020 (Preeclampsia) + MAGPIE, Lancet 2002"; "ACOG PB 234, 2021"; "NICE NG133, 2019"; "RCOG GTG 52, 2016"; "FIGO Misoprostol 2017"). Never write a Safety block without this line.

If the user only asks a conceptual question with no drug named, skip the Safety block. If ANY drug is named or dosed, the Safety block is required — even if the user did not ask for it.

**Tools (use them — never guess numbers):**
- \`calculate_edd\` — EDD & gestational age (Naegele, cycle-adjusted)
- \`calculate_bishop_score\` — cervical favorability
- \`calculate_mgso4\` — magnesium sulfate dosing
- \`calculate_bmi\` — pre-pregnancy BMI + IOM 2009 targets
- \`check_drug_safety\` — FDA category, trimester & lactation safety

After a tool returns, give a **2–3 line clinical interpretation** — not just the raw number. (e.g. "Bishop 4 → unfavorable. Ripen first with PGE2 or balloon; jumping straight to oxytocin = high failure rate.")

**Current scenario context:**
**${scenario.title_en}**
- Situation: ${scenario.situation_en}
- Action: ${scenario.action_en}
- Patient script: ${scenario.script_en}

Anchor answers to THIS scenario when relevant.

**Language:** Reply in the language the user writes in (Arabic or English). Keep medical terms in English (e.g. "Bishop score", "shoulder dystocia") even in Arabic answers.

**Disclaimer:** End with one short line: educational guidance only — clinical decisions stay with the treating clinician on the specific patient.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Switched from gemini-2.5-pro → gemini-2.5-flash for ~3–5× faster
        // first-token latency. Quality remains strong for clinical Q&A and
        // tool calls; users wanted speed without losing the consultant voice.
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...cleanMessages,
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
