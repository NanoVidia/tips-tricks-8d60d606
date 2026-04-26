// Finds a verified, embeddable YouTube surgical video using the official
// YouTube Data API v3 (search.list + videos.list), filtered for embeddable +
// public + region-unrestricted videos, and prioritized by trusted medical channels.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TRUSTED_KEYWORDS = [
  "rcog", "acog", "aagl", "ircad", "nucleus medical", "surgery 101", "esgo", "iuga", "osmosis",
  "armando hasudungan", "lecturio", "geeky medics", "medscape", "nejm", "mayo clinic", "stanford",
  "ubc", "green journal", "tvasurg", "augs", "figo", "society of gynecologic oncology",
];

const WEAK_TERMS = ["patient guide", "patient education", "instructions", "explained", "what happens", "animation", "shorts", "#shorts", "can i get pregnant", "minute"];
const WRONG_SPECIALTY_TERMS = ["deviated septum", "nasal", "sinus", "ent", "dental", "orthopedic", "knee", "hip", "appendix", "appendectomy", "gallbladder", "hernia"];
const TECHNIQUE_TERMS = ["surgical", "surgery", "procedure", "technique", "operative", "operation", "laparoscopic", "hysteroscopic", "vaginal", "repair", "demonstration", "step", "steps", "osce"];

