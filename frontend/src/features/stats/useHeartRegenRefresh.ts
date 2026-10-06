"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { queryKeys } from "@/lib/api/queryKeys";

/** Max delay accepted by setTimeout (~24.8 days). */
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Refresh hearts exactly when the backend says the next heart regenerates — no polling.
 * The backend stays the authority on the count; this only decides *when* to ask again.
 */
export function useHeartRegenRefresh(nextHeartAt: string | null | undefined): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!nextHeartAt) return;
    const delay = new Date(nextHeartAt).getTime() - Date.now() + 1_000;
    const timer = window.setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.user() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.hearts() });
    }, Math.min(Math.max(delay, 0), MAX_TIMEOUT_MS));
    return () => window.clearTimeout(timer);
  }, [nextHeartAt, queryClient]);
}
