"use client";

import { AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui";
import { useSkill } from "@/hooks/api/useCourse";
import { playSound } from "@/lib/sfx";
import type { AttemptMode, Lesson } from "@/types/api";

import { ChallengeFailed } from "./components/ChallengeFailed";
import { ChallengeStatus } from "./components/ChallengeStatus";
import { ExerciseStage } from "./components/ExerciseStage";
import { ExitLessonDialog } from "./components/ExitLessonDialog";
import { FeedbackBar } from "./components/FeedbackBar";
import { LessonComplete } from "./components/celebration/LessonComplete";
import { LessonFooter } from "./components/LessonFooter";
import { LessonHeader } from "./components/LessonHeader";
import { LessonError, LessonLoading, LessonSaving } from "./components/LessonStates";
import { NewWordTag } from "./components/NewWordTag";
import { OutOfHeartsDialog } from "./components/OutOfHeartsDialog";
import { ExerciseRenderer, answerLanguage } from "./exercises/registry";
import { useLessonKeyboard } from "./hooks/useLessonKeyboard";
import { useLessonSession } from "./hooks/useLessonSession";

interface LessonPlayerProps {
  lesson: Lesson;
  mode: AttemptMode;
  /** Restart from scratch (used by "Try again" after a failed challenge). */
  onRestart: () => void;
}

/** Composes the lesson screen for the current phase. All behaviour lives in useLessonSession. */
export function LessonPlayer({ lesson, mode, onRestart }: LessonPlayerProps) {
  const router = useRouter();
  const session = useLessonSession(lesson, mode);
  const { state, exercise } = session;
  const { phase } = state;
  const [exiting, setExiting] = useState(false);
  const legendary = mode === "legendary";
  const completion = phase.name === "complete" ? phase.result : null;
  // Name of a newly unlocked skill, from the real skill endpoint (only fetched when one unlocked).
  const unlockedSkill = useSkill(completion?.unlocked_skill_id ?? null);

  const feedback = phase.name === "correct" || phase.name === "incorrect" ? phase.check : null;
  // One cue per phase transition; playSound itself honours the learner's sound preference.
  useEffect(() => {
    if (phase.name === "correct" || phase.name === "incorrect" || phase.name === "complete") playSound(phase.name);
  }, [phase.name]);
  useLessonKeyboard(
    feedback ? session.next : phase.name === "answering" && session.canCheck ? session.check : null,
  );

  if (phase.name === "loading") return <LessonLoading lessonId={lesson.id} />;
  if (phase.name === "completing") return <LessonSaving />;
  if (phase.name === "error") return <LessonError error={phase.error} onRetry={session.retry} />;
  if (phase.name === "challenge_failed") return <ChallengeFailed reason={phase.reason} onTryAgain={onRestart} />;
  if (completion) {
    return (
      <LessonComplete
        result={completion}
        review={state.review}
        unlockedSkillTitle={unlockedSkill.data?.title ?? null}
        onContinue={() => router.push("/learn")}
      />
    );
  }

  const total = lesson.exercises.length;
  const retried = exercise ? state.requeuedIds.includes(exercise.id) : false;

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-8">
        <LessonHeader
          progress={state.solvedCount / total}
          hearts={state.hearts}
          legendary={legendary}
          onExit={() => setExiting(true)}
          challenge={
            legendary ? (
              <ChallengeStatus
                expiresAt={state.attempt?.expires_at ?? null}
                mistakesRemaining={state.mistakesRemaining}
                onTimeUp={session.timeUp}
              />
            ) : undefined
          }
        />
      </div>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-4 pb-8 sm:pt-10">
        <AnimatePresence mode="wait">
          {exercise && (
            <ExerciseStage key={exercise.id + (retried ? "-retry" : "")} exercise={exercise}>
              <div className="space-y-2">
                {exercise.type === "multiple_choice" && exercise.content.label === "new_word" && <NewWordTag />}
                {legendary && <Badge tone="grape">Legendary</Badge>}
                {retried && <Badge tone="cherry">Previous mistake</Badge>}
                <h1 className="text-title font-extrabold text-ink-soft">{exercise.prompt}</h1>
              </div>
              <ExerciseRenderer
                exercise={exercise}
                answer={state.answer}
                onChange={session.setAnswer}
                reveal={feedback?.reveal ?? null}
                isCorrect={feedback?.is_correct ?? false}
                disabled={phase.name !== "answering"}
              />
            </ExerciseStage>
          )}
        </AnimatePresence>
      </main>

      <div className="sticky bottom-0 bg-surface">
        {feedback && exercise ? (
          <FeedbackBar check={feedback} answerLanguage={answerLanguage(exercise)} onContinue={session.next} />
        ) : (
          <LessonFooter
            canCheck={session.canCheck}
            canSkip={session.canSkip}
            checking={phase.name === "checking"}
            submitError={phase.name === "answering" ? phase.submitError : null}
            onCheck={session.check}
            onSkip={session.skip}
          />
        )}
      </div>

      <OutOfHeartsDialog
        open={phase.name === "out_of_hearts"}
        hearts={state.hearts}
        refilling={session.refilling}
        onRefill={session.refillHearts}
      />
      <ExitLessonDialog open={exiting} onStay={() => setExiting(false)} />
    </div>
  );
}
