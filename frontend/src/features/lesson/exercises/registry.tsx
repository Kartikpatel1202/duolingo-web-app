/**
 * Exercise type → component + "is the answer ready to check?" rule.
 *
 * The mapped `ExerciseRegistry` type makes this exhaustive: when the backend adds an exercise type
 * (and `npm run gen:api` picks it up) TypeScript fails here until the type is registered. The
 * lesson engine itself never changes.
 */
import { createElement } from "react";

import type { AnswerIn, Exercise, ExerciseType, Reveal } from "@/types/api";

import { FillBlankExercise } from "./FillBlankExercise";
import { MatchPairsExercise } from "./MatchPairsExercise";
import { MultipleChoiceExercise } from "./MultipleChoiceExercise";
import { TypeAnswerExercise } from "./TypeAnswerExercise";
import type { AnswerOf, ExerciseOf, ExerciseRegistry, RevealOf } from "./types";
import { WordBankExercise } from "./WordBankExercise";

export const exerciseRegistry: ExerciseRegistry = {
  multiple_choice: {
    Component: MultipleChoiceExercise,
    isComplete: (answer) => Boolean(answer?.option_id),
    answerLanguage: (exercise) => exercise.content.options_language ?? null,
  },
  word_bank: {
    Component: WordBankExercise,
    isComplete: (answer) => (answer?.tile_ids.length ?? 0) > 0,
    answerLanguage: (exercise) => exercise.content.tiles_language ?? null,
  },
  match_pairs: {
    Component: MatchPairsExercise,
    isComplete: (answer, exercise) => answer?.pairs.length === exercise.content.left.length,
    answerLanguage: () => null, // several pairs — nothing single to pronounce
  },
  fill_blank: {
    Component: FillBlankExercise,
    isComplete: (answer) => Boolean(answer?.text.trim()),
    answerLanguage: (exercise) => exercise.content.language ?? null,
  },
  type_answer: {
    Component: TypeAnswerExercise,
    isComplete: (answer) => Boolean(answer?.text.trim()),
    answerLanguage: (exercise) => exercise.content.target_language,
  },
};

// The helpers below take the exercise type as a separate generic key. That lets TypeScript
// correlate exercise ↔ answer ↔ reveal ↔ registry entry for the same type without casts
// (the "correlated union" pattern).

interface RenderOptions<T extends ExerciseType> {
  exercise: ExerciseOf<T>;
  answer: AnswerOf<T> | null;
  onChange: (answer: AnswerOf<T>) => void;
  reveal: RevealOf<T> | null;
  isCorrect: boolean;
  disabled: boolean;
}

function renderFor<T extends ExerciseType>(type: T, options: RenderOptions<T>) {
  const { exercise, answer, onChange, reveal, isCorrect, disabled } = options;
  return createElement(exerciseRegistry[type].Component, {
    exercise,
    answer,
    onChange,
    disabled,
    feedback: reveal ? { isCorrect, reveal } : null,
  });
}

function matches<T extends ExerciseType>(type: T, value: { type: string } | null): value is AnswerOf<T> {
  return value !== null && value.type === type;
}

function revealMatches<T extends ExerciseType>(type: T, value: Reveal | null): value is RevealOf<T> {
  return value !== null && value.type === type;
}

interface ExerciseRendererProps {
  exercise: Exercise;
  answer: AnswerIn | null;
  onChange: (answer: AnswerIn) => void;
  reveal: Reveal | null;
  isCorrect: boolean;
  disabled: boolean;
}

/** Renders the right component for the exercise. Mismatched answers/reveals are dropped. */
export function ExerciseRenderer({ exercise, answer, onChange, reveal, isCorrect, disabled }: ExerciseRendererProps) {
  const type = exercise.type;
  return renderFor(type, {
    exercise,
    answer: matches(type, answer) ? answer : null,
    onChange,
    reveal: revealMatches(type, reveal) ? reveal : null,
    isCorrect,
    disabled,
  });
}

function completeFor<T extends ExerciseType>(type: T, answer: AnswerOf<T>, exercise: ExerciseOf<T>) {
  return exerciseRegistry[type].isComplete(answer, exercise);
}

/** UI readiness only (e.g. every pair made) — correctness is always decided by the server. */
export function isAnswerComplete(exercise: Exercise, answer: AnswerIn | null): boolean {
  const type = exercise.type;
  return matches(type, answer) && completeFor(type, answer, exercise);
}

function languageFor<T extends ExerciseType>(type: T, exercise: ExerciseOf<T>) {
  return exerciseRegistry[type].answerLanguage(exercise);
}

export function answerLanguage(exercise: Exercise): string | null {
  return languageFor(exercise.type, exercise);
}
