"use client";

import { Lock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

import { LookupIcon } from "@/components/icons/LookupIcon";
import { Badge, Button, ProgressBar, ResponsiveDialog, Skeleton, type Tone } from "@/components/ui";
import { useSkill } from "@/hooks/api/useCourse";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";
import type { PathSkill, SkillLesson } from "@/types/api";

import { LessonDots } from "./LessonDots";
import { NODE_FILL, STATUS_LABEL, STATUS_TONE, nodeTone, skillIcon } from "./skillPresentation";

export interface SelectedSkill {
  skill: PathSkill;
  unitTone: Tone;
  /** Title of the skill before this one, for the "how to unlock" hint. */
  previousSkillTitle: string | null;
}

interface SkillDetailDialogProps {
  selection: SelectedSkill | null;
  open: boolean;
  onClose: () => void;
}

const TITLE_ID = "skill-dialog-title";

/**
 * Skill details opened from a path node. Summary data comes from the path response (instant);
 * the lesson list comes from GET /api/skills/{id} and shows a skeleton while loading.
 */
export function SkillDetailDialog({ selection, open, onClose }: SkillDetailDialogProps) {
  return (
    <ResponsiveDialog open={open && selection !== null} onClose={onClose} labelledBy={TITLE_ID}>
      {selection && <SkillDetail selection={selection} />}
    </ResponsiveDialog>
  );
}

function SkillDetail({ selection }: { selection: SelectedSkill }) {
  const { skill, unitTone, previousSkillTitle } = selection;
  const router = useRouter();
  const detail = useSkill(skill.id);
  const tone = nodeTone(skill.status, unitTone);
  const locked = skill.status === "locked";
  const nextLesson: SkillLesson | undefined = detail.data?.lessons.find(
    (lesson) => lesson.id === skill.next_lesson_id,
  );

  function startLesson() {
    if (skill.next_lesson_id != null) router.push(`/lesson/${skill.next_lesson_id}`);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4 pr-10">
        <span
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-full shadow-[0_4px_0_var(--tactile-edge)]",
            NODE_FILL[tone],
            locked ? "text-muted" : "text-white",
          )}
          aria-hidden
        >
          <LookupIcon icon={skillIcon(skill.icon)} className="size-8" strokeWidth={2.6} />
        </span>
        <div className="min-w-0 space-y-1">
          <Badge tone={STATUS_TONE[skill.status]}>{STATUS_LABEL[skill.status]}</Badge>
          <h2 id={TITLE_ID} className="text-title font-black text-ink">
            {skill.title}
          </h2>
        </div>
      </div>

      {skill.description && <p className="font-semibold text-ink-soft">{skill.description}</p>}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-sm font-extrabold">
          <span className="text-ink-soft">Progress</span>
          <span className="tabular-nums text-muted">
            {skill.lessons_completed} / {pluralize(skill.total_lessons, "lesson")}
          </span>
        </div>
        <ProgressBar value={skill.progress} tone={locked ? "neutral" : tone} label={`${skill.title} progress`} />
      </div>

      <div className="min-h-12">
        {detail.data ? (
          <LessonDots lessons={detail.data.lessons} tone={unitTone} nextLessonId={skill.next_lesson_id} />
        ) : (
          <div className="flex gap-2" aria-hidden>
            {Array.from({ length: skill.total_lessons }, (_, i) => (
              <Skeleton key={i} shape="circle" className="size-11" />
            ))}
          </div>
        )}
      </div>

      {locked ? (
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-tile bg-mist p-3 font-bold text-ink-soft">
            <Lock className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={3} aria-hidden />
            {previousSkillTitle
              ? `Complete “${previousSkillTitle}” to unlock this skill.`
              : "Complete the previous skill to unlock this."}
          </p>
          <Button size="lg" fullWidth disabled>
            Locked
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {skill.status !== "completed" && (
            <p className="flex items-center justify-center gap-1.5 font-extrabold text-sun-700">
              <Zap className="size-5 text-sun-500" fill="currentColor" aria-hidden />
              {nextLesson ? `+${nextLesson.xp_reward} XP` : <Skeleton className="h-5 w-16" />}
              <span className="font-bold text-muted">· Lesson {skill.lessons_completed + 1} of {skill.total_lessons}</span>
            </p>
          )}
          <Button
            size="lg"
            fullWidth
            variant={skill.status === "completed" ? "reward" : "primary"}
            onClick={startLesson}
            data-autofocus
          >
            {skill.status === "completed" ? "Practice again" : "Start lesson"}
          </Button>
        </div>
      )}
    </div>
  );
}
