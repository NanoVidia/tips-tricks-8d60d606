import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tools.bookmarks.v1";

type Listener = (ids: string[]) => void;
const listeners = new Set<Listener>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(ids: string[]) {
  cache = ids;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota / private mode — ignore */
  }
  listeners.forEach((l) => l(ids));
}

/**
 * Shared bookmarks store backed by localStorage.
 * All instances stay in sync via in-memory pub/sub + cross-tab `storage` events.
 */
export function useBookmarks() {
  const [ids, setIds] = useState<string[]>(() => read());

  useEffect(() => {
    const onChange: Listener = (next) => setIds(next);
    listeners.add(onChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const next = e.newValue ? (JSON.parse(e.newValue) as string[]) : [];
        cache = next;
        setIds(next);
      } catch {
        /* ignore malformed payloads */
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isBookmarked = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    write(next);
  }, []);

  const clear = useCallback(() => write([]), []);

  return { ids, isBookmarked, toggle, clear };
}
