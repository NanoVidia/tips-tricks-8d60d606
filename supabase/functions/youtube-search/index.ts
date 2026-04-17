// Searches YouTube for a verified, embeddable surgical video using Perplexity,
// then validates the returned videoId via YouTube oEmbed before returning it.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TRUSTED = [
  "RCOG", "ACOG", "AAGL", "IRCAD", "Nucleus Medical Media",
  "Surgery 101", "ESGO", "IUGA", "Osmosis", "Armando Hasudungan",
  "Lecturio", "Geeky Medics", "JOGC", "AJOG",
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
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "PERPLEXITY_API_KEY not configured" }),
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

    const prompt = `Find ONE recent (last 5 years) educational YouTube video demonstrating the surgical procedure: "${surgeryName}".
Prefer videos from these trusted medical channels: ${TRUSTED.join(", ")}.
The video MUST be public, embeddable, and currently available.
Return ONLY a JSON object with these exact keys: videoId (the 11-character YouTube ID), title (video title), channel (channel name), url (full youtube.com URL).
If you cannot find a verified video, return: {"videoId": null}.`;

    const pplxRes = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "You are a precise medical-education research assistant. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        search_domain_filter: ["youtube.com"],
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "video_result",
            schema: {
              type: "object",
              properties: {
                videoId: { type: ["string", "null"] },
                title: { type: "string" },
                channel: { type: "string" },
                url: { type: "string" },
              },
              required: ["videoId"],
            },
          },
        },
      }),
    });

    if (!pplxRes.ok) {
      const text = await pplxRes.text();
      console.error(`Perplexity ${pplxRes.status}: ${text}`);
      // Fail soft so the client shows manual search fallback instead of an error screen
      return new Response(
        JSON.stringify({ found: false, reason: "search-unavailable", status: pplxRes.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pplxData = await pplxRes.json();
    const content = pplxData?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { videoId?: string | null; title?: string; channel?: string; url?: string } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    let id = parsed.videoId ? extractId(parsed.videoId) : null;
    if (!id && parsed.url) id = extractId(parsed.url);

    if (!id) {
      return new Response(
        JSON.stringify({ found: false }),
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
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
