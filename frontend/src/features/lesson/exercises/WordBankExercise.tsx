"use client";

import { LayoutGroup, motion } from "motion/react";

import { useSpeech } from "@/hooks/useSpeech";
import { cn } from "@/lib/cn";

import { TILE_BASE } from "./ChoiceTile";
import { PromptBubble } from "./PromptBubble";
import type { ExerciseViewProps } from "./types";

type Props = ExerciseViewProps<"word_bank">;

const TILE = cn(
  TILE_BASE,
  "min-h-12 border-line bg-surface px-3.5 py-2 text-lg text-ink [--tactile-edge:var(--color-line)]",
);

/**
 * Build the sentence by tapping tiles. The answer is the ordered list of tile *ids* — two tiles
 * with the same word stay distinguishable. Tiles fly between the bank and the answer line
 * (shared layout animation); used tiles leave a placeholder so the bank never reflows.
 */
export function WordBankExercise({ exercise, answer, onChange, feedback, disabled }: Props) {
  const { content } = exercise;
  const { speak } = useSpeech();
  const chosen = answer?.tile_ids ?? [];
  const byId = new Map(content.tiles.map((tile) => [tile.id, tile]));

  function add(tileId: string) {
    if (disabled) return;
    onChange({ type: "word_bank", tile_ids: [...chosen, tileId] });
    const tile = byId.get(tileId);
    if (tile && content.tiles_language) speak(tile.text, content.tiles_language);
  }

  function remove(tileId: string) {
    if (disabled) return;
    onChange({ type: "word_bank", tile_ids: chosen.filter((id) => id !== tileId) });
  }

  return (
    <LayoutGroup id={`word-bank-${exercise.id}`}>
      <div className="flex flex-col gap-6">
        <PromptBubble text={content.source_text} language={content.source_language} />

        <div
          aria-label="Your answer"
          role="group"
          className={cn(
            "flex min-h-[120px] flex-wrap content-start gap-2 border-y-2 py-3",
            "bg-[linear-gradient(transparent_57px,var(--color-line)_57px,var(--color-line)_59px,transparent_59px)]",
            feedback ? (feedback.isCorrect ? "border-leaf-200" : "border-cherry-100") : "border-line",
          )}
        >
          {chosen.map((tileId) => {
            const tile = byId.get(tileId);
            if (!tile) return null;
            return (
              <motion.span layoutId={tile.id} key={tile.id} className="inline-flex">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove(tile.id)}
                  data-tile-id={tile.id}
                  aria-label={`Remove ${tile.text}`}
                  lang={content.tiles_language ?? undefined}
                  className={TILE}
                >
                  {tile.text}
                </button>
              </motion.span>
            );
          })}
        </div>

        <div role="group" aria-label="Word bank" className="flex flex-wrap justify-center gap-2">
          {content.tiles.map((tile) =>
            chosen.includes(tile.id) ? (
              // Placeholder keeps the bank layout stable while the tile is in the answer.
              <span key={tile.id} aria-hidden className="min-h-12 rounded-tile bg-line px-3.5 py-2 text-lg font-bold text-transparent">
                {tile.text}
              </span>
            ) : (
              <motion.span layoutId={tile.id} key={tile.id} className="inline-flex">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => add(tile.id)}
                  data-tile-id={tile.id}
                  lang={content.tiles_language ?? undefined}
                  className={TILE}
                >
                  {tile.text}
                </button>
              </motion.span>
            ),
          )}
        </div>
      </div>
    </LayoutGroup>
  );
}
