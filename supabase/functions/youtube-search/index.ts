// Finds a verified, embeddable YouTube surgical video using the official
// YouTube Data API v3 (search.list + videos.list), filtered for embeddable +
// public + region-unrestricted videos, and prioritized by trusted medical channels.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TRUSTED_KEYWORDS = [
  "rcog", "acog", "aagl", "ircad", "nucleus medical",
  "surgery 101", "esgo", "iuga", "osmosis", "armando hasudungan",
  "lecturio", "geeky medics", "medscape", "nejm",
];

function trustScore(channelTitle: string): number {
  const t = (channelTitle || "").toLowerCase();
  return TRUSTED_KEYWORDS.some((k) => t.includes(k)) ? 1 : 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      return new Response(
        JSON.stringify({ found: false, reason: "missing-api-key" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { surgeryName } = await req.json();
    if (!surgeryName || typeof surgeryName !== "string") {
      return new Response(
        JSON.stringify({ error: "surgeryName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1) Search
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", `${surgeryName} surgical technique`);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("videoEmbeddable", "true");
    searchUrl.searchParams.set("videoSyndicated", "true");
    searchUrl.searchParams.set("safeSearch", "strict");
    searchUrl.searchParams.set("relevanceLanguage", "en");
    searchUrl.searchParams.set("maxResults", "15");
    searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      const text = await searchRes.text();
      console.error(`YouTube search ${searchRes.status}: ${text}`);
      return new Response(
        JSON.stringify({ found: false, reason: "search-error", status: searchRes.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const searchData = await searchRes.json();
    const items: Array<{ id: { videoId: string }; snippet: { title: string; channelTitle: string } }> =
      searchData.items ?? [];
    if (items.length === 0) {
      return new Response(
        JSON.stringify({ found: false, reason: "no-results" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ids = items.map((i) => i.id.videoId).filter(Boolean);

    // 2) Verify embeddability + status via videos.list
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "status,contentDetails,snippet");
    videosUrl.searchParams.set("id", ids.join(","));
    videosUrl.searchParams.set("key", YOUTUBE_API_KEY);

    const videosRes = await fetch(videosUrl);
    if (!videosRes.ok) {
      const text = await videosRes.text();
      console.error(`YouTube videos ${videosRes.status}: ${text}`);
      return new Response(
        JSON.stringify({ found: false, reason: "videos-error", status: videosRes.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const videosData = await videosRes.json();
    const valid = (videosData.items ?? []).filter((v: any) =>
      v?.status?.embeddable === true &&
      v?.status?.privacyStatus === "public" &&
      !v?.contentDetails?.regionRestriction?.blocked?.length,
    );

    if (valid.length === 0) {
      return new Response(
        JSON.stringify({ found: false, reason: "no-embeddable" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Rank: trusted channel first, then original search order
    const indexById = new Map(ids.map((id, i) => [id, i]));
    valid.sort((a: any, b: any) => {
      const ts = trustScore(b.snippet.channelTitle) - trustScore(a.snippet.channelTitle);
      if (ts !== 0) return ts;
      return (indexById.get(a.id) ?? 999) - (indexById.get(b.id) ?? 999);
    });

    const best = valid[0];
    return new Response(
      JSON.stringify({
        found: true,
        videoId: best.id,
        title: best.snippet.title,
        channel: best.snippet.channelTitle,
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
