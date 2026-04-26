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

const WEAK_TERMS = ["patient", "patient guide", "patient education", "instructions", "explained", "what happens", "animation", "shorts", "#shorts", "can i get pregnant", "minute", "overview", "pov", "nclex", "nursing", "without surgery"];
const WRONG_SPECIALTY_TERMS = ["deviated septum", "nasal", "sinus", "ent", "dental", "orthopedic", "knee", "hip", "appendix", "appendectomy", "gallbladder", "hernia"];
const TECHNIQUE_TERMS = ["surgical", "surgery", "procedure", "technique", "operative", "operation", "laparoscopic", "hysteroscopic", "vaginal", "repair", "demonstration", "step", "steps", "osce"];
const MIN_ACCEPT_SCORE = 68;

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

function relevanceReview(surgeryName: string, title: string, channelTitle: string): { score: number; reason: string } {
  const titleText = normalize(title);
  const channelText = normalize(channelTitle);
  const combinedText = `${titleText} ${channelText}`;
  const tokens = meaningfulTokens(surgeryName);
  const hits = tokens.filter((token) => titleText.includes(token) || channelText.includes(token)).length;
  const groups = topicGroups(surgeryName);
  const groupHits = groups.filter((group) => group.some((term) => combinedText.includes(normalize(term)))).length;
  const weakHit = WEAK_TERMS.find((term) => titleText.includes(term) || channelText.includes(term));
  const wrongHit = WRONG_SPECIALTY_TERMS.find((term) => titleText.includes(term) || channelText.includes(term));
  const hasTechnique = TECHNIQUE_TERMS.some((term) => titleText.includes(term));

  if (wrongHit) return { score: 0, reason: `Wrong specialty signal: ${wrongHit}` };
  if (groups.length > 0 && groupHits === 0) return { score: 25, reason: "Procedure keywords were not matched" };

  let score = tokens.length ? Math.round((hits / tokens.length) * 45) : 0;

  score += Math.min(35, groupHits * 18);

  if (trustScore(channelText)) score += 20;
  if (hasTechnique) score += 12;
  if (weakHit) score -= hasTechnique ? 28 : 45;

  const finalScore = Math.max(0, Math.min(100, score));
  const reason = weakHit
    ? `Weak educational signal: ${weakHit}`
    : finalScore >= MIN_ACCEPT_SCORE
      ? "Procedure and technique terms matched"
      : "Low procedure-specific relevance";
  return { score: finalScore, reason };
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

    // 1) Search with multiple precise professional queries, then dedupe candidates.
    const queries = [
      `${surgeryName} surgical technique obstetrics gynecology`,
      `${surgeryName} operative video gynecology`,
      `${surgeryName} procedure demonstration OB GYN`,
      `${surgeryName} surgery steps`,
    ];
    const byId = new Map<string, { id: { videoId: string }; snippet: { title: string; channelTitle: string }; order: number }>();

    for (const [queryIndex, query] of queries.entries()) {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("videoEmbeddable", "true");
      searchUrl.searchParams.set("videoSyndicated", "true");
      searchUrl.searchParams.set("safeSearch", "strict");
      searchUrl.searchParams.set("relevanceLanguage", "en");
      searchUrl.searchParams.set("maxResults", "12");
      searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) {
        const text = await searchRes.text();
        console.error(`YouTube search ${searchRes.status}: ${text}`);
        continue;
      }

      const searchData = await searchRes.json();
      for (const [itemIndex, item] of ((searchData.items ?? []) as Array<{ id: { videoId: string }; snippet: { title: string; channelTitle: string } }>).entries()) {
        if (item?.id?.videoId && !byId.has(item.id.videoId)) byId.set(item.id.videoId, { ...item, order: queryIndex * 100 + itemIndex });
      }
    }

    const items = [...byId.values()];
    if (items.length === 0) {
      return new Response(
        JSON.stringify({ found: false, reason: "no-results" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ids = items.map((i) => i.id.videoId).filter(Boolean).slice(0, 50);

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

    // Rank: professional topic relevance first, trusted channel second, then original search order.
    const indexById = new Map(items.map((item) => [item.id.videoId, item.order]));
    valid.sort((a: any, b: any) => {
      const rs = relevanceReview(surgeryName, b.snippet.title, b.snippet.channelTitle).score - relevanceReview(surgeryName, a.snippet.title, a.snippet.channelTitle).score;
      if (rs !== 0) return rs;
      const ts = trustScore(b.snippet.channelTitle) - trustScore(a.snippet.channelTitle);
      if (ts !== 0) return ts;
      return (indexById.get(a.id) ?? 999) - (indexById.get(b.id) ?? 999);
    });

    const best = valid[0];
    const bestReview = relevanceReview(surgeryName, best.snippet.title, best.snippet.channelTitle);
    const currentReview = currentVideo?.title ? relevanceReview(surgeryName, currentVideo.title, currentVideo.channel || "") : { score: 0, reason: "No current video" };
    const selected = currentVideo?.videoId && currentReview.score >= bestReview.score && currentReview.score >= MIN_ACCEPT_SCORE
      ? { id: currentVideo.videoId, snippet: { title: currentVideo.title, channelTitle: currentVideo.channel || "" }, review: currentReview }
      : { ...best, review: bestReview };

    if (selected.review.score < MIN_ACCEPT_SCORE) {
      return new Response(
        JSON.stringify({ found: false, reason: "low-relevance", score: selected.review.score, detail: selected.review.reason }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        found: true,
        videoId: selected.id,
        title: selected.snippet.title,
        channel: selected.snippet.channelTitle,
        score: selected.review.score,
        reason: selected.review.reason,
        confidence: selected.review.score >= 82 ? "high" : selected.review.score >= MIN_ACCEPT_SCORE ? "medium" : "low",
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
