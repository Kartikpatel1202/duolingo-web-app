"use client";

import { BookOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Card, ErrorState, toTone } from "@/components/ui";
import { useCoursePath } from "@/hooks/api/useCourse";
import { useCurrentUser } from "@/hooks/api/useLearner";
import type { CoursePath } from "@/types/api";

import { CourseHeader } from "./CourseHeader";
import { PathSkeleton } from "./PathSkeleton";
import { SkillDetailDialog, type SelectedSkill } from "./SkillDetailDialog";
import { UnitSection } from "./UnitSection";

/** The /learn experience: course header + every unit's winding path + skill dialog. */
export function LearnView() {
  const user = useCurrentUser();
  const courseId = user.data?.current_course_id;
  const path = useCoursePath(courseId);

  if (user.isError || path.isError) {
    const failed = user.isError ? user : path;
    return <ErrorState error={failed.error} onRetry={() => void failed.refetch()} retrying={failed.isFetching} />;
  }
  if (user.data && courseId == null) return <NoCourse />;
  if (!path.data) return <PathSkeleton />;
  return <LearningPath path={path.data} />;
}

function LearningPath({ path }: { path: CoursePath }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  // Flat, ordered list: lets the dialog name the previous skill ("Complete X to unlock").
  const ordered = useMemo(
    () => path.units.flatMap((unit) => unit.skills.map((skill) => ({ skill, unit }))),
    [path.units],
  );

  const selection: SelectedSkill | null = useMemo(() => {
    const index = ordered.findIndex((entry) => entry.skill.id === selectedId);
    const entry = ordered[index];
    if (!entry) return null;
    return {
      skill: entry.skill,
      unitTone: toTone(entry.unit.theme, "leaf"),
      previousSkillTitle: ordered[index - 1]?.skill.title ?? null,
    };
  }, [ordered, selectedId]);

  const openSkill = useCallback((skillId: number) => {
    setSelectedId(skillId);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  // Bring the learner's current skill into view on arrival (like opening the game board).
  useEffect(() => {
    const node = document.querySelector("[data-current-skill]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  // Index of each unit's first skill within the whole course (keeps the wave continuous).
  const firstIndexes = useMemo(
    () =>
      path.units.map((_, i) =>
        path.units.slice(0, i).reduce((count, unit) => count + unit.skills.length, 0),
      ),
    [path.units],
  );

  const currentSkillId = path.current_skill_id;
  return (
    <div className="space-y-8">
      <CourseHeader
        course={path.course}
        onContinue={currentSkillId != null ? () => openSkill(currentSkillId) : undefined}
      />
      {path.units.map((unit, i) => (
        <UnitSection
          key={unit.id}
          unit={unit}
          firstGlobalIndex={firstIndexes[i] ?? 0}
          currentSkillId={currentSkillId}
          onSelect={openSkill}
        />
      ))}
      <SkillDetailDialog selection={selection} open={open} onClose={close} />
    </div>
  );
}

function NoCourse() {
  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center">
      <BookOpen className="size-12 text-sky-500" aria-hidden />
      <h1 className="text-title font-black">Pick a course to begin</h1>
      <p className="font-semibold text-muted">You are not enrolled in a course yet.</p>
    </Card>
  );
}
