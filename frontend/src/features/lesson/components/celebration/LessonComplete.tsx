"use client";

import { Crown, Target, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { DuoMascot } from "@/components/illustrations";
import { Button } from "@/components/ui";
import { StreakIcon } from "@/features/stats";
import type { CompletionResult } from "@/types/api";

import type { ReviewItem } from "../../state/lessonMachine";
import { useCountUp } from "../../hooks/useCountUp";
import { AchievementUnlocks } from "./AchievementUnlocks";
import { Confetti } from "./Confetti";
import { ProgressSummary } from "./ProgressSummary";
import { ReviewList } from "./ReviewList";
import { RewardTile } from "./RewardTile";

interface LessonCompleteProps {
  result: CompletionResult;
  review: ReviewItem[];
  unlockedSkillTitle: string | null;
  onContinue: () => void;
}

/** The celebration. Every number shown comes from the server's completion response. */
export function LessonComplete({ result, review, unlockedSkillTitle, onContinue }: LessonCompleteProps) {
  const [showReview, setShowReview] = useState(false);
  const xp = useCountUp(result.xp_awarded);
  const legendary = result.mode === "legendary";
  const title = legendary ? "Legendary!" : result.first_completion ? "Lesson complete!" : "Practice complete!";
  const accuracy = Math.round(result.accuracy * 100);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 sm:px-6">
      <Confetti />
      <main className="flex flex-1 flex-col items-center gap-8 py-10 text-center">
        {legendary ? (
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 12 }}
            className="flex size-32 items-center justify-center rounded-full bg-grape-100 text-grape-500"
            aria-hidden
          >
            <Crown className="size-18" fill="currentColor" strokeWidth={1.4} />
          </motion.div>
        ) : (
          // The mascot celebrates a finished lesson (fixed box: no layout shift while it hops).
          <DuoMascot state="lesson-success" animated className="size-32" />
        )}

        <div className="space-y-2">
          <h1 className={legendary ? "text-display font-black text-grape-600" : "text-display font-black text-sun-600"}>
            {title}
          </h1>
          {!result.first_completion && !legendary && (
            <p className="font-bold text-muted">Replays keep your skills sharp — XP is earned the first time.</p>
          )}
        </div>

        <div className="flex w-full gap-3">
          <RewardTile
            order={0}
            tone={legendary ? "grape" : "sun"}
            label="Total XP"
            icon={<Zap className="size-6" fill="currentColor" />}
            value={<span aria-label={`${result.xp_awarded} XP earned`}>+{xp}</span>}
          />
          <RewardTile order={1} tone="leaf" label="Accuracy" icon={<Target className="size-6" strokeWidth={3} />} value={`${accuracy}%`} />
          <RewardTile
            order={2}
            tone="ember"
            label="Streak"
            icon={<StreakIcon lit={result.streak.active_today} />}
            value={<span aria-label={`${result.streak.current} day streak`}>{result.streak.current}</span>}
          />
        </div>

        <ProgressSummary result={result} unlockedSkillTitle={unlockedSkillTitle} />
        <AchievementUnlocks achievements={result.new_achievements} />
        {showReview && <ReviewList items={review} />}
      </main>

      <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t-2 border-line bg-surface py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:flex-row">
        <Button variant="ghost" size="lg" fullWidth onClick={() => setShowReview((shown) => !shown)} aria-expanded={showReview}>
          {showReview ? "Hide review" : "Review lesson"}
        </Button>
        <Button size="lg" fullWidth onClick={onContinue} autoFocus>
          Continue
        </Button>
      </footer>
    </div>
  );
}
