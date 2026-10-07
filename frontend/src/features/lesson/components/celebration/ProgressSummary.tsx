"use client";

import { LockOpen, Target } from "lucide-react";
import { motion } from "motion/react";

import { Badge, ProgressBar } from "@/components/ui";
import type { CompletionResult } from "@/types/api";

interface ProgressSummaryProps {
  result: CompletionResult;
  unlockedSkillTitle: string | null;
}

/** Daily goal and skill progress after the lesson (all numbers come from the completion response). */
export function ProgressSummary({ result, unlockedSkillTitle }: ProgressSummaryProps) {
  const { daily, skill_progress: skill } = result;
  // "Just reached" = this lesson's XP pushed today's total over the goal.
  const goalJustReached = daily.daily_goal_completed && daily.daily_xp - result.xp_awarded < daily.daily_goal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="w-full space-y-4 rounded-card border-2 border-line p-4 text-left"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-extrabold text-ink">
            <Target className="size-5 text-sun-500" strokeWidth={2.8} aria-hidden /> Daily goal
          </span>
          {goalJustReached ? (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 1.4 }}>
              <Badge tone="sun">Daily goal complete!</Badge>
            </motion.span>
          ) : (
            <span className="text-sm font-extrabold tabular-nums text-muted">
              {daily.daily_xp} / {daily.daily_goal} XP
            </span>
          )}
        </div>
        <ProgressBar value={daily.daily_xp / daily.daily_goal} tone="sun" label="Daily goal progress" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-ink">Skill progress</span>
          <span className="text-sm font-extrabold tabular-nums text-muted">
            {skill.lessons_completed} / {skill.total_lessons} lessons
          </span>
        </div>
        <ProgressBar value={skill.progress} tone={skill.status === "completed" ? "sun" : "leaf"} label="Skill progress" />
      </div>

      {unlockedSkillTitle !== null && (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6, type: "spring" }}
          className="flex items-center gap-2 rounded-tile bg-leaf-50 px-3 py-2 font-extrabold text-leaf-700"
        >
          <LockOpen className="size-5" strokeWidth={2.8} aria-hidden />
          New skill unlocked: {unlockedSkillTitle}
        </motion.p>
      )}
    </motion.div>
  );
}
