"use client";

import { Construction, X } from "lucide-react";
import Link from "next/link";

import { ButtonLink, ErrorState, ProgressBar, Skeleton } from "@/components/ui";
import { AnimatedStat, HeartIcon } from "@/features/stats";
import { useLesson } from "@/hooks/api/useCourse";
import { useHearts } from "@/hooks/api/useLearner";
import { pluralize } from "@/lib/format";

/**
 * Phase 2 stand-in for the lesson player (Phase 3). It loads the real lesson — so locked lessons
 * are rejected by the backend exactly as they will be later — but starts no attempt and awards
 * nothing.
 */
export function LessonPlaceholder({ lessonId }: { lessonId: number }) {
  const lesson = useLesson(lessonId);
  const hearts = useHearts();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pt-4 sm:px-6">
      <header className="flex items-center gap-4 py-3">
        <Link href="/learn" aria-label="Exit lesson" className="focus-ring rounded-tile p-1 text-muted hover:text-ink-soft">
          <X className="size-7" strokeWidth={3} aria-hidden />
        </Link>
        <ProgressBar value={0} label="Lesson progress" className="flex-1" />
        {hearts.data ? (
          <AnimatedStat
            value={hearts.data.current}
            icon={<HeartIcon />}
            tone="cherry"
            label={`${hearts.data.current} of ${hearts.data.max} hearts`}
            onDecrease="shake"
          />
        ) : (
          <Skeleton className="h-8 w-12" />
        )}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
        {lesson.error ? (
          <ErrorState error={lesson.error} className="w-full max-w-md" />
        ) : (
          <>
            <span className="flex size-24 items-center justify-center rounded-full bg-sky-100 text-sky-500" aria-hidden>
              <Construction className="size-12" strokeWidth={2.4} />
            </span>
            <div className="space-y-2">
              <h1 className="text-title font-black text-ink">
                {lesson.data ? (lesson.data.title ?? "Lesson") : <Skeleton className="mx-auto h-8 w-48" />}
              </h1>
              <p className="font-bold text-muted">
                {lesson.data
                  ? `${pluralize(lesson.data.exercises.length, "exercise")} are ready. The lesson player arrives in the next build.`
                  : "Loading lesson…"}
              </p>
            </div>
          </>
        )}
      </main>

      <footer className="border-t-2 border-line py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <ButtonLink href="/learn" variant="primary" size="lg" fullWidth className="sm:ml-auto sm:flex sm:w-48">
          Back to path
        </ButtonLink>
      </footer>
    </div>
  );
}
