"use client";

import { useQuery } from "@tanstack/react-query";

import { api, request } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/queryKeys";

export const LEADERBOARD_SIZE = 30;

export function useLeaderboard(limit: number = LEADERBOARD_SIZE) {
  return useQuery({
    queryKey: queryKeys.leaderboard(limit),
    queryFn: () => request(api.GET("/api/leaderboard", { params: { query: { limit } } })),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => request(api.GET("/api/profile")),
  });
}
