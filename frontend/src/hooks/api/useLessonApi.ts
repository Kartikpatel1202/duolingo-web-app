"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { api, request } from "@/lib/api/client";
import { invalidateLearnerState } from "@/lib/api/queryClient";
import { queryKeys } from "@/lib/api/queryKeys";
import type { AnswerIn, AttemptMode, CurrentUser, Hearts } from "@/types/api";

/** Keep every cached copy of the hearts in sync with what the server just reported. */
function cacheHearts(queryClient: QueryClient, hearts: Hearts, gems?: number): void {
  queryClient.setQueryData(queryKeys.hearts(), hearts);
  queryClient.setQueryData<CurrentUser>(queryKeys.user(), (user) =>
    user ? { ...user, hearts, gems: gems ?? user.gems } : user,
  );
}

/** Create or resume the learner's attempt (the server decides which). */
export function useStartAttempt(lessonId: number, mode: AttemptMode) {
  return useMutation({
    mutationFn: () =>
      request(
        api.POST("/api/lessons/{lesson_id}/attempts", {
          params: { path: { lesson_id: lessonId } },
          body: { mode },
        }),
      ),
  });
}

export interface CheckVariables {
  attemptId: string;
  exerciseId: number;
  submissionId: string;
  answer: AnswerIn;
}

/** Server-side answer check. Correctness is never decided in the browser. */
export function useCheckAnswer(lessonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attemptId, exerciseId, submissionId, answer }: CheckVariables) =>
      request(
        api.POST("/api/lessons/{lesson_id}/check", {
          params: { path: { lesson_id: lessonId } },
          body: { attempt_id: attemptId, exercise_id: exerciseId, submission_id: submissionId, answer },
        }),
      ),
    onSuccess: (result) => cacheHearts(queryClient, result.hearts),
  });
}

/** Idempotent completion: XP, streak, progress and achievements are awarded by the server. */
export function useCompleteLesson(lessonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) =>
      request(
        api.POST("/api/progress/lesson/{lesson_id}/complete", {
          params: { path: { lesson_id: lessonId } },
          body: { attempt_id: attemptId },
        }),
      ),
    onSuccess: async (result) => {
      cacheHearts(queryClient, result.hearts, result.gems);
      // Path, stats, profile and leaderboard all changed — refresh them in the background so the
      // path is already up to date when the learner returns to it.
      await invalidateLearnerState(queryClient);
    },
  });
}

export function useRefillHearts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request(api.POST("/api/hearts/refill")),
    onSuccess: (result) => cacheHearts(queryClient, result.hearts, result.gems),
  });
}
