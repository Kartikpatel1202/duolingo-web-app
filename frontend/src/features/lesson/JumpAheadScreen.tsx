"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui";
import { useCoursePath } from "@/hooks/api/useCourse";
import { useCurrentUser } from "@/hooks/api/useLearner";

import { LessonError, LessonLoading } from "./components/LessonStates";

/** Shortest time the loading screen stays up, so the hand-over to the prompt is not a flash. */
const LOADING_SCREEN_MS = 1500;
const LOADING_TIP = "Protip: After a lesson, write down as many phrases as you can remember from it.";

/**
 * "Jump here?": the step between a unit's fast-forward node and its test. A loading screen, then
 * a prompt naming the unit; LET'S GO opens the unit's first lesson in the normal lesson player
 * (the API opens the first skill of every unit — see `app.domain.unlocks`), MAYBE LATER goes back
 * to the path. Which unit and which lesson come from the course path, never from the browser.
 */
export function JumpAheadScreen({ unitId }: { unitId: number }) {
  const user = useCurrentUser();
  const path = useCoursePath(user.data?.current_course_id);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setWaited(true), LOADING_SCREEN_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const failed = user.isError ? user : path.isError ? path : null;
  if (failed) {
    return <LessonError error={failed.error} onRetry={() => void failed.refetch()} retrying={failed.isFetching} />;
  }
  if (!waited || !path.data) return <LessonLoading lessonId={unitId} tip={LOADING_TIP} />;

  const unit = path.data.units.find((candidate) => candidate.id === unitId);
  const lessonId = unit?.skills[0]?.next_lesson_id ?? null;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <main id="main" className="flex flex-1 flex-col items-center justify-center gap-10 px-6 text-center">
        {/* Artwork supplied with the reference (cut from the image, not redrawn). */}
        <Image src="/brand/path/jump-test.png" alt="" aria-hidden width={148} height={171} unoptimized priority />
        <h1 className="text-title font-extrabold text-ink-soft">
          {unit ? `Pass this test to jump ahead to Unit ${unit.position}!` : "This unit could not be found."}
        </h1>
      </main>
      <div className="border-t-2 border-line pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-[1000px] items-center justify-between gap-4 px-4 pt-5 sm:px-10">
          <Link
            href="/learn"
            className="focus-ring rounded-tile px-3 py-2 text-[15px] font-extrabold tracking-wide text-sky-500 uppercase hover:text-sky-600"
          >
            Maybe later
          </Link>
          {lessonId != null ? (
            <ButtonLink href={`/lesson/${lessonId}`} variant="secondary" size="md" className="min-w-[126px]">
              Let&apos;s go
            </ButtonLink>
          ) : (
            // The API has no lesson to start in this unit (it is locked there): nothing to launch.
            <span
              aria-disabled
              className="flex min-h-12 min-w-[126px] items-center justify-center rounded-tile bg-locked px-5 text-[15px] font-extrabold tracking-wide text-muted uppercase"
            >
              Let&apos;s go
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
