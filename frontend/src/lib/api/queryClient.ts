import { QueryClient } from "@tanstack/react-query";

import { toApiError } from "./errors";
import { queryKeys } from "./queryKeys";

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Learner state changes only through the learner's own actions, which invalidate it
        // explicitly; 30s keeps tab switches snappy without serving stale data for long.
        staleTime: 30_000,
        // Retry outages and 5xx, never 4xx (a locked lesson will not unlock by retrying).
        retry: (failureCount, error) => toApiError(error).isRetryable && failureCount < MAX_RETRIES,
      },
      mutations: { retry: false },
    },
  });
}

/**
 * Everything that a learner action (answering, completing a lesson, refilling hearts, changing
 * preferences) can change. Lesson content is immutable and deliberately not included.
 */
export function invalidateLearnerState(queryClient: QueryClient): Promise<void> {
  const keys = [
    queryKeys.user(),
    queryKeys.progress(),
    queryKeys.hearts(),
    queryKeys.course.all(),
    queryKeys.leaderboardAll(),
    queryKeys.profile(),
    queryKeys.streakAll(),
    queryKeys.shop(),
    queryKeys.quests(),
    queryKeys.feed(),
  ];
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(
    () => undefined,
  );
}
