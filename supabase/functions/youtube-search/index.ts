// Finds a verified, embeddable YouTube surgical video using Lovable AI Gateway
// (google/gemini-3-flash-preview) with structured tool-calling, then validates
// the returned videoId via YouTube oEmbed before returning it.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TRUSTED = [
  "RCOG", "ACOG", "AAGL", "IRCAD", "Nucleus Medical Media",
  "Surgery 101", "ESGO", "IUGA", "Osmosis", "Armando Hasudungan",
  "Lecturio", "Geeky Medics",
];

async function isEmbeddable(id: string): Promise<boolean> {
  if (!id || id.length < 6) return false;
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
    );
    return r.ok;
  } catch {
    return false;
  }
}

function extractId(s: string): string | null {
  if (!s) return null;
  const m = s.match(/[a-zA-Z0-9_-]{11}/);
  return m ? m[0] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { surgeryName } = await req.json();
    if (!surgeryName || typeof surgeryName !== "string") {
      return new Response(
        JSON.stringify({ error: "surgeryName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = `You are a precise medical-education research assistant.
Your task is to identify up to 5 high-quality, publicly available, embeddable YouTube videos
that demonstrate a specific obstetric/gynecologic surgical procedure.

Rules:
- Only return videos you are highly confident actually exist on YouTube right now.
- Strongly prefer recognized educational/medical channels: ${TRUSTED.join(", ")}.
- Each video must be educational (technique demonstration, narrated surgery, animation, or lecture).
- Each 11-character YouTube videoId MUST be from a real public video, never invented.
- Order candidates by your confidence (most confident first).
- If you cannot confidently provide any real video, return an empty candidates array.`;

    const userPrompt = `Provide up to 5 candidate educational YouTube videos for the surgical procedure: "${surgeryName}".`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_youtube_candidates",
              description:
                "Return up to 5 candidate YouTube videos demonstrating the requested surgical procedure, ordered by confidence.",
              parameters: {
                type: "object",
                properties: {
                  candidates: {
                    type: "array",
                    maxItems: 5,
                    items: {
                      type: "object",
                      properties: {
                        videoId: { type: "string", description: "11-character YouTube video ID." },
                        title: { type: "string" },
                        channel: { type: "string" },
                        url: { type: "string", description: "Full YouTube watch URL." },
                      },
                      required: ["videoId", "title", "channel", "url"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["candidates"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_youtube_candidates" } },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error(`Lovable AI ${aiRes.status}: ${text}`);

      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ found: false, reason: "rate-limited" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ found: false, reason: "ai-credits-exhausted" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ found: false, reason: "ai-error", status: aiRes.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments ?? "{}";

    let parsed: { candidates?: Array<{ videoId?: string; title?: string; channel?: string; url?: string }> } = {};
    try {
      parsed = typeof argsStr === "string" ? JSON.parse(argsStr) : argsStr;
    } catch {
      parsed = {};
    }

    const candidates = parsed.candidates ?? [];
    const tried: string[] = [];

    for (const cand of candidates) {
      const id = extractId(cand.videoId ?? "") ?? extractId(cand.url ?? "");
      if (!id || tried.includes(id)) continue;
      tried.push(id);
      const ok = await isEmbeddable(id);
      if (ok) {
        return new Response(
          JSON.stringify({
            found: true,
            videoId: id,
            title: cand.title ?? surgeryName,
            channel: cand.channel ?? "YouTube",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(
      JSON.stringify({ found: false, reason: "no-embeddable-candidate", tried }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("youtube-search error:", e);
    return new Response(
      JSON.stringify({ found: false, reason: "exception", error: String(e) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
