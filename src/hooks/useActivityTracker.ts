import { useCallback, useEffect, useState } from "react";

/**
 * Lightweight activity tracker for the Adaptive Section Hub.
 * Persists last user touchpoints in localStorage so we can render
 * "Continue where you left off" + restore tab/search state.
 */
export type TabId = "qa" | "clinic" | "or_labor" | "behavior";

export interface ScenarioRef {
  id: string;
  title: string;
  category: TabId;
  /** epoch ms */
  at: number;
}

export interface ActivityState {
  lastSearch: string;
  lastScenario: ScenarioRef | null;
  lastTab: TabId | null;
  /** click counter per scenario id — used by "Most viewed" / Trending */
  views: Record<string, { count: number; title: string; category: TabId; at: number }>;
}

const KEY = "adaptive_hub_activity_v1";
const empty: ActivityState = { lastSearch: "", lastScenario: null, lastTab: null, views: {} };

function read(): ActivityState {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as Partial<ActivityState>;
    return {
      lastSearch: parsed.lastSearch ?? "",
      lastScenario: parsed.lastScenario ?? null,
      lastTab: parsed.lastTab ?? null,
      views: parsed.views ?? {},
    };
  } catch {
    return { ...empty };
  }
}

function write(s: ActivityState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function useActivityTracker() {
  const [state, setState] = useState<ActivityState>(() => read());

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setState(read()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLastSearch = useCallback((q: string) => {
    setState((prev) => {
      const next = { ...prev, lastSearch: q };
      write(next);
      return next;
    });
  }, []);

  const setLastTab = useCallback((tab: TabId | null) => {
    setState((prev) => {
      const next = { ...prev, lastTab: tab };
      write(next);
      return next;
    });
  }, []);

  const setLastScenario = useCallback((s: { id: string; title: string; category: TabId } | null) => {
    setState((prev) => {
      const ref: ScenarioRef | null = s ? { ...s, at: Date.now() } : null;
      const views = { ...prev.views };
      if (s) {
        const v = views[s.id];
        views[s.id] = {
          count: (v?.count ?? 0) + 1,
          title: s.title,
          category: s.category,
          at: Date.now(),
        };
      }
      const next: ActivityState = { ...prev, lastScenario: ref, views };
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write(empty);
    setState(empty);
  }, []);

  /** Return top-N most viewed scenarios, optionally filtered by tab. */
  const mostViewed = useCallback((limit = 5, tab?: TabId | null) => {
    const arr = Object.entries(state.views).map(([id, v]) => ({ id, ...v }));
    const filtered = tab ? arr.filter((x) => x.category === tab) : arr;
    return filtered
      .sort((a, b) => b.count - a.count || b.at - a.at)
      .slice(0, limit);
  }, [state.views]);

  return {
    state,
    setLastSearch,
    setLastTab,
    setLastScenario,
    clear,
    mostViewed,
  };
}
