import { useEffect, useMemo, useState } from "react";
import { Play, ExternalLink, ShieldCheck, Search } from "lucide-react";
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
};

const TRUSTED_CHANNEL_TERMS = ["rcog", "acog", "aagl", "iuga", "nejm", "mayo", "stanford", "ubc", "green journal", "tvasurg", "ircad"];
const WEAK_VIDEO_TERMS = ["patient guide", "instructions", "explained", "what happens", "shorts", "#shorts", "can i get pregnant"];
const WRONG_SPECIALTY_TERMS = ["deviated septum", "ent", "dental", "orthopedic", "knee", "appendix"];

const normalize = (value: string) => value.toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
const meaningfulTokens = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !["the", "and", "for", "with", "low", "mid", "open", "total", "partial"].includes(token));

function localRelevanceScore(surgeryName: string, title: string, channel: string) {
  const titleText = normalize(title);
  const channelText = normalize(channel);
  const procedureTokens = meaningfulTokens(surgeryName);
  const hits = procedureTokens.filter((token) => titleText.includes(token)).length;
  let score = procedureTokens.length ? Math.round((hits / procedureTokens.length) * 70) : 0;

  if (TRUSTED_CHANNEL_TERMS.some((term) => channelText.includes(term))) score += 20;
  if (titleText.includes("surgical") || titleText.includes("procedure") || titleText.includes("technique") || titleText.includes("operative")) score += 10;
  if (WEAK_VIDEO_TERMS.some((term) => titleText.includes(term))) score -= 25;
  if (WRONG_SPECIALTY_TERMS.some((term) => titleText.includes(term))) score -= 45;

  return Math.max(0, Math.min(100, score));
}

export function SurgeryVideo({ videoId, title, channel, surgeryName }: Props) {
  const initialScore = useMemo(() => localRelevanceScore(surgeryName, title, channel), [surgeryName, title, channel]);
  const [verified, setVerified] = useState<VideoCandidate | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);

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
        });
      }
    }).finally(() => {
      if (!cancelled) setChecking(false);
    });

    return () => { cancelled = true; };
  }, [surgeryName, videoId, title, channel]);

  const display = verified ?? { videoId, title, channel, score: initialScore, confidence: initialScore >= 70 ? "high" : initialScore >= 45 ? "medium" : "low" };
  const confidenceLabel = display.confidence === "high" ? "Highly relevant" : display.confidence === "medium" ? "Moderately relevant" : "Needs review";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold flex items-center gap-1.5">
          <Play className="w-3.5 h-3.5 text-primary" /> Video
        </h4>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
          {checking ? <Search className="h-3 w-3 animate-pulse" /> : <ShieldCheck className="h-3 w-3 text-primary" />}
          {checking ? "Reviewing" : confidenceLabel}
        </span>
      </div>

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

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[10px] text-muted-foreground">
          {display.title} — {display.channel}
        </p>
        <a
          href={`https://www.youtube.com/watch?v=${display.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] flex items-center gap-1 text-primary hover:underline"
        >
          Open on YouTube <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
}
