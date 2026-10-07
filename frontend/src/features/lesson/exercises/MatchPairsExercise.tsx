"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { useSpeech } from "@/hooks/useSpeech";
import { ChoiceTile, type TileState } from "./ChoiceTile";
import type { AnswerOf, ExerciseViewProps } from "./types";

type Props = ExerciseViewProps<"match_pairs">;
type Side = "left" | "right";
type Pair = AnswerOf<"match_pairs">["pairs"][number];

/**
 * Tap an item on one side, then its partner on the other: both turn blue, the pair is stored
 * (by item id) and its two cards are locked. Pairing is local and instant; once every item is
 * paired, CHECK sends the full set and the server grades it in one go (verdicts per pair would
 * require sending the solution to the browser).
 *
 * Paired cards share the "selected" look and carry the pair's number, so the learner can see which
 * two belong together. (They used to get a colour per pair by adding colour classes on top of the
 * tile's own state classes; the state classes won in the stylesheet, so a paired card looked
 * untouched and the second tap seemed to be ignored.)
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
    // A paired card is locked (its button is disabled too; this guards keyboard/programmatic taps).
    if (pairIndex(side, id) >= 0) return;
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

  function stateOf(side: Side, id: string): TileState {
    const index = pairIndex(side, id);
    if (feedback) {
      const pair = pairs[index];
      if (!pair) return "dimmed";
      return correctRight.get(pair.left_id) === pair.right_id ? "correct" : "incorrect";
    }
    // Paired cards and the card waiting for its partner are both "selected" (blue).
    if (index >= 0) return "selected";
    return pending?.side === side && pending.id === id ? "selected" : "idle";
  }

  function column(side: Side) {
    const items = side === "left" ? content.left : content.right;
    const language = side === "left" ? content.left_language : content.right_language;
    return (
      <div role="group" aria-label={side === "left" ? "Words" : "Meanings"} className="flex flex-col gap-3">
        {items.map((item) => {
          const state = stateOf(side, item.id);
          const index = pairIndex(side, item.id);
          const paired = index >= 0 && !feedback;
          return (
            // A small pop when a tile joins a pair, so pairing reads as an event, not a recolour.
            <motion.div
              key={item.id}
              className="flex"
              animate={paired ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <ChoiceTile
                state={state}
                disabled={disabled || paired}
                onClick={() => tap(side, item.id, item.text, language)}
                data-pair-item={`${side}:${item.id}`}
                data-pair={paired ? index + 1 : undefined}
                aria-label={paired ? `${item.text} (pair ${index + 1})` : item.text}
                lang={language ?? undefined}
                // Same card as the other exercises (min-h-14, 16px text).
                className="min-h-14 text-base"
                wrapperClassName="w-full"
              >
                {item.text}
                {paired && (
                  <span aria-hidden className="absolute top-1 right-2 text-xs font-extrabold opacity-70">
                    {index + 1}
                  </span>
                )}
              </ChoiceTile>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    // Two equal columns centred at the lesson's content width; `min-w-0` lets long words wrap
    // instead of pushing the page sideways on a 375px phone.
    <div className="mx-auto grid w-full max-w-[460px] grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-5 [&>*]:min-w-0">
      {column("left")}
      {column("right")}
    </div>
  );
}
