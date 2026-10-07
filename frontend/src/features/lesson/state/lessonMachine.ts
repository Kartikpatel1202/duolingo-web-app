/**
 * The lesson as a state machine (a pure reducer — no fetching, no timers).
 *
 *            ATTEMPT_READY                       ANSWER_CHANGED
 *  loading ─────────────────► answering ◄───────────────┐
 *     │ START_FAILED              │ CHECK_STARTED        │
 *     ▼                           ▼                      │
 *   error / out_of_hearts     checking ─ CHECK_FAILED ───┘ (error kept, same submission id)
 *                                 │ CHECK_SUCCEEDED
 *                                 ▼
 *   answering ── SKIP ──► answering (this exercise goes to the back of the queue; no check,
 *                          no heart lost, and it must still be solved before the lesson ends)
 *                        correct │ incorrect ── CONTINUE ──► answering (next / re-queued)
 *                                 │                     ├──► out_of_hearts  (no hearts left)
 *                                 │                     ├──► challenge_failed
 *                                 ▼ CONTINUE (queue empty)
 *                            completing ── COMPLETE_FAILED ──► error ── RETRY ──► completing
 *                                 │ COMPLETE_SUCCEEDED
 *                                 ▼
 *                              complete
 *
 * Every event is only accepted in the phases listed above, which is what makes double clicks,
 * late responses and StrictMode's double effects harmless: a second COMPLETE_SUCCEEDED or
 * CHECK_SUCCEEDED in the wrong phase is simply ignored.
 */
import type { ApiError } from "@/lib/api/errors";
import type {
  AnswerIn,
  Attempt,
  CheckResult,
  CompletionResult,
  Exercise,
  Hearts,
  Lesson,
} from "@/types/api";

export type ChallengeEnd = "mistakes" | "time_up";

export type LessonPhase =
  | { name: "loading" }
  | { name: "answering"; submitError: ApiError | null }
  | { name: "checking" }
  | { name: "correct"; check: CheckResult }
  | { name: "incorrect"; check: CheckResult }
  | { name: "completing" }
  | { name: "complete"; result: CompletionResult }
  | { name: "out_of_hearts" }
  | { name: "challenge_failed"; reason: ChallengeEnd }
  | { name: "error"; error: ApiError; during: "start" | "complete" };

/** What the learner saw for one exercise — powers the "Review" list on the completion screen. */
export interface ReviewItem {
  exerciseId: number;
  prompt: string;
  correctAnswer: string;
  hadMistake: boolean;
}

export interface LessonState {
  phase: LessonPhase;
  lesson: Lesson;
  attempt: Attempt | null;
  /** Exercise ids still to solve; the head is the current exercise. */
  queue: number[];
  /** Exercises sent to the back of the queue after a mistake (shown again as "Previous mistake"). */
  requeuedIds: number[];
  solvedCount: number;
  answer: AnswerIn | null;
  /** Idempotency key of the current answer; reused when retrying the very same answer. */
  submissionId: string | null;
  mistakes: number;
  mistakesRemaining: number | null;
  hearts: Hearts | null;
  review: ReviewItem[];
}

export type LessonEvent =
  | { type: "ATTEMPT_READY"; attempt: Attempt }
  | { type: "START_FAILED"; error: ApiError }
  | { type: "ANSWER_CHANGED"; answer: AnswerIn }
  | { type: "CHECK_STARTED"; submissionId: string }
  | { type: "CHECK_SUCCEEDED"; check: CheckResult }
  | { type: "CHECK_FAILED"; error: ApiError }
  | { type: "SKIP" }
  | { type: "CONTINUE" }
  | { type: "COMPLETE_SUCCEEDED"; result: CompletionResult }
  | { type: "COMPLETE_FAILED"; error: ApiError }
  | { type: "HEARTS_REFILLED"; hearts: Hearts }
  | { type: "TIME_UP" }
  | { type: "RETRY" };

export function initialLessonState(lesson: Lesson): LessonState {
  return {
    phase: { name: "loading" },
    lesson,
    attempt: null,
    queue: [],
    requeuedIds: [],
    solvedCount: 0,
    answer: null,
    submissionId: null,
    mistakes: 0,
    mistakesRemaining: null,
    hearts: null,
    review: [],
  };
}

export function currentExercise(state: LessonState): Exercise | null {
  const id = state.queue[0];
  return state.lesson.exercises.find((exercise) => exercise.id === id) ?? null;
}

/** Phases in which the learner is inside the exercise loop (header, footer, timer visible). */
export function isPlaying(phase: LessonPhase): boolean {
  return ["answering", "checking", "correct", "incorrect", "out_of_hearts"].includes(phase.name);
}

function challengeEnd(error: ApiError): ChallengeEnd | null {
  if (error.code !== "ATTEMPT_FAILED") return null;
  return error.details.reason === "time_up" ? "time_up" : "mistakes";
}

