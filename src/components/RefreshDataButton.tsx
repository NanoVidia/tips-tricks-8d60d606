import { RefreshCw, Check } from "lucide-react";
import { useState } from "react";
import { useDataSync } from "@/hooks/useDataSync";

/** Small inline refresh button — pulls latest data from the server and clears stale cache. */
export function RefreshDataButton() {
  const { refresh, refreshing, lastSync } = useDataSync();
  const [done, setDone] = useState(false);

  const handle = async () => {
    await refresh();
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };

  const ago = formatAgo(lastSync);

  return (
    <button
      type="button"
      onClick={handle}
      disabled={refreshing}
      aria-label="Refresh data"
      className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-gold transition-colors disabled:opacity-60"
    >
      {done ? (
        <Check className="w-3 h-3 text-emerald-500" />
      ) : (
        <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
      )}
      <span className="tracking-wider uppercase">
        {refreshing ? "Syncing…" : done ? "Up to date" : `Refresh · ${ago}`}
      </span>
    </button>
  );
}

function formatAgo(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}
