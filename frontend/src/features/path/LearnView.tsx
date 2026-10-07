"use client";

import { BookOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Card, ErrorState, toTone } from "@/components/ui";
import { useCoursePath } from "@/hooks/api/useCourse";
import { useCurrentUser } from "@/hooks/api/useLearner";
import type { CoursePath } from "@/types/api";

import { ReminderBanner } from "@/features/stats";

import { JumpDialog } from "./JumpDialog";
import { ScrollToTopButton, UpNextCard } from "./PathExtras";
import { PathSkeleton } from "./PathSkeleton";
import { SkillDetailDialog, type SelectedSkill } from "./SkillDetailDialog";
import { UnitSection } from "./UnitSection";
import { UNIT_ART } from "./unitArt";

/** The /learn experience: every unit's banner and winding path, plus the skill dialog. */
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

  // Units with their own look (see `unitArt.ts`) open an unlocked skill as a lesson-intro card
  // under its node; everything else — and any locked skill, which has to explain itself — opens
  // the skill dialog.
  const [introSkillId, setIntroSkillId] = useState<number | null>(null);
  const closeIntro = useCallback(() => setIntroSkillId(null), []);
  const openSkill = useCallback(
    (skillId: number) => {
      const entry = ordered.find((candidate) => candidate.skill.id === skillId);
      if (entry && UNIT_ART[entry.unit.position] && entry.skill.status !== "locked") {
        setOpen(false);
        setIntroSkillId(skillId);
        return;
      }
      setIntroSkillId(null);
      setSelectedId(skillId);
      setOpen(true);
    },
    [ordered],
  );
  const close = useCallback(() => setOpen(false), []);

  // "Jump here?" on a unit that is still ahead of the learner.
  const [jumpUnitId, setJumpUnitId] = useState<number | null>(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  const jumpUnit = path.units.find((unit) => unit.id === jumpUnitId) ?? null;
  const openJump = useCallback(
    (unitId: number) => {
      const unit = path.units.find((candidate) => candidate.id === unitId);
      const first = unit?.skills[0];
      // Units with their own look answer "Jump here?" with the same inline card as any lesson.
      if (unit && first && UNIT_ART[unit.position]) {
        setOpen(false);
        setIntroSkillId(first.id);
        return;
      }
      setJumpUnitId(unitId);
      setJumpOpen(true);
    },
    [path.units],
  );
  const goToCurrentSkill = useCallback(() => {
    const node = document.querySelector("[data-current-skill]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    if (path.current_skill_id != null) openSkill(path.current_skill_id);
  }, [path.current_skill_id, openSkill]);

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
      {/* The banner of the first unit is the visual title; the page still needs a real h1. */}
      <h1 className="sr-only">{path.course.title}</h1>
      {/* Wide screens show the reminder in the right rail instead. */}
      <ReminderBanner className="xl:hidden" />
      {path.units.map((unit, i) => (
        <UnitSection
          key={unit.id}
          unit={unit}
          firstGlobalIndex={firstIndexes[i] ?? 0}
          currentSkillId={currentSkillId}
          introSkillId={introSkillId}
          onCloseIntro={closeIntro}
          onSelect={openSkill}
          onJump={openJump}
          previousHasArt={Boolean(UNIT_ART[path.units[i - 1]?.position ?? 0])}
          nextUnitTitle={path.units[i + 1]?.title}
        />
      ))}
      <UpNextCard section={Math.max(1, ...path.units.map((unit) => unit.section)) + 1} />
      <ScrollToTopButton />
      <SkillDetailDialog selection={selection} open={open} onClose={close} />
      <JumpDialog
        unit={jumpUnit}
        tone={toTone(jumpUnit?.theme, "leaf")}
        open={jumpOpen}
        onClose={() => setJumpOpen(false)}
        onGoToCurrent={goToCurrentSkill}
      />
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
