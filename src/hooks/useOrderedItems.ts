import { useEffect, useMemo, useState, useCallback } from "react";

/**
 * Returns items sorted by a user-defined order persisted in localStorage.
 * Unknown ids (newly added items) keep their original position appended.
 * Removed ids are pruned silently.
 */
export function useOrderedItems<T>(
  storageKey: string,
  items: T[],
  getId: (item: T) => string,
): { ordered: T[]; setOrder: (ids: string[]) => void; reset: () => void } {
  const [order, setOrderState] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  });

  const ordered = useMemo(() => {
    const map = new Map(items.map((it) => [getId(it), it]));
    const result: T[] = [];
    const seen = new Set<string>();
    for (const id of order) {
      const it = map.get(id);
      if (it && !seen.has(id)) {
        result.push(it);
        seen.add(id);
      }
    }
    for (const it of items) {
      const id = getId(it);
      if (!seen.has(id)) {
        result.push(it);
        seen.add(id);
      }
    }
    return result;
  }, [items, order, getId]);

  const setOrder = useCallback(
    (ids: string[]) => {
      setOrderState(ids);
      try {
        localStorage.setItem(storageKey, JSON.stringify(ids));
      } catch {
        /* quota / private mode */
      }
    },
    [storageKey],
  );

  const reset = useCallback(() => {
    setOrderState([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // Self-heal: if persisted order references no current ids, drop it.
  useEffect(() => {
    if (order.length === 0) return;
    const known = new Set(items.map(getId));
    const stillValid = order.filter((id) => known.has(id));
    if (stillValid.length !== order.length) setOrder(stillValid);
  }, [items, order, getId, setOrder]);

  return { ordered, setOrder, reset };
}
