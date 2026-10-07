"use client";

import { Check, HeartCrack, X } from "lucide-react";
import { motion } from "motion/react";

import { AudioButton, Button } from "@/components/ui";
import { springSnappy } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { CheckResult } from "@/types/api";

const CORRECT_TITLES = ["Nicely done!", "Great job!", "Excellent!", "You got it!", "Amazing!"];

interface FeedbackBarProps {
  check: CheckResult;
  /** Language of the correct answer, for the speaker button. */
  answerLanguage: string | null;
  onContinue: () => void;
}

/**
 * The verdict: a full-width sheet that slides up over the footer. It is announced to screen
 * readers, and Continue takes focus so Enter moves on.
 */
export function FeedbackBar({ check, answerLanguage, onContinue }: FeedbackBarProps) {
  const correct = check.is_correct;
  const title = correct ? CORRECT_TITLES[check.exercise_id % CORRECT_TITLES.length] : "Not quite";
  // On a correct answer only show the solution when it adds something (an alternative or a note).
  const showSolution = !correct || check.note !== null;

  return (
    <motion.section
      role="status"
      aria-live="assertive"
      aria-label={correct ? "Correct" : "Incorrect"}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={springSnappy}
      className={cn(
        "border-t-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
        correct ? "border-leaf-200 bg-leaf-100" : "border-cherry-100 bg-cherry-50",
      )}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:pt-6">
        <div className="flex items-start gap-4">
          <motion.span
            initial={{ scale: 0.4, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.05 }}
            className={cn(
              "hidden size-16 shrink-0 items-center justify-center rounded-full bg-surface sm:flex",
              correct ? "text-leaf-500" : "text-cherry-500",
            )}
            aria-hidden
          >
            {correct ? <Check className="size-10" strokeWidth={4} /> : <X className="size-10" strokeWidth={4} />}
          </motion.span>
          <div className="min-w-0 space-y-1">
            <h2 className={cn("text-title font-black", correct ? "text-leaf-700" : "text-cherry-700")}>
              {title}
            </h2>
            {showSolution && (
              <div className={cn("space-y-1", correct ? "text-leaf-700" : "text-cherry-700")}>
                <p className="font-extrabold">{correct ? "Another way to say it:" : "Correct solution:"}</p>
                <p className="flex items-center gap-2 text-lg font-semibold">
                  <span lang={answerLanguage ?? undefined}>{check.correct_answer}</span>
                  {answerLanguage && <AudioButton text={check.correct_answer} language={answerLanguage} />}
                </p>
              </div>
            )}
            {check.note && <p className="font-semibold text-sun-700">{check.note}</p>}
            {check.explanation && (
              <p className={cn("font-semibold", correct ? "text-leaf-700" : "text-cherry-700")}>💡 {check.explanation}</p>
            )}
            {check.heart_lost && (
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-1.5 font-extrabold text-cherry-700"
              >
                <HeartCrack className="size-5" aria-hidden /> −1 heart
              </motion.p>
            )}
          </div>
        </div>
        <Button
          variant={correct ? "primary" : "danger"}
          size="lg"
          onClick={onContinue}
          className="w-full sm:w-48"
          autoFocus
        >
          Continue
        </Button>
      </div>
    </motion.section>
  );
}
