"use client";

import { BookOpenCheck, Crown, Medal } from "lucide-react";

import { Avatar, Card, ErrorState, Skeleton, StatCard } from "@/components/ui";
import { StreakIcon, XpIcon } from "@/features/stats";
import { useProfile } from "@/hooks/api/useCommunity";
import { formatMonthYear } from "@/lib/format";

import { AchievementCard } from "./AchievementCard";

export function ProfileView() {
  const { data: profile, error, refetch, isFetching } = useProfile();

  if (error) return <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />;
  if (!profile) return <ProfileSkeleton />;

  const { user, stats } = profile;
  const earned = profile.achievements.filter((a) => a.earned_at !== null).length;

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-5 border-b-2 border-line pb-8">
        <Avatar name={user.display_name} color={user.avatar_color} size="xl" />
        <div className="min-w-0 space-y-1">
          <h1 className="text-display font-black text-ink">{user.display_name}</h1>
          <p className="font-bold text-muted">@{user.username}</p>
          <p className="font-bold text-muted">Joined {formatMonthYear(user.joined_at)}</p>
        </div>
      </header>

      <section aria-labelledby="stats-title" className="space-y-4">
        <h2 id="stats-title" className="text-heading font-extrabold text-ink">
          Statistics
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<StreakIcon className="size-8" />} tone="ember" value={stats.current_streak} label="Day streak" />
          <StatCard icon={<XpIcon className="size-8" />} tone="sun" value={stats.total_xp} label="Total XP" />
          <StatCard
            icon={<BookOpenCheck className="size-8" strokeWidth={2.4} />}
            tone="leaf"
            value={stats.lessons_completed}
            label="Lessons completed"
          />
          <StatCard
            icon={<Crown className="size-8" fill="currentColor" strokeWidth={1.6} />}
            tone="sun"
            value={stats.skills_completed}
            label="Skills mastered"
          />
          <StatCard
            icon={<Medal className="size-8" strokeWidth={2.4} />}
            tone="grape"
            value={`#${stats.league_rank}`}
            label={`League · ${stats.weekly_xp} XP this week`}
            className="col-span-2"
          />
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
        <Card padding="sm">
          <ul>
            {profile.achievements.map((achievement) => (
              <AchievementCard key={achievement.code} achievement={achievement} />
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="flex items-center gap-5">
        <Skeleton shape="circle" className="size-24" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
