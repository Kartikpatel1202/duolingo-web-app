"use client";

import { Check } from "lucide-react";

import { Card, ErrorState, Skeleton, useToast } from "@/components/ui";
import { useCurrentUser, useUpdateDailyGoal } from "@/hooks/api/useLearner";
import { friendlyError } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import type { DailyGoalOption } from "@/types/api";

/** Labels for the goal options the API accepts (the option values come from the contract). */
const GOALS: { xp: DailyGoalOption; name: string }[] = [
  { xp: 10, name: "Casual" },
  { xp: 20, name: "Regular" },
  { xp: 30, name: "Serious" },
  { xp: 50, name: "Intense" },
];

export function SettingsView() {
  const { data: user, error, refetch, isFetching } = useCurrentUser();
  const updateGoal = useUpdateDailyGoal();
  const toast = useToast();

  if (error) return <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />;

  function choose(xp: DailyGoalOption) {
    updateGoal.mutate(xp, {
      onSuccess: () => toast.show({ tone: "success", title: `Daily goal set to ${xp} XP` }),
      onError: (mutationError) => toast.show({ tone: "error", ...friendlyError(mutationError) }),
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-title font-black text-ink">Settings</h1>
      <Card as="section" aria-labelledby="goal-title" className="space-y-4">
        <div>
          <h2 id="goal-title" className="text-heading font-extrabold text-ink">
            Daily goal
          </h2>
          <p className="font-semibold text-muted">How much do you want to practise each day?</p>
        </div>
        {user ? (
          <div role="radiogroup" aria-labelledby="goal-title" className="grid gap-3 sm:grid-cols-2">
            {GOALS.map((goal) => {
              const selected = user.daily.daily_goal === goal.xp;
              return (
                <button
                  key={goal.xp}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={updateGoal.isPending}
                  onClick={() => choose(goal.xp)}
                  className={cn(
                    "tactile focus-ring flex items-center justify-between rounded-tile border-2 px-4 py-4 text-left",
                    selected
                      ? "border-sky-400 bg-sky-50 [--tactile-edge:var(--color-sky-400)]"
                      : "border-line bg-white [--tactile-edge:var(--color-line)]",
                  )}
                >
                  <span>
                    <span className={cn("block font-extrabold", selected ? "text-sky-700" : "text-ink")}>
                      {goal.name}
                    </span>
                    <span className="text-sm font-bold text-muted">{goal.xp} XP per day</span>
                  </span>
                  {selected && <Check className="size-6 text-sky-500" strokeWidth={3.5} aria-hidden />}
                </button>
              );
            })}
          </div>
        ) : (
          <Skeleton className="h-40 w-full" />
        )}
      </Card>
      <Card className="text-center font-bold text-muted">More settings are on the way.</Card>
    </div>
  );
}
