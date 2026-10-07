"use client";

import { TimerOff, XCircle } from "lucide-react";
import { motion } from "motion/react";

import { Button, ButtonLink } from "@/components/ui";

import type { ChallengeEnd } from "../state/lessonMachine";

interface ChallengeFailedProps {
  reason: ChallengeEnd;
  onTryAgain: () => void;
}

/** End of a Legendary challenge that was not won. Nothing is awarded; the lesson stays completed. */
export function ChallengeFailed({ reason, onTryAgain }: ChallengeFailedProps) {
  const timeUp = reason === "time_up";
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.span
        initial={{ scale: 0, rotate: 20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 14 }}
        className="flex size-28 items-center justify-center rounded-full bg-grape-100 text-grape-500"
        aria-hidden
      >
        {timeUp ? <TimerOff className="size-14" strokeWidth={2.2} /> : <XCircle className="size-14" strokeWidth={2.2} />}
      </motion.span>
      <div className="space-y-2">
        <h1 className="text-title font-black text-ink">{timeUp ? "Time's up!" : "Too many mistakes"}</h1>
        <p className="font-semibold text-muted">
          Legendary challenges are tough. Your lesson progress is safe — have another go!
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <Button size="lg" fullWidth onClick={onTryAgain} className="bg-grape-500 [--tactile-edge:var(--color-grape-600)]">
          Try again
        </Button>
        <ButtonLink href="/learn" variant="ghost" size="lg" fullWidth>
          Back to path
        </ButtonLink>
      </div>
    </main>
  );
}
