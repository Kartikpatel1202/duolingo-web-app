"use client";

import { useRouter } from "next/navigation";

import { useSkill } from "@/hooks/api/useCourse";
import type { PathSkill, SkillDetail, SkillLesson } from "@/types/api";

export interface SkillActions {
  /** The skill's lesson list (loads after the path; undefined until then). */
  detail: SkillDetail | undefined;
  /** The lesson "Start" will open, with its XP reward. */
  nextLesson: SkillLesson | undefined;
  startLesson: () => void;
  /** For a completed skill: the first lesson not yet won in Legendary mode, if any. */
  legendaryLesson: SkillLesson | null;
  startLegendary: () => void;
}

/**
 * What the learner can do with a skill: start its next lesson or take a Legendary challenge. Shared
 * by the skill dialog and the lesson-intro card so both start lessons the same way — they only
 * navigate; the lesson attempt itself is created by the lesson page through the API.
 */
export function useSkillActions(skill: PathSkill): SkillActions {
  const router = useRouter();
  const { data: detail } = useSkill(skill.id);
  const nextLesson = detail?.lessons.find((lesson) => lesson.id === skill.next_lesson_id);
  const legendaryLesson =
    skill.status === "completed" ? (detail?.lessons.find((lesson) => !lesson.legendary) ?? null) : null;

  return {
    detail,
    nextLesson,
    legendaryLesson,
    startLesson: () => {
      if (skill.next_lesson_id != null) router.push(`/lesson/${skill.next_lesson_id}`);
    },
    startLegendary: () => {
      if (legendaryLesson) router.push(`/lesson/${legendaryLesson.id}?mode=legendary`);
    },
  };
}
