"use client";

import { useCallback } from "react";

import { useSpeech } from "@/hooks/useSpeech";
import { cn } from "@/lib/cn";

import { useNumberKeys } from "../hooks/useNumberKeys";
import { ChoiceTile, type TileState } from "./ChoiceTile";
import { PromptBubble } from "./PromptBubble";
import type { ExerciseViewProps } from "./types";

type Props = ExerciseViewProps<"multiple_choice">;

/** Pick one option. Picture cards (with emoji) form a grid; text options stack. */
export function MultipleChoiceExercise({ exercise, answer, onChange, feedback, disabled }: Props) {
  const { content } = exercise;
  const { speak } = useSpeech();
  const selectedId = answer?.option_id ?? null;
  const pictures = content.options.some((option) => option.emoji);

  const select = useCallback(
    (index: number) => {
      const option = content.options[index];
      if (!option || disabled) return;
      onChange({ type: "multiple_choice", option_id: option.id });
      if (content.options_language) speak(option.text, content.options_language);
    },
    [content.options, content.options_language, disabled, onChange, speak],
  );
  useNumberKeys(content.options.length, select, !disabled);

  function stateOf(optionId: string): TileState {
    if (feedback) {
      if (optionId === feedback.reveal.correct_option_id) return "correct";
      return optionId === selectedId ? "incorrect" : "dimmed";
    }
    return optionId === selectedId ? "selected" : "idle";
  }

  return (
    <div className="flex flex-col gap-6">
      {content.source_text && <PromptBubble text={content.source_text} language={content.source_language} />}
      <div
        role="group"
        aria-label="Options"
        className={cn(pictures ? "grid grid-cols-2 gap-3 sm:grid-cols-4" : "flex flex-col gap-3")}
      >
        {content.options.map((option, index) => (
          <ChoiceTile
            key={option.id}
            state={stateOf(option.id)}
            shortcut={pictures ? undefined : index + 1}
            disabled={disabled}
            onClick={() => select(index)}
            data-option-id={option.id}
            lang={content.options_language ?? undefined}
            className={cn(pictures && "h-44 [--tactile-depth:3px] sm:h-52")}
            wrapperClassName={cn(!pictures && "w-full")}
          >
            {pictures ? (
              // Picture card: the picture fills the top, the word and its number key sit below.
              <span className="flex h-full w-full flex-col">
                <span aria-hidden className="flex flex-1 items-center justify-center text-6xl leading-none sm:text-7xl">
                  {option.emoji}
                </span>
                <span className="flex w-full items-center justify-between gap-2 text-base">
                  <span>{option.text}</span>
                  <span
                    aria-hidden
                    className="hidden size-6 shrink-0 items-center justify-center rounded-md border-2 border-line text-xs font-extrabold text-muted md:flex"
                  >
                    {index + 1}
                  </span>
                </span>
              </span>
            ) : (
              <span>{option.text}</span>
            )}
          </ChoiceTile>
        ))}
      </div>
    </div>
  );
}
