// Background data-sync orchestrator.
// - Refetches when the tab regains focus (already on, but we add an interval too).
// - Periodic light refresh every 10 minutes while the tab is visible.
// - Exposes a manual `refresh()` for a pull-to-refresh button.

import { useCallback, useEffect, useState } from "react";
import { refreshAllData } from "@/lib/queryClient";

const PERIODIC_MS = 10 * 60_000;

export function useDataSync() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<number>(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem("tt-last-sync") : null;
    return v ? Number(v) : Date.now();
  });

  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshAllData();
      const ts = Date.now();
      setLastSync(ts);
      try { localStorage.setItem("tt-last-sync", String(ts)); } catch { /* ignore */ }
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    // Periodic background refresh while page is visible.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, PERIODIC_MS);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return { refresh, refreshing, lastSync };
}
