"use client";

import { skipToken, useQuery } from "@tanstack/react-query";

import { api, request } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/queryKeys";

/** The learning path with the learner's status for every skill (computed by the backend). */
export function useCoursePath(courseId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.course.path(courseId ?? 0),
    queryFn:
      courseId == null
        ? skipToken
        : () =>
            request(
              api.GET("/api/courses/{course_id}/path", { params: { path: { course_id: courseId } } }),
            ),
  });
}

export function useSkill(skillId: number | null) {
  return useQuery({
    queryKey: queryKeys.course.skill(skillId ?? 0),
    queryFn:
      skillId == null
        ? skipToken
        : () =>
            request(api.GET("/api/skills/{skill_id}", { params: { path: { skill_id: skillId } } })),
  });
}

export function useLesson(lessonId: number) {
  return useQuery({
    queryKey: queryKeys.lesson(lessonId),
    queryFn: () =>
      request(api.GET("/api/lessons/{lesson_id}", { params: { path: { lesson_id: lessonId } } })),
    // Lesson content never changes during a session.
    staleTime: Infinity,
  });
}

/** A unit's guidebook. It is course content, so it is cached for the whole session. */
export function useGuidebook(unitId: number) {
  return useQuery({
    queryKey: queryKeys.course.guidebook(unitId),
    queryFn: () =>
      request(api.GET("/api/units/{unit_id}/guidebook", { params: { path: { unit_id: unitId } } })),
    staleTime: Infinity,
  });
}
