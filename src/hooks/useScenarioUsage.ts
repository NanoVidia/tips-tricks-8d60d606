import { useCallback, useEffect, useState } from "react";

/**
 * Tracks per-category scenario usage (last opened + click counts) in localStorage.
 * Enables "Continue where you left off" + "Trending" sections in the Adaptive Hub.
 */
export type ScenarioCategory = "clinic" | "or_labor" | "behavior" | "qa";

interface UsageEntry {
  id: string;
  title: string;
  count: number;
  lastAt: number; // epoch ms
}

type UsageMap = Record<ScenarioCategory, UsageEntry[]>;

const KEY = "scenario_usage_v1";
const MAX_PER_CAT = 30;

const empty: UsageMap = { clinic: [], or_labor: [], behavior: [], qa: [] };

function read(): UsageMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as Partial<UsageMap>;
    return {
      clinic: parsed.clinic ?? [],
      or_labor: parsed.or_labor ?? [],
      behavior: parsed.behavior ?? [],
      qa: parsed.qa ?? [],
    };
  } catch {
    return { ...empty };
  }
}

function write(map: UsageMap) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

export function useScenarioUsage() {
  const [map, setMap] = useState<UsageMap>(() => (typeof window === "undefined" ? empty : read()));

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setMap(read()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const track = useCallback((cat: ScenarioCategory, id: string, title: string) => {
    setMap((prev) => {
      const list = [...(prev[cat] ?? [])];
      const idx = list.findIndex((e) => e.id === id);
      const now = Date.now();
      if (idx >= 0) {
        list[idx] = { ...list[idx], title, count: list[idx].count + 1, lastAt: now };
      } else {
        list.unshift({ id, title, count: 1, lastAt: now });
      }
      const trimmed = list.slice(0, MAX_PER_CAT);
      const next = { ...prev, [cat]: trimmed };
      write(next);
      return next;
    });
  }, []);

  const lastOpened = useCallback((cat: ScenarioCategory): UsageEntry | null => {
    const list = map[cat] ?? [];
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.lastAt - a.lastAt)[0] ?? null;
  }, [map]);

  const trending = useCallback((cat: ScenarioCategory, limit = 4): UsageEntry[] => {
    const list = map[cat] ?? [];
    return [...list].sort((a, b) => b.count - a.count || b.lastAt - a.lastAt).slice(0, limit);
  }, [map]);

  return { track, lastOpened, trending };
}
