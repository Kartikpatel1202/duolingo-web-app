"use client";

import { Trophy } from "lucide-react";

import { Card, ErrorState, Skeleton } from "@/components/ui";
import { useLeaderboard } from "@/hooks/api/useCommunity";
import { timeUntil } from "@/lib/format";

import { LeaderboardRow } from "./LeaderboardRow";

export function LeaderboardView() {
  const { data, error, refetch, isFetching } = useLeaderboard();

  if (error) return <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-sun-100 text-sun-500" aria-hidden>
          <Trophy className="size-11" fill="currentColor" strokeWidth={1.6} />
        </span>
        <h1 className="text-title font-black text-ink">Weekly league</h1>
        <p className="font-bold text-muted">
          {data ? (
            <>
              You&apos;re <strong className="text-ink">#{data.current_user.rank}</strong> with{" "}
              <strong className="text-ink">{data.current_user.xp} XP</strong> · resets in {timeUntil(data.resets_at)}
            </>
          ) : (
            <Skeleton className="mx-auto h-5 w-60" />
          )}
        </p>
      </header>
      <Card padding="sm">
        {data ? (
          <ol className="flex flex-col gap-1" aria-label="Leaderboard">
            {data.entries.map((row) => (
              <LeaderboardRow key={row.user_id} row={row} />
            ))}
          </ol>
        ) : (
          <div className="flex flex-col gap-3 p-2" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
