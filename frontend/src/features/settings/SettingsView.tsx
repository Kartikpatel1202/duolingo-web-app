"use client";

import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

import { Card, ErrorState, Skeleton, useToast } from "@/components/ui";
import { useCurrentUser, useUpdateDailyGoal } from "@/hooks/api/useLearner";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useTheme } from "@/hooks/useTheme";
import { friendlyError } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import type { ThemePreference } from "@/lib/theme";

import { AccountSettings } from "./AccountSettings";
import { DAILY_GOALS } from "./dailyGoals";
import type { DailyGoalOption } from "@/types/api";


const THEMES: { value: ThemePreference; name: string; icon: LucideIcon }[] = [
  { value: "light", name: "Light", icon: Sun },
  { value: "dark", name: "Dark", icon: Moon },
  { value: "system", name: "System", icon: Monitor },
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
            {DAILY_GOALS.map((goal) => {
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
                      : "border-line bg-surface [--tactile-edge:var(--color-line)]",
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
      <AppearanceSettings />
      <SoundSettings />
      <AccountSettings />
    </div>
  );
}

function AppearanceSettings() {
  const { preference, setTheme } = useTheme();
  return (
    <Card as="section" aria-labelledby="appearance-title" className="space-y-4">
      <div>
        <h2 id="appearance-title" className="text-heading font-extrabold text-ink">
          Appearance
        </h2>
        <p className="font-semibold text-muted">System follows your device setting.</p>
      </div>
      <div role="radiogroup" aria-labelledby="appearance-title" className="grid grid-cols-3 gap-3">
        {THEMES.map(({ value, name, icon: Icon }) => {
          const selected = preference === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(value)}
              className={cn(
                "tactile focus-ring flex flex-col items-center gap-2 rounded-tile border-2 px-2 py-4 font-extrabold",
                selected
                  ? "border-sky-400 bg-sky-50 text-sky-700 [--tactile-edge:var(--color-sky-400)]"
                  : "border-line bg-surface text-ink [--tactile-edge:var(--color-line)]",
              )}
            >
              <Icon className="size-6" strokeWidth={2.6} aria-hidden />
              {name}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function SoundSettings() {
  const { enabled, setEnabled } = useSoundEffects();
  return (
    <Card as="section" className="flex items-center justify-between gap-4">
      <div>
        <h2 id="sound-title" className="text-heading font-extrabold text-ink">
          Sound effects
        </h2>
        <p className="font-semibold text-muted">Chimes for correct answers and finished lessons.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby="sound-title"
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "focus-ring relative h-8 w-14 shrink-0 rounded-full transition-colors",
          enabled ? "bg-sky-500" : "bg-line-strong",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform",
            enabled && "translate-x-6",
          )}
        />
      </button>
    </Card>
  );
}
