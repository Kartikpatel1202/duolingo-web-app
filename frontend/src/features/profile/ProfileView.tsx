"use client";

import { Plus, Settings } from "lucide-react";
import Link from "next/link";

import { CourseFlag } from "@/components/icons/CourseFlag";
import { Trophy } from "@/components/illustrations";
import { Avatar, ErrorState, Skeleton, StatCard, TONE_SOFT, toTone } from "@/components/ui";
import { StreakIcon, XpIcon } from "@/features/stats";
import { useProfile } from "@/hooks/api/useCommunity";
import { cn } from "@/lib/cn";
import { formatMonthYear } from "@/lib/format";

import { AchievementGrid } from "./AchievementGrid";

const FRIEND_SLOTS = 5;

/** Profile: identity, overview stats, friend-streak slots and the achievement badge grid. */
export function ProfileView() {
  const { data: profile, error, refetch, isFetching } = useProfile();

  if (error) return <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />;
  if (!profile) return <ProfileSkeleton />;

  const { user, stats } = profile;
  const earned = profile.achievements.filter((a) => a.earned_at !== null).length;

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-panel border-2 border-line">
        <div className={cn("relative flex h-40 items-end justify-center pb-4", TONE_SOFT[toTone(user.avatar_color)])}>
          <Avatar name={user.display_name} color={user.avatar_color} size="xl" />
          <Link
            href="/settings"
            aria-label="Settings"
            className="focus-ring absolute top-3 right-3 rounded-tile p-2 text-ink-soft hover:bg-surface/40"
          >
            <Settings className="size-6" strokeWidth={2.6} aria-hidden />
          </Link>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <h1 className="text-display font-black text-ink">{user.display_name}</h1>
            <p className="font-bold text-muted">
              @{user.username} · Joined {formatMonthYear(user.joined_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 font-bold text-ink-soft">
            <CourseFlag language="es" /> 1 course
          </div>
        </div>
      </header>

      <section aria-labelledby="overview-title" className="space-y-4">
        <h2 id="overview-title" className="text-heading font-extrabold text-ink">
          Overview
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<StreakIcon className="size-8" lit={stats.current_streak > 0} />} tone="ember" value={stats.current_streak} label="Day streak" />
          <StatCard icon={<XpIcon className="size-8" />} tone="sun" value={stats.total_xp} label="Total XP" />
          <StatCard
            icon={<Trophy tier="silver" className="size-9" />}
            tone="sky"
            value={stats.league_name.replace(" League", "")}
            label={`League · #${stats.league_rank}`}
          />
          <StatCard
            icon={<Trophy tier="gold" className="size-9" />}
            tone="sun"
            value={stats.top_finishes}
            label="Top 3 finishes"
          />
          <StatCard icon={<StreakIcon className="size-8" />} tone="ember" value={stats.longest_streak} label="Longest streak" />
          <StatCard icon={<XpIcon className="size-8" />} tone="leaf" value={stats.lessons_completed} label="Lessons done" />
        </div>
      </section>

      <section aria-labelledby="friend-streaks-title" className="space-y-3">
        <h2 id="friend-streaks-title" className="text-heading font-extrabold text-ink">
          Friend streaks
        </h2>
        <div className="flex justify-between" aria-label="Friend streaks are coming soon">
          {Array.from({ length: FRIEND_SLOTS }, (_, i) => (
            <span key={i} aria-hidden className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-line-strong text-muted">
              <Plus className="size-6" strokeWidth={3} />
            </span>
          ))}
        </div>
      </section>

      <section aria-labelledby="achievements-title" className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 id="achievements-title" className="text-heading font-extrabold text-ink">
            Achievements
          </h2>
          <span className="text-sm font-extrabold text-muted">
            {earned} of {profile.achievements.length}
          </span>
        </div>
        <AchievementGrid achievements={profile.achievements} />
      </section>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <Skeleton className="h-64 w-full rounded-panel" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
