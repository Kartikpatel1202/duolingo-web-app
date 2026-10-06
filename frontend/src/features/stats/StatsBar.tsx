"use client";

import { Skeleton } from "@/components/ui";
import { useCurrentUser } from "@/hooks/api/useLearner";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";

import { AnimatedStat } from "./AnimatedStat";
import { GemIcon, HeartIcon, StreakIcon, XpIcon } from "./StatIcons";
import { useHeartRegenRefresh } from "./useHeartRegenRefresh";

interface StatsBarProps {
  className?: string;
}

/** Streak · XP · hearts · gems for the current learner, straight from GET /api/users/me. */
export function StatsBar({ className }: StatsBarProps) {
  const { data: user, isError } = useCurrentUser();
  useHeartRegenRefresh(user?.hearts.next_heart_at);

  if (!user) {
    // While loading (or if the request failed) keep the bar's footprint so nothing jumps.
    return (
      <div className={cn("flex items-center justify-between gap-2", className)} aria-busy={!isError}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-14" />
        ))}
      </div>
    );
  }

  const { streak, hearts } = user;
  return (
    <div className={cn("flex items-center justify-between gap-1", className)} aria-label="Your stats" role="group">
      <AnimatedStat
        value={streak.current}
        icon={<StreakIcon lit={streak.active_today} />}
        tone={streak.active_today ? "ember" : "neutral"}
        label={`${pluralize(streak.current, "day")} streak`}
        onIncrease="pulse"
      />
      <AnimatedStat
        value={user.total_xp}
        icon={<XpIcon />}
        tone="sun"
        label={`${user.total_xp} total XP`}
        onIncrease="bounce"
      />
      <AnimatedStat
        value={hearts.current}
        icon={<HeartIcon />}
        tone="cherry"
        label={`${hearts.current} of ${hearts.max} hearts`}
        onIncrease="bounce"
        onDecrease="shake"
      />
      <AnimatedStat
        value={user.gems}
        icon={<GemIcon />}
        tone="sky"
        label={`${user.gems} gems`}
        onIncrease="bounce"
        onDecrease="shake"
      />
    </div>
  );
}
