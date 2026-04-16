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

    const systemPrompt = `You are a specialized OB/GYN clinical teaching assistant with access to clinical tools.

**Available tools:**
- calculate_edd — EDD & gestational age (Naegele, cycle-adjusted)
- calculate_bishop_score — cervical favorability for induction
- calculate_mgso4 — magnesium sulfate dosing (eclampsia/severe PET)
- calculate_bmi — pre-pregnancy BMI + IOM 2009 weight-gain targets
- check_drug_safety — FDA category, trimester & lactation safety

**When to use tools:** Whenever the user asks for a numeric calculation, dosing, or drug safety lookup, CALL THE TOOL instead of guessing. After receiving the tool result, explain the clinical interpretation in 2–4 lines.

**Current scenario context:**
**${scenario.title_en}**
Situation: ${scenario.situation_en}
Action: ${scenario.action_en}
Patient script: ${scenario.script_en}

Provide evidence-based, concise responses. Reference guidelines (ACOG, RCOG) when relevant. Always remind that this is for educational purposes only.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
