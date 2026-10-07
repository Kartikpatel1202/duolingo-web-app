"use client";

import { Music, Music2, Sparkles, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

import { DuoMascot } from "@/components/illustrations";
import { ButtonLink, ErrorState } from "@/components/ui";
import { BRAND } from "@/lib/brand";

const TIPS = [
  "{brand} offers lessons for beginner, intermediate and advanced learners!",
  "A few minutes a day beats one long session. Keep your streak going!",
  "Mistakes are how you learn: every exercise you miss comes back later.",
];

/**
 * Shown from the moment a lesson is opened until its first exercise is ready: Duo on his base
 * with a few notes drifting up, "LOADING…" and a tip. Same screen while the lesson content loads
 * and while the attempt is created, so there is no flicker between the two.
 */
export function LessonLoading({ lessonId, tip: customTip }: { lessonId: number; tip?: string }) {
  const reduceMotion = useReducedMotion();
  const tip = customTip ?? (TIPS[lessonId % TIPS.length] ?? TIPS[0] ?? "").replace("{brand}", BRAND.name);
  return (
    <main
      aria-busy="true"
      aria-label="Loading lesson"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface px-6 text-center"
    >
      <div className="relative">
        <DuoMascot state="loading" animated className="h-[132px] w-[118px]" />
        {[
          { Icon: Music2, className: "-top-5 right-[-34px] size-7", delay: 0 },
          { Icon: Music, className: "-top-11 right-[-14px] size-5", delay: 0.6 },
        ].map(({ Icon, className, delay }) => (
          <motion.span
            key={className}
            aria-hidden
            className={`absolute text-sky-400 ${className}`}
            animate={reduceMotion ? undefined : { y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, delay, ease: "easeInOut" }}
          >
            <Icon className="size-full" strokeWidth={3} />
          </motion.span>
        ))}
      </div>
      <p className="text-[15px] font-black tracking-wide text-muted uppercase">Loading...</p>
      <p className="max-w-[270px] font-semibold text-ink-soft">{tip}</p>
    </main>
  );
}

interface LessonErrorProps {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
}

/** A lesson that can't be played (locked, missing, server down) — friendly, with a way out. */
export function LessonError({ error, onRetry, retrying }: LessonErrorProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 sm:px-6">
      <div className="py-4">
        <Link href="/learn" aria-label="Back to path" className="focus-ring inline-flex rounded-tile p-1 text-muted hover:text-ink-soft">
          <X className="size-7" strokeWidth={3} aria-hidden />
        </Link>
      </div>
      <main className="flex flex-1 flex-col items-center justify-center gap-6">
        <ErrorState error={error} onRetry={onRetry} retrying={retrying} className="w-full" />
        <ButtonLink href="/learn" variant="ghost" size="lg" fullWidth>
          Back to path
        </ButtonLink>
      </main>
    </div>
  );
}

/** Shown while the server records the completion (usually a split second). */
export function LessonSaving() {
  return (
    <main
      aria-busy="true"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <motion.span
        animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="flex size-20 items-center justify-center rounded-full bg-sun-100 text-sun-500"
        aria-hidden
      >
        <Sparkles className="size-10" strokeWidth={2.4} />
      </motion.span>
      <p className="text-heading font-extrabold text-ink">Saving your progress…</p>
    </main>
  );
}