export function lessonReducer(state: LessonState, event: LessonEvent): LessonState {
  const { phase } = state;

  switch (event.type) {
    case "ATTEMPT_READY": {
      if (phase.name !== "loading") return state;
      const { attempt } = event;
      const solved = new Set(attempt.solved_exercise_ids);
      // Resume: unsolved exercises in lesson order (refresh-safe — progress lives on the server).
      const queue = state.lesson.exercises.map((e) => e.id).filter((id) => !solved.has(id));
      return {
        ...state,
        attempt,
        queue,
        solvedCount: solved.size,
        mistakes: attempt.mistakes,
        mistakesRemaining:
          attempt.mistake_limit === null ? null : Math.max(0, attempt.mistake_limit - attempt.mistakes),
        hearts: attempt.hearts,
        phase: queue.length === 0 ? { name: "completing" } : { name: "answering", submitError: null },
      };
    }

    case "START_FAILED":
      if (phase.name !== "loading") return state;
      if (event.error.code === "OUT_OF_HEARTS") return { ...state, phase: { name: "out_of_hearts" } };
      return { ...state, phase: { name: "error", error: event.error, during: "start" } };

    case "ANSWER_CHANGED":
      if (phase.name !== "answering") return state;
      // A different answer is a new submission; the old id must not be reused for it.
      return { ...state, answer: event.answer, submissionId: null, phase: { name: "answering", submitError: null } };

    case "CHECK_STARTED":
      if (phase.name !== "answering" || state.answer === null) return state;
      return { ...state, submissionId: event.submissionId, phase: { name: "checking" } };

    case "CHECK_SUCCEEDED": {
      if (phase.name !== "checking") return state;
      const { check } = event;
      const exercise = currentExercise(state);
      const reviewed = state.review.some((item) => item.exerciseId === check.exercise_id);
      const review = reviewed
        ? state.review.map((item) =>
            item.exerciseId === check.exercise_id
              ? { ...item, hadMistake: item.hadMistake || !check.is_correct }
              : item,
          )
        : [
            ...state.review,
            {
              exerciseId: check.exercise_id,
              prompt: exercise?.prompt ?? "",
              correctAnswer: check.correct_answer,
              hadMistake: !check.is_correct,
            },
          ];
      return {
        ...state,
        hearts: check.hearts,
        mistakes: check.attempt.mistakes,
        mistakesRemaining: check.attempt.mistakes_remaining,
        solvedCount: check.attempt.solved_count,
        review,
        phase: check.is_correct ? { name: "correct", check } : { name: "incorrect", check },
      };
    }

    case "CHECK_FAILED": {
      if (phase.name !== "checking") return state;
      if (event.error.code === "OUT_OF_HEARTS") return { ...state, phase: { name: "out_of_hearts" } };
      const ended = challengeEnd(event.error);
      if (ended) return { ...state, phase: { name: "challenge_failed", reason: ended } };
      // Nothing was confirmed by the server: keep the answer (and its submission id) for a retry.
      return { ...state, phase: { name: "answering", submitError: event.error } };
    }

    case "SKIP": {
      const [current, ...rest] = state.queue;
      // Nothing to skip to when this is the last exercise left.
      if (phase.name !== "answering" || current === undefined || rest.length === 0) return state;
      return { ...state, queue: [...rest, current], answer: null, submissionId: null };
    }

    case "CONTINUE": {
      if (phase.name !== "correct" && phase.name !== "incorrect") return state;
      const [current, ...rest] = state.queue;
      // A mistake sends the exercise to the back of the queue; it must still be solved.
      const requeue = phase.name === "incorrect" && current !== undefined;
      const queue = requeue ? [...rest, current] : rest;
      const requeuedIds = requeue && !state.requeuedIds.includes(current) ? [...state.requeuedIds, current] : state.requeuedIds;
      const next = { ...state, queue, requeuedIds, answer: null, submissionId: null };
      if (phase.check.attempt.status === "failed") {
        return { ...next, phase: { name: "challenge_failed", reason: "mistakes" } };
      }
      if (phase.check.heart_lost && phase.check.hearts.current === 0) {
        return { ...next, phase: { name: "out_of_hearts" } };
      }
      if (queue.length === 0) return { ...next, phase: { name: "completing" } };
      return { ...next, phase: { name: "answering", submitError: null } };
    }

    case "COMPLETE_SUCCEEDED":
      if (phase.name !== "completing") return state;
      return { ...state, phase: { name: "complete", result: event.result } };

    case "COMPLETE_FAILED": {
      if (phase.name !== "completing") return state;
      const ended = challengeEnd(event.error);
      if (ended) return { ...state, phase: { name: "challenge_failed", reason: ended } };
      return { ...state, phase: { name: "error", error: event.error, during: "complete" } };
    }

    case "HEARTS_REFILLED":
      if (phase.name !== "out_of_hearts") return state;
      return {
        ...state,
        hearts: event.hearts,
        // Out of hearts before the attempt even started → start it now.
        phase: state.attempt ? { name: "answering", submitError: null } : { name: "loading" },
      };

    case "TIME_UP":
      // Once completion is in flight the server decides (it re-checks the deadline itself).
      if (!isPlaying(phase)) return state;
      return { ...state, phase: { name: "challenge_failed", reason: "time_up" } };

    case "RETRY":
      if (phase.name !== "error") return state;
      return { ...state, phase: phase.during === "start" ? { name: "loading" } : { name: "completing" } };
  }
}
