import { Play, ExternalLink } from "lucide-react";

interface Props {
  videoId: string;
  title: string;
  channel: string;
  surgeryName: string;
}

export function SurgeryVideo({ videoId, title, channel }: Props) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-bold flex items-center gap-1.5">
        <Play className="w-3.5 h-3.5 text-primary" /> Video
      </h4>

      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
        <iframe
          key={videoId}
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full"
        />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[10px] text-muted-foreground">
          {title} — {channel}
        </p>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
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
