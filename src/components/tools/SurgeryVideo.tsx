import { useEffect, useMemo, useState } from "react";
import { Play, ExternalLink, ShieldCheck, Search, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  videoId: string;
  title: string;
  channel: string;
  surgeryName: string;
}

type VideoCandidate = {
  videoId: string;
  title: string;
  channel: string;
  confidence?: "high" | "medium" | "low";
  score?: number;
  reason?: string;
};

const TRUSTED_CHANNEL_TERMS = ["rcog", "acog", "aagl", "iuga", "nejm", "mayo", "stanford", "ubc", "green journal", "tvasurg", "ircad"];
const WEAK_VIDEO_TERMS = ["patient", "patient guide", "patient education", "instructions", "explained", "what happens", "animation", "shorts", "#shorts", "can i get pregnant", "minute", "overview", "pov", "nclex", "nursing", "without surgery"];
const WRONG_SPECIALTY_TERMS = ["deviated septum", "nasal", "sinus", "ent", "dental", "orthopedic", "knee", "hip", "appendix", "appendectomy", "gallbladder", "hernia"];
const TECHNIQUE_TERMS = ["surgical", "surgery", "procedure", "technique", "operative", "operation", "laparoscopic", "hysteroscopic", "vaginal", "repair", "demonstration", "step", "steps", "osce"];
const MIN_RELEVANCE_SCORE = 68;

const normalize = (value: string) => value.toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
const meaningfulTokens = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !["the", "and", "for", "with", "low", "mid", "open", "total", "partial", "section", "assisted"].includes(token));

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

function localRelevance(surgeryName: string, title: string, channel: string): { score: number; reason: string } {
  const titleText = normalize(title);
  const channelText = normalize(channel);
  const combinedText = `${titleText} ${channelText}`;
  const procedureTokens = meaningfulTokens(surgeryName);
  const hits = procedureTokens.filter((token) => titleText.includes(token) || channelText.includes(token)).length;
  const groups = topicGroups(surgeryName);
  const groupHits = groups.filter((group) => group.some((term) => combinedText.includes(normalize(term)))).length;
  const weakHit = WEAK_VIDEO_TERMS.find((term) => titleText.includes(term) || channelText.includes(term));
  const wrongHit = WRONG_SPECIALTY_TERMS.find((term) => titleText.includes(term) || channelText.includes(term));
  const hasTechnique = TECHNIQUE_TERMS.some((term) => titleText.includes(term));

  if (wrongHit) return { score: 0, reason: `Wrong specialty signal: ${wrongHit}` };
  if (groups.length > 0 && groupHits === 0) return { score: 25, reason: "Procedure keywords were not matched" };

  let score = procedureTokens.length ? Math.round((hits / procedureTokens.length) * 45) : 0;

  score += Math.min(35, groupHits * 18);

  if (TRUSTED_CHANNEL_TERMS.some((term) => channelText.includes(term))) score += 20;
  if (hasTechnique) score += 12;
  if (weakHit) score -= hasTechnique ? 28 : 45;

  const finalScore = Math.max(0, Math.min(100, score));
  const reason = weakHit
    ? `Weak educational signal: ${weakHit}`
    : finalScore >= MIN_RELEVANCE_SCORE
      ? "Procedure and technique terms matched"
      : "Low procedure-specific relevance";
  return { score: finalScore, reason };
}

export function SurgeryVideo({ videoId, title, channel, surgeryName }: Props) {
  const initialReview = useMemo(() => localRelevance(surgeryName, title, channel), [surgeryName, title, channel]);
  const [verified, setVerified] = useState<VideoCandidate | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    setVerified(null);

    supabase.functions.invoke("youtube-search", {
      body: { surgeryName, currentVideo: { videoId, title, channel } },
    }).then(({ data }) => {
      if (cancelled) return;
      if (data?.found && data.videoId) {
        setVerified({
          videoId: data.videoId,
          title: data.title,
          channel: data.channel,
          confidence: data.confidence,
          score: data.score,
          reason: data.reason,
        });
      }
    }).finally(() => {
      if (!cancelled) setChecking(false);
    });

    return () => { cancelled = true; };
  }, [surgeryName, videoId, title, channel]);

  const display = verified ?? { videoId, title, channel, score: initialReview.score, reason: initialReview.reason, confidence: initialReview.score >= 82 ? "high" : initialReview.score >= MIN_RELEVANCE_SCORE ? "medium" : "low" };
  const isVerifiedEnough = (display.score ?? 0) >= MIN_RELEVANCE_SCORE;
  const confidenceLabel = checking
    ? "Reviewing"
    : !isVerifiedEnough
      ? "No verified match"
      : display.confidence === "high"
        ? "Verified match"
        : "Good match";
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${surgeryName} surgical technique obstetrics gynecology`)}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold flex items-center gap-1.5">
          <Play className="w-3.5 h-3.5 text-primary" /> Video
        </h4>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
          {checking ? <Search className="h-3 w-3 animate-pulse" /> : isVerifiedEnough ? <ShieldCheck className="h-3 w-3 text-primary" /> : <AlertTriangle className="h-3 w-3" />}
          {confidenceLabel}
        </span>
      </div>

      {isVerifiedEnough ? (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <iframe
            key={display.videoId}
            src={`https://www.youtube-nocookie.com/embed/${display.videoId}?rel=0&modestbranding=1`}
            title={display.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
          No trusted educational video directly matched this procedure, so an unverified video was not embedded.
          {display.reason && <span className="mt-1 block text-[10px]">Reason: {display.reason}</span>}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        {isVerifiedEnough && (
          <p className="text-[10px] text-muted-foreground">
            {display.title} — {display.channel}
          </p>
        )}
        <a
          href={isVerifiedEnough ? `https://www.youtube.com/watch?v=${display.videoId}` : youtubeSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] flex items-center gap-1 text-primary hover:underline"
        >
          {isVerifiedEnough ? "Open on YouTube" : "Search YouTube manually"} <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
}
