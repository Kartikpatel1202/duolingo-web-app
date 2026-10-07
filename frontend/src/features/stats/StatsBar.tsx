"use client";

import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui";
import { useCurrentUser } from "@/hooks/api/useLearner";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";

import { AnimatedStat } from "./AnimatedStat";
import { GemsMenu } from "./GemsMenu";
import { HeartsMenu } from "./HeartsMenu";
import { XpMenu } from "./XpMenu";
import { StreakMenu } from "./StreakMenu";
import { GemIcon, HeartIcon, StreakIcon, XpIcon } from "./StatIcons";
import { useHeartRegenRefresh } from "./useHeartRegenRefresh";

interface StatsBarProps {
  className?: string;
  /** Rendered before the stats (e.g. the course switcher in the phone header). */
  leading?: ReactNode;
}

const STAT_TARGET = "focus-ring inline-flex rounded-tile transition-colors hover:bg-mist";

/**
 * Streak · XP · gems · hearts from GET /api/users/me. Each stat opens a card under it on hover (or
 * press): streak and the streak page, XP and the profile, gems and the shop, hearts and a real refill.
 */
export function StatsBar({ className, leading }: StatsBarProps) {
  const { data: user, isError } = useCurrentUser();
  useHeartRegenRefresh(user?.hearts.next_heart_at);

  if (!user) {
    // While loading (or if the request failed) keep the bar's footprint so nothing jumps.
    return (
      <div className={cn("relative flex items-center justify-between gap-2", className)} aria-busy={!isError}>
        {leading}
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-14" />
        ))}
      </div>
    );
  }

  const { streak, hearts } = user;
  return (
    // `relative`: the streak card is positioned against this bar.
    <div className={cn("relative flex items-center justify-between gap-1", className)} aria-label="Your stats" role="group">
      {leading}
      <StreakMenu className={STAT_TARGET} current={streak.current} activeToday={streak.active_today}>
        <AnimatedStat
          value={streak.current}
          icon={<StreakIcon lit={streak.active_today} />}
          tone={streak.active_today ? "ember" : "neutral"}
          label={`${pluralize(streak.current, "day")} streak`}
          onIncrease="pulse"
        />
      </StreakMenu>
      <XpMenu className={STAT_TARGET}>
        <AnimatedStat value={user.total_xp} icon={<XpIcon />} tone="sun" label={`${user.total_xp} total XP`} onIncrease="bounce" />
      </XpMenu>
      <GemsMenu className={STAT_TARGET} gems={user.gems}>
        <AnimatedStat
          value={user.gems}
          icon={<GemIcon />}
          tone="sky"
          label={`${user.gems} gems`}
          onIncrease="bounce"
          onDecrease="shake"
        />
      </GemsMenu>
      <HeartsMenu className={STAT_TARGET}>
        <AnimatedStat
          value={hearts.current}
          icon={<HeartIcon />}
          tone="cherry"
          label={`${hearts.current} of ${hearts.max} hearts`}
          onIncrease="bounce"
          onDecrease="shake"
        />
      </HeartsMenu>
    </div>
  );
}
