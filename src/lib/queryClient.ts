// Centralized QueryClient + persisted cache.
// Strategy: stale-while-revalidate. Show cached data instantly, then refetch in background.
// Cache survives reloads via localStorage and is busted whenever BUILD_VERSION changes.

import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

// Bump this string whenever DB schema or data shape changes to force a clean cache.
export const BUILD_VERSION = "2026-05-04-v1";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data immediately, refresh in background after 5 min.
      staleTime: 5 * 60_000,
      // Keep unused data in memory for 24h so navigation feels instant.
      gcTime: 24 * 60 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: 1,
      networkMode: "offlineFirst",
    },
  },
});

// Persist the cache to localStorage so the app boots with last-known data instantly.
if (typeof window !== "undefined") {
  try {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: "tt-query-cache",
      throttleTime: 1500,
    });

    persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60_000, // 24h
      buster: BUILD_VERSION,    // changing this auto-purges old cache
    });
  } catch {
    // Quota / private mode — silently skip persistence.
  }
}

// Manual "pull-to-refresh" — invalidates everything and forces a re-fetch.
export async function refreshAllData() {
  await queryClient.invalidateQueries();
  await queryClient.refetchQueries({ type: "active" });
}
