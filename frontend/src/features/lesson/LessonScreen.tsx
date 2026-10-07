"use client";

import { useEffect, useState } from "react";

import { useLesson } from "@/hooks/api/useCourse";
import type { AttemptMode } from "@/types/api";

import { LessonError, LessonLoading } from "./components/LessonStates";
import { LessonPlayer } from "./LessonPlayer";

/** Shortest time the loading screen is shown, in ms. */
const LOADING_SCREEN_MS = 700;

interface LessonScreenProps {
  lessonId: number;
  mode: AttemptMode;
}

/** Loads the lesson content (never solutions), then mounts a fresh player for it. */
export function LessonScreen({ lessonId, mode }: LessonScreenProps) {
  const lesson = useLesson(lessonId);
  // Bumping the run remounts the player: a brand-new session (used after a failed challenge).
  const [run, setRun] = useState(0);
  // The loading screen stays up for a beat even when the data arrives at once, so it reads as a
  // transition into the lesson rather than a flash; it never waits longer than this.
  const [shownLongEnough, setShownLongEnough] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShownLongEnough(true), LOADING_SCREEN_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (lesson.error) {
    return <LessonError error={lesson.error} onRetry={() => void lesson.refetch()} retrying={lesson.isFetching} />;
  }
  if (!lesson.data || !shownLongEnough) return <LessonLoading lessonId={lessonId} />;
  return (
    <LessonPlayer
      key={`${lessonId}-${mode}-${run}`}
      lesson={lesson.data}
      mode={mode}
      onRestart={() => setRun((current) => current + 1)}
    />
  );
}
