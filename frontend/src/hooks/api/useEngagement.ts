"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, request } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { invalidateLearnerState } from "@/lib/api/queryClient";
import { queryKeys } from "@/lib/api/queryKeys";
import type { ShopItemId } from "@/types/api";

export function useStreakCalendar(month: string | null) {
  return useQuery({
    queryKey: queryKeys.streak(month),
    queryFn: () =>
      request(api.GET("/api/streak", { params: { query: month ? { month } : {} } })),
  });
}

export function useShop() {
  return useQuery({ queryKey: queryKeys.shop(), queryFn: () => request(api.GET("/api/shop")) });
}

export function usePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    // `purchaseId` is created once per click, so the automatic retries below reuse it and the
    // server charges at most once.
    mutationFn: ({ itemId, purchaseId }: { itemId: ShopItemId; purchaseId: string }) =>
      request(api.POST("/api/shop/purchase", { body: { item_id: itemId, purchase_id: purchaseId } })),
    retry: (failureCount, error) => toApiError(error).isRetryable && failureCount < 2,
    onSuccess: () => invalidateLearnerState(queryClient),
  });
}

export function useQuests() {
  return useQuery({ queryKey: queryKeys.quests(), queryFn: () => request(api.GET("/api/quests")) });
}

export function useClaimQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      request(api.POST("/api/quests/{code}/claim", { params: { path: { code } } })),
    onSuccess: () => invalidateLearnerState(queryClient),
  });
}

export function useClaimChest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (unitId: number) =>
      request(api.POST("/api/units/{unit_id}/chest/claim", { params: { path: { unit_id: unitId } } })),
    onSuccess: () => invalidateLearnerState(queryClient),
  });
}

export function useFeed() {
  return useQuery({ queryKey: queryKeys.feed(), queryFn: () => request(api.GET("/api/feed")) });
}

export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses(),
    queryFn: () => request(api.GET("/api/courses")),
    staleTime: Infinity,
  });
}
