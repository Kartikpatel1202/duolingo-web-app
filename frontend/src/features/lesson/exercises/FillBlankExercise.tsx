"use client";

import { useCallback, useMemo } from "react";

import { cn } from "@/lib/cn";

import { useNumberKeys } from "../hooks/useNumberKeys";
import { ChoiceTile, type TileState } from "./ChoiceTile";
import type { ExerciseViewProps } from "./types";

type Props = ExerciseViewProps<"fill_blank">;

const same = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

/** Complete the sentence. With options it's tap-to-fill; without, the blank is a text field. */
export function FillBlankExercise({ exercise, answer, onChange, feedback, disabled }: Props) {
  const { content } = exercise;
  const options = useMemo(() => content.options ?? [], [content.options]);
  const text = answer?.text ?? "";

  const pick = useCallback(
    (index: number) => {
      const option = options[index];
      if (option !== undefined && !disabled) onChange({ type: "fill_blank", text: option });
    },
    [options, disabled, onChange],
  );
  useNumberKeys(options.length, pick, !disabled && options.length > 0);

  function stateOf(option: string): TileState {
    if (feedback) {
      if (same(option, feedback.reveal.text)) return "correct";
      return same(option, text) ? "incorrect" : "dimmed";
    }
    return same(option, text) ? "selected" : "idle";
  }

  const blankTone = feedback
    ? feedback.isCorrect
      ? "border-leaf-400 text-leaf-700"
      : "border-cherry-400 text-cherry-700"
    : text
      ? "border-sky-400 text-sky-700"
      : "border-line-strong";

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <p lang={content.language ?? undefined} className="flex flex-wrap items-baseline gap-x-2 gap-y-3 text-2xl font-bold text-ink">
          {content.before && <span>{content.before}</span>}
          {options.length > 0 ? (
            <span
              aria-label={text ? `Blank: ${text}` : "Blank"}
              className={cn("inline-block min-w-24 border-b-[3px] px-2 text-center", blankTone)}
            >
              {text || " "}
            </span>
          ) : (
            <input
              aria-label="Missing word"
              value={text}
              disabled={disabled}
              onChange={(event) => onChange({ type: "fill_blank", text: event.target.value })}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              lang={content.language ?? undefined}
              className={cn("w-36 border-b-[3px] bg-transparent px-2 text-center outline-none", blankTone)}
            />
          )}
          {content.after && (
            // Punctuation hugs the blank ("alta." not "alta .").
            <span className={cn(/^[.,!?;:]/.test(content.after) && "-ml-2")}>{content.after}</span>
          )}
        </p>
        {content.translation && <p className="font-semibold text-muted">“{content.translation}”</p>}
      </div>

      {options.length > 0 && (
        <div role="group" aria-label="Options" className="flex flex-wrap justify-center gap-3">
          {options.map((option, index) => (
            <ChoiceTile
              key={option}
              state={stateOf(option)}
              shortcut={index + 1}
              disabled={disabled}
              onClick={() => pick(index)}
              lang={content.language ?? undefined}
              className="min-w-28"
            >
              {option}
            </ChoiceTile>
          ))}
        </div>
      )}
    </div>
  );
}
