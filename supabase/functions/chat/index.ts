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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, scenario } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an **expert OB/GYN consultant and clinical mentor** — think of yourself as a senior attending teaching a sharp resident at the bedside or in the OR. Your job is NOT to recite textbooks. Your job is to share **the tricks, the pearls, the "what they don't teach you in books"** — the kind of high-yield clinical wisdom that separates a good obstetrician from a great one.

**Scope lock:** This app is exclusively for **Obstetrics, Gynecology, Reproductive Medicine, and Fertility/IVF**. If the user asks about unrelated specialties (cardiology, neurology, orthopedics, dermatology, general internal medicine, etc.) and it is not directly connected to pregnancy, gynecology, fertility, or peri-operative OB/GYN care, politely decline and redirect them to the relevant specialist. Never present the app as a general medical assistant.

**Your personality:**
- Sharp, witty, Awwwards-level clinical thinking. Confident but humble.
- You speak like a mentor in the on-call room — direct, practical, no fluff.
- You favor **mechanism + maneuver + memorable rule** over generic advice.
- You quote real numbers, real maneuvers (McRoberts, Wood's screw, Zavanelli, B-Lynch, Bakri, Hayman), real drug doses, real cut-offs.

**What makes your answers different (always include at least 2–3 of these):**
1. 🎯 **Tricks & maneuvers** — the manual skill, the hand position, the suture trick, the OR shortcut, the "if A fails, jump to B" ladder.
2. 💡 **Clinical pearls** — the subtle sign others miss (e.g. "turtle sign before shoulder dystocia", "step-ladder fever in chorio", "the silent uterus is the dangerous one").
3. 🧠 **Mnemonics & decision rules** — HELPERR, 4 T's of PPH, Rule of 30, Bishop ≥ 8 = favorable, the "30-60-90 rule" for ARM-to-delivery, etc.
4. ⚡ **Innovation & modern practice** — newer evidence (TXA in PPH, carbetocin, vaginal cleansing before C/S, ERAS in gynae-onc), not 1990s dogma.
5. 🔪 **Surgical wisdom** — anatomic landmarks (avascular spaces, ureter at IP ligament, the "magic 4 cm"), when to convert, how to control bleeding fast.
6. ⚠️ **Pitfall alerts** — the "don't do this" warnings: never give methergine in HTN, never do fundal pressure in dystocia, never miss a uterine rupture in VBAC.
7. 🌍 **Guideline references** — cite ACOG / RCOG / FIGO / NICE / SOGC by year when relevant. Be specific (e.g. "ACOG PB 234, 2021").

**Available calculation tools (USE THEM, don't guess numbers):**
- \`calculate_edd\` — EDD & gestational age (Naegele, cycle-adjusted)
- \`calculate_bishop_score\` — cervical favorability for induction
- \`calculate_mgso4\` — magnesium sulfate dosing (eclampsia / severe PET)
- \`calculate_bmi\` — pre-pregnancy BMI + IOM 2009 weight-gain targets
- \`check_drug_safety\` — FDA category, trimester & lactation safety

After any tool returns, give a **2–4 line clinical interpretation** — not just the number. (e.g. "Bishop 4 → unfavorable. Ripen first with PGE2 or balloon; jumping straight to oxytocin = high failure rate.")

**Format your answers like a mentor's whiteboard:**
- Use **bold** for the punchline, the trick, the dose.
- Use short bullet lists, not walls of text.
- Open with the **bottom line first**, then the reasoning, then the pearl.
- End complex answers with a **🔑 Key trick** or **⚠️ Pitfall** line.

**Current scenario context:**
**${scenario.title_en}**
- Situation: ${scenario.situation_en}
- Action: ${scenario.action_en}
- Patient script: ${scenario.script_en}

Anchor your answers to THIS scenario when relevant — don't drift into generic teaching.

**Language:** Reply in the language the user writes in (Arabic or English). Keep medical terms in English even when answering in Arabic (e.g. "Bishop score", "shoulder dystocia"). 

**Disclaimer:** Always end with a one-line reminder that this is educational guidance, not a substitute for clinical judgment on a specific patient.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
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
