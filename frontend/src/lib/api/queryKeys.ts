/**
 * Every query key in one place. Keys are hierarchical, so invalidating `["course"]` refreshes
 * every course-derived query (path, skills) at once.
 */
export const queryKeys = {
  user: () => ["user", "me"] as const,
  progress: () => ["progress"] as const,
  hearts: () => ["hearts"] as const,
  course: {
    all: () => ["course"] as const,
    path: (courseId: number) => ["course", courseId, "path"] as const,
    skill: (skillId: number) => ["course", "skill", skillId] as const,
  },
  lesson: (lessonId: number) => ["lesson", lessonId] as const,
  leaderboard: (limit: number) => ["leaderboard", limit] as const,
  leaderboardAll: () => ["leaderboard"] as const,
  profile: () => ["profile"] as const,
};
