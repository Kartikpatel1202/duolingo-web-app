"use client";

import { Target } from "lucide-react";

import { Badge, Card, ProgressBar, Skeleton } from "@/components/ui";
import { useCurrentUser } from "@/hooks/api/useLearner";

/** Today's XP against the learner's goal (both computed by the backend from the XP ledger). */
export function DailyGoalCard() {
  const { data: user } = useCurrentUser();

  return (
    <Card as="section" aria-labelledby="daily-goal-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="daily-goal-title" className="text-heading font-extrabold text-ink">
          Daily goal
        </h2>
        {user?.daily.daily_goal_completed && <Badge tone="leaf">Done!</Badge>}
      </div>
      {user ? (
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-sun-100 text-sun-600" aria-hidden>
            <Target className="size-8" strokeWidth={2.6} />
          </span>
          <div className="flex-1 space-y-2">
            <p className="font-bold text-ink-soft">
              Earn {user.daily.daily_goal} XP today
            </p>
            <div className="flex items-center gap-3">
              <ProgressBar
                value={user.daily.daily_xp / user.daily.daily_goal}
                tone="sun"
                label="Daily goal progress"
              />
              <span className="shrink-0 text-sm font-extrabold tabular-nums text-muted">
                {user.daily.daily_xp}/{user.daily.daily_goal}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <Skeleton className="h-14 w-full" />
      )}
    </Card>
  );
}
