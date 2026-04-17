// Edge function: generate OB/GYN MCQs via Lovable AI Gateway with structured tool-calling.
// Returns clean JSON: { questions: [{ stem, options[4], answerIndex, explanation, reference }] }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { examName, authority, topic, difficulty, count } = await req.json();
    const n = Math.min(Math.max(Number(count) || 5, 1), 15);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a senior OB/GYN consultant and exam writer for Gulf medical licensing exams (Pearson VUE / Prometric format). Generate clinically accurate, exam-style Single Best Answer MCQs.

Rules:
- Every question must reflect current evidence: RCOG Green-top Guidelines, ACOG Practice Bulletins, NICE, Williams Obstetrics, Berek & Novak.
- Stem: realistic clinical vignette (age, gravidity, gestation, key findings).
- Exactly 4 options, only one clearly best answer.
- Avoid "all of the above" / "none of the above".
- Explanation: 2-4 sentences citing the evidence.
- Reference: short citation (e.g. "RCOG GTG 52", "ACOG PB 234", "NICE NG133", "Williams 26e Ch 41").
- Calibrate to ${difficulty} difficulty.
- Topic focus: ${topic}.
- Target exam: ${examName} (${authority}).`;

    const userPrompt = `Generate ${n} high-quality MCQ${n > 1 ? "s" : ""} for "${topic}" at ${difficulty} level.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_mcqs",
              description: "Return generated MCQs.",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        stem: { type: "string" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          minItems: 4,
                          maxItems: 4,
                        },
                        answerIndex: { type: "integer", minimum: 0, maximum: 3 },
                        explanation: { type: "string" },
                        reference: { type: "string" },
                      },
                      required: ["stem", "options", "answerIndex", "explanation", "reference"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emit_mcqs" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No questions generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-mcq error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
