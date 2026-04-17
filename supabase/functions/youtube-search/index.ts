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
Your task is to identify ONE high-quality, publicly available, embeddable YouTube video
that demonstrates a specific obstetric/gynecologic surgical procedure.

Rules:
- Only return videos you are highly confident actually exist on YouTube right now.
- Strongly prefer recognized educational/medical channels: ${TRUSTED.join(", ")}.
- The video must be educational (technique demonstration, narrated surgery, animation, or lecture).
- The 11-character YouTube videoId MUST be from a real public video, never invented.
- If you are not confident a real video exists, return videoId = null.`;

    const userPrompt = `Find ONE educational YouTube video for the surgical procedure: "${surgeryName}".`;

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
              name: "return_youtube_video",
              description:
                "Return a single verified YouTube video that demonstrates the requested surgical procedure.",
              parameters: {
                type: "object",
                properties: {
                  videoId: {
                    type: ["string", "null"],
                    description:
                      "The 11-character YouTube video ID, or null if no confident match exists.",
                  },
                  title: { type: "string", description: "Video title." },
                  channel: { type: "string", description: "YouTube channel name." },
                  url: { type: "string", description: "Full https://www.youtube.com/watch?v=... URL." },
                },
                required: ["videoId", "title", "channel", "url"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_youtube_video" } },
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

    let parsed: { videoId?: string | null; title?: string; channel?: string; url?: string } = {};
    try {
      parsed = typeof argsStr === "string" ? JSON.parse(argsStr) : argsStr;
    } catch {
      parsed = {};
    }

    let id = parsed.videoId ? extractId(parsed.videoId) : null;
    if (!id && parsed.url) id = extractId(parsed.url);

    if (!id) {
      return new Response(
        JSON.stringify({ found: false, reason: "no-match" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ok = await isEmbeddable(id);
    if (!ok) {
      return new Response(
        JSON.stringify({ found: false, reason: "not-embeddable", attemptedId: id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        found: true,
        videoId: id,
        title: parsed.title ?? surgeryName,
        channel: parsed.channel ?? "YouTube",
      }),
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
