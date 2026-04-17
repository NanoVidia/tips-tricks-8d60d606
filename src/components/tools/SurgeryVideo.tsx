import { useEffect, useState } from "react";
import { Play, Search, ExternalLink, AlertCircle } from "lucide-react";

interface Props {
  videoId: string;
  title: string;
  channel: string;
  surgeryName: string;
}

type Status = "checking" | "available" | "unavailable";

// Trusted OB/GYN surgical channels (used to bias search fallback)
const TRUSTED_CHANNELS = ["RCOG", "ACOG", "AAGL", "IUGA", "ESGO", "Surgery 101", "Nucleus Medical"];

/**
 * Verifies a YouTube video is embeddable via the public oEmbed endpoint.
 * If the video is private/deleted/blocked, oEmbed returns 401/404 → we fall back to a search panel.
 * No API key required.
 */
async function checkVideo(id: string): Promise<boolean> {
  if (!id || id.length < 6) return false;
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
      { method: "GET" },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export function SurgeryVideo({ videoId, title, channel, surgeryName }: Props) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let alive = true;
    setStatus("checking");
    checkVideo(videoId).then((ok) => {
      if (alive) setStatus(ok ? "available" : "unavailable");
    });
    return () => {
      alive = false;
    };
  }, [videoId]);

  const searchUrl = (q: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-bold flex items-center gap-1.5">
        <Play className="w-3.5 h-3.5 text-primary" /> Video
      </h4>

      <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
        {status === "checking" && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Checking video availability…
          </div>
        )}

        {status === "available" && (
          <iframe
            key={videoId}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full"
          />
        )}

        {status === "unavailable" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center bg-gradient-to-br from-muted to-muted/50">
            <AlertCircle className="w-7 h-7 text-muted-foreground" />
            <p className="text-xs text-muted-foreground max-w-xs">
              Embedded preview unavailable. Open a verified video on YouTube:
            </p>
            <div className="flex flex-col gap-1.5 w-full max-w-[240px]">
              <a
                href={searchUrl(`${surgeryName} surgical technique`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                <Search className="w-3 h-3" />
                Search YouTube
              </a>
              <a
                href={searchUrl(`${surgeryName} ${TRUSTED_CHANNELS.join(" OR ")}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted/60 transition"
              >
                <Search className="w-3 h-3" />
                Trusted channels (RCOG / ACOG / AAGL…)
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[10px] text-muted-foreground">
          {title} — {channel}
        </p>
        {status === "available" && (
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] flex items-center gap-1 text-primary hover:underline"
          >
            Open on YouTube <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}
