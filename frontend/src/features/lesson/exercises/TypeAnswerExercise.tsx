"use client";

import { useRef } from "react";

import { cn } from "@/lib/cn";

import { PromptBubble } from "./PromptBubble";
import type { ExerciseViewProps } from "./types";

type Props = ExerciseViewProps<"type_answer">;

/** Characters that are awkward to type on an English keyboard, per target language. */
const SPECIAL_CHARACTERS: Record<string, string[]> = {
  es: ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"],
};

const LANGUAGE_NAMES: Record<string, string> = { es: "Spanish", en: "English" };

/** Translate by typing. Enter submits (handled by the lesson); Shift+Enter is ignored. */
export function TypeAnswerExercise({ exercise, answer, onChange, feedback, disabled }: Props) {
  const { content } = exercise;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const text = answer?.text ?? "";
  const languageName = LANGUAGE_NAMES[content.target_language] ?? content.target_language;
  const specials = SPECIAL_CHARACTERS[content.target_language] ?? [];

  function insert(character: string) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? text.length;
    const end = input?.selectionEnd ?? text.length;
    onChange({ type: "type_answer", text: text.slice(0, start) + character + text.slice(end) });
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + character.length, start + character.length);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PromptBubble text={content.source_text} language={content.source_language} />
      <label className="sr-only" htmlFor={`answer-${exercise.id}`}>
        Type your answer in {languageName}
      </label>
      <textarea
        id={`answer-${exercise.id}`}
        ref={inputRef}
        value={text}
        disabled={disabled}
        onChange={(event) => onChange({ type: "type_answer", text: event.target.value })}
        // Enter checks the answer (the lesson listens for it); never insert a newline.
        onKeyDown={(event) => event.key === "Enter" && event.preventDefault()}
        placeholder={`Type in ${languageName}`}
        lang={content.target_language}
        rows={3}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
        className={cn(
          "w-full resize-none rounded-card border-2 bg-mist p-4 text-lg font-semibold text-ink outline-none",
          "placeholder:text-muted focus:border-sky-400 focus:bg-surface",
          feedback
            ? feedback.isCorrect
              ? "border-leaf-400 bg-leaf-50"
              : "border-cherry-400 bg-cherry-50"
            : "border-line",
        )}
      />
      {specials.length > 0 && !disabled && (
        <div role="group" aria-label="Special characters" className="flex flex-wrap gap-2">
          {specials.map((character) => (
            <button
              key={character}
              type="button"
              onClick={() => insert(character)}
              className="tactile focus-ring size-11 rounded-tile border-2 border-line bg-surface text-lg font-bold text-ink [--tactile-edge:var(--color-line)]"
            >
              {character}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
