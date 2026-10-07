"use client";

import { useCallback, useEffect, useReducer } from "react";

import {
  useCheckAnswer,
  useCompleteLesson,
  useRefillHearts,
  useStartAttempt,
} from "@/hooks/api/useLessonApi";
import { toApiError } from "@/lib/api/errors";
import type { AnswerIn, AttemptMode, Lesson } from "@/types/api";

import { isAnswerComplete } from "../exercises/registry";
import { newSubmissionId } from "../lessonHelpers";
import { currentExercise, initialLessonState, lessonReducer } from "../state/lessonMachine";

/**
 * Connects the pure lesson reducer to the API. The reducer decides *what state we are in*; this
 * hook performs the side effect that state calls for (start/resume an attempt, check an answer,
 * complete the lesson, refill hearts) and feeds the outcome back as an event.
 */
export function useLessonSession(lesson: Lesson, mode: AttemptMode) {
  const [state, dispatch] = useReducer(lessonReducer, lesson, initialLessonState);
  const { mutateAsync: startAttempt } = useStartAttempt(lesson.id, mode);
  const { mutateAsync: checkAnswer, isPending: checking } = useCheckAnswer(lesson.id);
  const { mutateAsync: completeLesson } = useCompleteLesson(lesson.id);
  const { mutateAsync: refill, isPending: refilling } = useRefillHearts();
  const phase = state.phase.name;
  const attemptId = state.attempt?.attempt_id ?? null;

  // loading → create or resume the attempt (resuming is what makes a page refresh safe).
  useEffect(() => {
    if (phase !== "loading") return;
    startAttempt().then(
      (attempt) => dispatch({ type: "ATTEMPT_READY", attempt }),
      (error: unknown) => dispatch({ type: "START_FAILED", error: toApiError(error) }),
    );
  }, [phase, startAttempt]);

  // completing → ask the server to complete. Idempotent, so a repeated call is harmless.
  useEffect(() => {
    if (phase !== "completing" || !attemptId) return;
    completeLesson(attemptId).then(
      (result) => dispatch({ type: "COMPLETE_SUCCEEDED", result }),
      (error: unknown) => dispatch({ type: "COMPLETE_FAILED", error: toApiError(error) }),
    );
  }, [phase, attemptId, completeLesson]);

  const exercise = currentExercise(state);
  const canCheck =
    phase === "answering" && exercise !== null && !checking && isAnswerComplete(exercise, state.answer);

  const canSkip = phase === "answering" && !checking && state.queue.length > 1;
  const skip = useCallback(() => dispatch({ type: "SKIP" }), []);

  const setAnswer = useCallback((answer: AnswerIn) => dispatch({ type: "ANSWER_CHANGED", answer }), []);

  const check = useCallback(() => {
    if (!canCheck || !exercise || !attemptId || !state.answer) return;
    // Retrying the same answer re-uses its id, so the server can't count it twice.
    const submissionId = state.submissionId ?? newSubmissionId();
    dispatch({ type: "CHECK_STARTED", submissionId });
    checkAnswer({ attemptId, exerciseId: exercise.id, submissionId, answer: state.answer }).then(
      (check) => dispatch({ type: "CHECK_SUCCEEDED", check }),
      (error: unknown) => dispatch({ type: "CHECK_FAILED", error: toApiError(error) }),
    );
  }, [canCheck, exercise, attemptId, state.answer, state.submissionId, checkAnswer]);

  const next = useCallback(() => dispatch({ type: "CONTINUE" }), []);
  const retry = useCallback(() => dispatch({ type: "RETRY" }), []);
  const timeUp = useCallback(() => dispatch({ type: "TIME_UP" }), []);

  const refillHearts = useCallback(async () => {
    const result = await refill();
    dispatch({ type: "HEARTS_REFILLED", hearts: result.hearts });
  }, [refill]);

  return {
    state,
    exercise,
    canCheck,
    canSkip,
    skip,
    setAnswer,
    check,
    next,
    retry,
    timeUp,
    refillHearts,
    refilling,
  };
}
