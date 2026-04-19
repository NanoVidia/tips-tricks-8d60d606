import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ai.savedChats.v1";

export interface SavedChat {
  id: string;
  scenarioTitle: string;
  question: string;
  answer: string;
  savedAt: number;
}

type Listener = (chats: SavedChat[]) => void;
const listeners = new Set<Listener>();
let cache: SavedChat[] | null = null;

function read(): SavedChat[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as SavedChat[]) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(chats: SavedChat[]) {
  cache = chats;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(chats));
}

/**
 * Persistent store for saved AI chat exchanges (Q + A pairs).
 * Synced across hook instances and browser tabs.
 */
export function useSavedChats() {
  const [chats, setChats] = useState<SavedChat[]>(() => read());

  useEffect(() => {
    const onChange: Listener = (next) => setChats(next);
    listeners.add(onChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const next = e.newValue ? (JSON.parse(e.newValue) as SavedChat[]) : [];
        cache = next;
        setChats(next);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const save = useCallback((chat: Omit<SavedChat, "id" | "savedAt">) => {
    const current = read();
    const entry: SavedChat = {
      ...chat,
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      savedAt: Date.now(),
    };
    write([entry, ...current]);
    return entry;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((c) => c.id !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { chats, save, remove, clear };
}
