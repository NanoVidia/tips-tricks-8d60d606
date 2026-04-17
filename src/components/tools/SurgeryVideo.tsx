import { useEffect, useState } from "react";
import { Play, Search, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  videoId: string;
  title: string;
  channel: string;
  surgeryName: string;
}

type Status = "checking" | "available" | "searching" | "unavailable";

const TRUSTED_CHANNELS = ["RCOG", "ACOG", "AAGL", "IUGA", "ESGO", "Surgery 101", "Nucleus Medical"];
const CACHE_PREFIX = "yt-fallback:";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type CacheEntry = { videoId: string; title: string; channel: string; ts: number } | { found: false; ts: number };

function readCache(key: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writeCache(key: string, entry: CacheEntry) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* ignore quota errors */
  }
}

async function checkVideo(id: string): Promise<boolean> {
  if (!id || id.length < 6) return false;
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
    );
    return res.ok;
  } catch {
    return false;
  }
}

export function SurgeryVideo({ videoId, title, channel, surgeryName }: Props) {
  const [status, setStatus] = useState<Status>("checking");
  const [activeId, setActiveId] = useState(videoId);
  const [activeTitle, setActiveTitle] = useState(title);
  const [activeChannel, setActiveChannel] = useState(channel);

  useEffect(() => {
    let alive = true;
    setStatus("checking");
    setActiveId(videoId);
    setActiveTitle(title);
    setActiveChannel(channel);

    (async () => {
      // Layer 1: try original videoId
      const ok = await checkVideo(videoId);
      if (!alive) return;
      if (ok) {
        setStatus("available");
        return;
      }

      // Layer 2: cache lookup
      const cached = readCache(surgeryName);
      if (cached) {
        if ("found" in cached) {
          setStatus("unavailable");
          return;
        }
        const stillOk = await checkVideo(cached.videoId);
        if (!alive) return;
        if (stillOk) {
          setActiveId(cached.videoId);
          setActiveTitle(cached.title);
          setActiveChannel(cached.channel);
          setStatus("available");
          return;
        }
      }

      // Layer 3: ask Perplexity-backed edge function
      setStatus("searching");
      try {
        const { data, error } = await supabase.functions.invoke("youtube-search", {
          body: { surgeryName },
        });
        if (!alive) return;
        if (error || !data?.found) {
          writeCache(surgeryName, { found: false, ts: Date.now() });
          setStatus("unavailable");
          return;
        }
        writeCache(surgeryName, {
          videoId: data.videoId,
          title: data.title,
          channel: data.channel,
          ts: Date.now(),
        });
        setActiveId(data.videoId);
        setActiveTitle(data.title);
        setActiveChannel(data.channel);
        setStatus("available");
      } catch {
        if (!alive) return;
        setStatus("unavailable");
      }
    })();

    return () => {
      alive = false;
    };
  }, [videoId, title, channel, surgeryName]);

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

        {status === "searching" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            Finding a verified replacement video…
          </div>
        )}

        {status === "available" && (
          <iframe
            key={activeId}
            src={`https://www.youtube-nocookie.com/embed/${activeId}?rel=0&modestbranding=1`}
            title={activeTitle}
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
              No verified embeddable video found. Search YouTube directly:
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
          {activeTitle} — {activeChannel}
        </p>
        {status === "available" && (
          <a
            href={`https://www.youtube.com/watch?v=${activeId}`}
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
