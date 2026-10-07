/**
 * Shared typing for exercise components. Each exercise type's content, answer and reveal are
 * picked out of the generated API unions by their `type` discriminator, so a component can only
 * ever receive (and produce) the shapes of its own type.
 */
import type { ComponentType } from "react";

import type { AnswerIn, Exercise, ExerciseType, Reveal } from "@/types/api";

export type ExerciseOf<T extends ExerciseType> = Extract<Exercise, { type: T }>;
export type AnswerOf<T extends ExerciseType> = Extract<AnswerIn, { type: T }>;
export type RevealOf<T extends ExerciseType> = Extract<Reveal, { type: T }>;

/** After a check: what the server said, plus the answer it judged. */
export interface ExerciseFeedback<T extends ExerciseType> {
  isCorrect: boolean;
  reveal: RevealOf<T>;
}

export interface ExerciseViewProps<T extends ExerciseType> {
  exercise: ExerciseOf<T>;
  answer: AnswerOf<T> | null;
  onChange: (answer: AnswerOf<T>) => void;
  /** Present once the answer has been checked; the exercise then renders its verdict. */
  feedback: ExerciseFeedback<T> | null;
  /** True while checking or showing feedback: the answer can no longer change. */
  disabled: boolean;
}

export interface ExerciseDefinition<T extends ExerciseType> {
  Component: ComponentType<ExerciseViewProps<T>>;
  /** Whether the answer is ready to be checked (UI completeness only — never correctness). */
  isComplete: (answer: AnswerOf<T> | null, exercise: ExerciseOf<T>) => boolean;
  /** Language of the correct answer (for the feedback speaker), if there is one to pronounce. */
  answerLanguage: (exercise: ExerciseOf<T>) => string | null;
}

export type ExerciseRegistry = { [T in ExerciseType]: ExerciseDefinition<T> };
