"use client";

import { useState } from "react";

import { useSpeech } from "@/hooks/useSpeech";
import { cn } from "@/lib/cn";

import { ChoiceTile, type TileState } from "./ChoiceTile";
import type { AnswerOf, ExerciseViewProps } from "./types";

type Props = ExerciseViewProps<"match_pairs">;
type Side = "left" | "right";
type Pair = AnswerOf<"match_pairs">["pairs"][number];

/** Colours that tell the learner's pairs apart before checking (pair n ↔ colour n). Sky is
 * reserved for the item currently waiting for its partner. */
const PAIR_COLOURS = [
  "border-grape-500 bg-grape-50 text-grape-700 [--tactile-edge:var(--color-grape-500)]",
  "border-ember-500 bg-ember-50 text-ember-600 [--tactile-edge:var(--color-ember-500)]",
  "border-sun-500 bg-sun-50 text-sun-700 [--tactile-edge:var(--color-sun-500)]",
  "border-leaf-400 bg-leaf-50 text-leaf-700 [--tactile-edge:var(--color-leaf-400)]",
  "border-cherry-400 bg-cherry-50 text-cherry-700 [--tactile-edge:var(--color-cherry-400)]",
];

/**
 * Tap an item on one side, then its partner on the other. Pairing is local and instant; the
 * full set is graded by the server in one check (verdicts per pair would require sending the
 * solution to the browser). Tapping a paired item unpairs it.
 */
export function MatchPairsExercise({ exercise, answer, onChange, feedback, disabled }: Props) {
  const { content } = exercise;
  const { speak } = useSpeech();
  // In-progress selection is purely presentational, so it stays local to this exercise.
  const [pending, setPending] = useState<{ side: Side; id: string } | null>(null);
  const pairs = answer?.pairs ?? [];

  const pairIndex = (side: Side, id: string) =>
    pairs.findIndex((pair) => (side === "left" ? pair.left_id : pair.right_id) === id);

  function tap(side: Side, id: string, text: string, language: string | null | undefined) {
    if (disabled) return;
    if (language) speak(text, language);
    const existing = pairIndex(side, id);
    if (existing >= 0) {
      onChange({ type: "match_pairs", pairs: pairs.filter((_, i) => i !== existing) });
      setPending(null);
      return;
    }
    if (!pending || pending.side === side) {
      setPending(pending?.id === id ? null : { side, id });
      return;
    }
    const pair: Pair =
      side === "left" ? { left_id: id, right_id: pending.id } : { left_id: pending.id, right_id: id };
    onChange({ type: "match_pairs", pairs: [...pairs, pair] });
    setPending(null);
  }

  const correctRight = new Map(feedback?.reveal.pairs.map((pair) => [pair.left_id, pair.right_id]));

  function stateOf(side: Side, id: string): { state: TileState; colour?: string } {
    const index = pairIndex(side, id);
    if (feedback) {
      const pair = pairs[index];
      if (!pair) return { state: "dimmed" };
      return { state: correctRight.get(pair.left_id) === pair.right_id ? "correct" : "incorrect" };
    }
    if (index >= 0) return { state: "idle", colour: PAIR_COLOURS[index % PAIR_COLOURS.length] };
    return { state: pending?.side === side && pending.id === id ? "selected" : "idle" };
  }

  function column(side: Side) {
    const items = side === "left" ? content.left : content.right;
    const language = side === "left" ? content.left_language : content.right_language;
    return (
      <div role="group" aria-label={side === "left" ? "Words" : "Meanings"} className="flex flex-col gap-3">
        {items.map((item) => {
          const { state, colour } = stateOf(side, item.id);
          const index = pairIndex(side, item.id);
          return (
            <ChoiceTile
              key={item.id}
              state={state}
              disabled={disabled}
              onClick={() => tap(side, item.id, item.text, language)}
              data-pair-item={`${side}:${item.id}`}
              aria-label={index >= 0 && !feedback ? `${item.text} (pair ${index + 1})` : item.text}
              lang={language ?? undefined}
              className={cn("min-h-16", colour)}
            >
              {item.text}
            </ChoiceTile>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6">
      {column("left")}
      {column("right")}
    </div>
  );
}
