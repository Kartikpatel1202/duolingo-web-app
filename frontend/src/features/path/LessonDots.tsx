import { Check, Crown, Lock } from "lucide-react";

import { TONE_SOLID, type Tone } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SkillLesson } from "@/types/api";

interface LessonDotsProps {
  lessons: SkillLesson[];
  tone: Tone;
  nextLessonId: number | null;
}

/** One dot per lesson in the skill, showing the backend's per-lesson status. */
export function LessonDots({ lessons, tone, nextLessonId }: LessonDotsProps) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Lessons">
      {lessons.map((lesson) => {
        const isNext = lesson.id === nextLessonId && lesson.status === "available";
        return (
          <li
            key={lesson.id}
            aria-label={`Lesson ${lesson.position}${lesson.title ? `: ${lesson.title}` : ""}, ${lesson.legendary ? "legendary" : lesson.status}`}
            className={cn(
              "flex size-11 items-center justify-center rounded-full border-[3px] text-sm font-black",
              lesson.status === "completed" &&
                (lesson.legendary ? "border-grape-500 bg-grape-500 text-white" : "border-sun-500 bg-sun-500 text-white"),
              lesson.status === "available" && cn("border-transparent text-white", TONE_SOLID[tone]),
              lesson.status === "locked" && "border-line bg-mist text-muted",
              isNext && "ring-4 ring-sky-100",
            )}
          >
            {lesson.legendary ? (
              <Crown className="size-5" fill="currentColor" aria-hidden />
            ) : lesson.status === "completed" ? (
              <Check className="size-5" strokeWidth={4} aria-hidden />
            ) : lesson.status === "locked" ? (
              <Lock className="size-4" strokeWidth={3} aria-hidden />
            ) : (
              <span aria-hidden>{lesson.position}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