function normalize(value: string): string {
  return (value || "").toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

function meaningfulTokens(value: string): string[] {
  const stop = new Set(["the", "and", "for", "with", "low", "mid", "open", "total", "partial", "section", "assisted"]);
  return normalize(value).split(" ").filter((token) => token.length > 2 && !stop.has(token));
}

function topicGroups(surgeryName: string): string[][] {
  const name = normalize(surgeryName);
  const groups: string[][] = [];
  if (/cesarean|caesarean|c section|lscs/.test(name)) groups.push(["cesarean", "caesarean", "c section", "lscs"]);
  if (/hysterect/.test(name)) groups.push(["hysterectomy", "hysterectomies"]);
  if (/myomect|fibroid/.test(name)) groups.push(["myomectomy", "fibroid", "myoma"]);
  if (/hysteroscop/.test(name)) groups.push(["hysteroscopy", "hysteroscopic"]);
  if (/polyp/.test(name)) groups.push(["polypectomy", "polyp"]);
  if (/ablation/.test(name)) groups.push(["ablation", "endometrial ablation"]);
  if (/adhesiolysis|asherman/.test(name)) groups.push(["adhesiolysis", "asherman", "intrauterine adhesions"]);
  if (/septum|septoplasty/.test(name)) groups.push(["uterine septum", "septum resection", "hysteroscopic septum"]);
  if (/vacuum|ventouse/.test(name)) groups.push(["vacuum", "ventouse", "operative vaginal"]);
  if (/forceps/.test(name)) groups.push(["forceps", "operative vaginal"]);
  if (/placenta/.test(name)) groups.push(["placenta", "retained placenta", "manual removal"]);
  if (/perineal|tear/.test(name)) groups.push(["perineal", "perineal repair", "tear repair"]);
  if (/cerclage|shirodkar|mcdonald/.test(name)) groups.push(["cerclage", "mcdonald", "shirodkar"]);
  if (/external cephalic|ecv/.test(name)) groups.push(["external cephalic", "ecv", "version"]);
  if (/lynch/.test(name)) groups.push(["b lynch", "compression suture"]);
  if (/bakri|balloon/.test(name)) groups.push(["bakri", "uterine balloon", "postpartum hemorrhage"]);
  if (/cystectomy|ovarian cyst/.test(name)) groups.push(["ovarian cystectomy", "cystectomy", "ovarian cyst"]);
  if (/salping/.test(name)) groups.push(["salpingectomy", "salpingostomy", "fallopian tube"]);
  if (/laparoscopy|laparoscopic/.test(name)) groups.push(["laparoscopy", "laparoscopic"]);
  if (/endometri/.test(name)) groups.push(["endometriosis", "endometrioma"]);
  if (/sling|incontinence|tvt|tot/.test(name)) groups.push(["sling", "incontinence", "tvt", "tot", "mid urethral"]);
  if (/sacrocolpopexy/.test(name)) groups.push(["sacrocolpopexy", "prolapse"]);
  if (/colporrhaphy|cystocele|cystocoele/.test(name)) groups.push(["colporrhaphy", "cystocele", "cystocoele"]);
  if (/sacrospinous/.test(name)) groups.push(["sacrospinous", "ligament fixation"]);
  if (/colpocleisis/.test(name)) groups.push(["colpocleisis"]);
  if (/lymph/.test(name)) groups.push(["lymph node", "lymphadenectomy", "lymph node dissection"]);
  if (/leep|cone|conization|biopsy/.test(name)) groups.push(["leep", "cone biopsy", "conization", "lletz"]);
  return groups;
}

function trustScore(channelTitle: string): number {
  const t = (channelTitle || "").toLowerCase();
  return TRUSTED_KEYWORDS.some((k) => t.includes(k)) ? 1 : 0;
}

function relevanceScore(surgeryName: string, title: string, channelTitle: string): number {
  const titleText = normalize(title);
  const channelText = normalize(channelTitle);
  const combinedText = `${titleText} ${channelText}`;
  const tokens = meaningfulTokens(surgeryName);
  const hits = tokens.filter((token) => titleText.includes(token) || channelText.includes(token)).length;
  const groups = topicGroups(surgeryName);
  const groupHits = groups.filter((group) => group.some((term) => combinedText.includes(normalize(term)))).length;
  let score = tokens.length ? Math.round((hits / tokens.length) * 45) : 0;

  score += Math.min(35, groupHits * 18);

  if (trustScore(channelText)) score += 20;
  if (TECHNIQUE_TERMS.some((term) => titleText.includes(term))) score += 12;
  if (WEAK_TERMS.some((term) => titleText.includes(term)) && !TECHNIQUE_TERMS.some((term) => titleText.includes(term))) score -= 35;
  if (WRONG_SPECIALTY_TERMS.some((term) => titleText.includes(term) || channelText.includes(term))) score -= 75;
  if (groups.length > 0 && groupHits === 0) score = Math.min(score, 35);
  return Math.max(0, Math.min(100, score));
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

    const { surgeryName, currentVideo } = await req.json();
    if (!surgeryName || typeof surgeryName !== "string") {
      return new Response(
        JSON.stringify({ error: "surgeryName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1) Search
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", `${surgeryName} surgical technique obstetrics gynecology`);
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

    // Rank: professional topic relevance first, trusted channel second, then original search order
    const indexById = new Map(ids.map((id, i) => [id, i]));
    valid.sort((a: any, b: any) => {
      const rs = relevanceScore(surgeryName, b.snippet.title, b.snippet.channelTitle) - relevanceScore(surgeryName, a.snippet.title, a.snippet.channelTitle);
      if (rs !== 0) return rs;
      const ts = trustScore(b.snippet.channelTitle) - trustScore(a.snippet.channelTitle);
      if (ts !== 0) return ts;
      return (indexById.get(a.id) ?? 999) - (indexById.get(b.id) ?? 999);
    });

    const best = valid[0];
    const bestScore = relevanceScore(surgeryName, best.snippet.title, best.snippet.channelTitle);
    const currentScore = currentVideo?.title ? relevanceScore(surgeryName, currentVideo.title, currentVideo.channel || "") : 0;
    const selected = currentVideo?.videoId && currentScore >= bestScore && currentScore >= 45
      ? { id: currentVideo.videoId, snippet: { title: currentVideo.title, channelTitle: currentVideo.channel || "" }, score: currentScore }
      : { ...best, score: bestScore };

    return new Response(
      JSON.stringify({
        found: true,
        videoId: selected.id,
        title: selected.snippet.title,
        channel: selected.snippet.channelTitle,
        score: selected.score,
        confidence: selected.score >= 70 ? "high" : selected.score >= 45 ? "medium" : "low",
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
