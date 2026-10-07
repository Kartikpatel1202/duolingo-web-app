"use client";

import { Crown, Timer } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/cn";

import { useCountdown } from "../hooks/useCountdown";

/** Seconds below which the clock turns red. */
const HURRY_SECONDS = 20;

interface ChallengeStatusProps {
  expiresAt: string | null;
  mistakesRemaining: number | null;
  /** Called once when the on-screen clock reaches zero. */
  onTimeUp: () => void;
}

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Legendary header widget: countdown + remaining mistakes (replaces the hearts). */
export function ChallengeStatus({ expiresAt, mistakesRemaining, onTimeUp }: ChallengeStatusProps) {
  const secondsLeft = useCountdown(expiresAt);

  useEffect(() => {
    if (secondsLeft === 0) onTimeUp();
  }, [secondsLeft, onTimeUp]);

  return (
    <div className="flex items-center gap-2">
      {secondsLeft !== null && (
        <span
          role="timer"
          aria-label={`${secondsLeft} seconds left`}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-tile px-2.5 font-extrabold tabular-nums",
            secondsLeft <= HURRY_SECONDS ? "bg-cherry-50 text-cherry-500" : "bg-grape-50 text-grape-600",
          )}
        >
          <Timer className="size-5" strokeWidth={2.8} aria-hidden />
          {formatClock(secondsLeft)}
        </span>
      )}
      {mistakesRemaining !== null && (
        <span
          role="img"
          aria-label={`${mistakesRemaining} mistakes left`}
          className="inline-flex h-10 items-center gap-1 rounded-tile bg-sun-50 px-2.5 font-extrabold text-sun-700 tabular-nums"
        >
          <Crown className="size-5 text-sun-500" fill="currentColor" aria-hidden />
          {mistakesRemaining}
        </span>
      )}
    </div>
  );
}
