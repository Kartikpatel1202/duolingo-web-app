"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, request } from "@/lib/api/client";
import { invalidateLearnerState } from "@/lib/api/queryClient";
import { queryKeys } from "@/lib/api/queryKeys";
import type { DailyGoalOption } from "@/types/api";

/** Identity + everything the top stats bar needs (XP, streak, hearts, gems, daily goal). */
export function useCurrentUser({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.user(),
    queryFn: () => request(api.GET("/api/users/me")),
    enabled,
  });
}

export function useProgress() {
  return useQuery({
    queryKey: queryKeys.progress(),
    queryFn: () => request(api.GET("/api/progress")),
  });
}

export function useUpdateDailyGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dailyGoal: DailyGoalOption) =>
      request(api.PATCH("/api/users/me", { body: { daily_goal_xp: dailyGoal } })),
    onSuccess: async (user) => {
      queryClient.setQueryData(queryKeys.user(), user);
      await invalidateLearnerState(queryClient);
    },
  });
}
