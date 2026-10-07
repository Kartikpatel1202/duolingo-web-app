"use client";

import { ArrowDown, ArrowUp, Clock3 } from "lucide-react";
import { Fragment } from "react";

import { DuoMascot, Trophy, type TrophyTier } from "@/components/illustrations";
import { ButtonLink, Card, ErrorState, Skeleton } from "@/components/ui";
import { useLeaderboard } from "@/hooks/api/useCommunity";
import { cn } from "@/lib/cn";
import { timeUntil } from "@/lib/format";
import type { LeaderboardRow as Row } from "@/types/api";

import { LeaderboardRow } from "./LeaderboardRow";

/** League ladder for the header; the learner's league is the highlighted (unlocked) one. */
const TIERS: { tier: TrophyTier; name: string }[] = [
  { tier: "bronze", name: "Bronze" },
  { tier: "silver", name: "Silver" },
  { tier: "gold", name: "Gold" },
  { tier: "diamond", name: "Diamond" },
];

export function LeaderboardView() {
  const { data, error, refetch, isFetching } = useLeaderboard();

  if (error) return <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />;

  const currentTier = data ? TIERS.findIndex((t) => data.league.name.startsWith(t.name)) : 1;
  const snoozing = data?.current_user.xp === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-center gap-3 border-b-2 border-line pb-6 text-center">
        <div className="flex items-end justify-center gap-3" aria-hidden>
          {TIERS.map(({ tier }, index) => (
            <Trophy
              key={tier}
              tier={tier}
              locked={index > currentTier}
              className={index === currentTier ? "size-20" : "size-12 opacity-80"}
            />
          ))}
        </div>
        <h1 className="text-title font-black text-ink">{data ? data.league.name : "League"}</h1>
        {data ? (
          <p className="flex items-center gap-1.5 font-bold text-muted">
            <Clock3 className="size-4 text-sun-500" strokeWidth={3} aria-hidden />
            {timeUntil(data.resets_at)} left · you&apos;re <strong className="text-ink">#{data.current_user.rank}</strong>{" "}
            with <strong className="text-ink">{data.current_user.xp} XP</strong>
          </p>
        ) : (
          <Skeleton className="h-5 w-60" />
        )}
      </header>

      {snoozing && (
        <section className="flex flex-col items-center gap-3 text-center" aria-label="Not competing yet">
          <DuoMascot state="sleeping" />
          <p className="max-w-xs font-extrabold text-ink-soft">Don&apos;t snooze! Do a lesson to start competing this week.</p>
          <ButtonLink href="/learn">Start a lesson</ButtonLink>
        </section>
      )}

      <Card padding="sm">
        {data ? (
          <ol className="flex flex-col gap-1" aria-label="Leaderboard">
            {data.entries.map((row, index) => (
              <Fragment key={row.user_id}>
                {startsDemotion(data.entries, index) && <ZoneDivider kind="demotion" />}
                <LeaderboardRow row={row} />
                {endsPromotion(data.entries, index) && <ZoneDivider kind="promotion" />}
              </Fragment>
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

function endsPromotion(rows: Row[], index: number): boolean {
  return rows[index]?.zone === "promotion" && rows[index + 1]?.zone !== "promotion";
}

function startsDemotion(rows: Row[], index: number): boolean {
  return rows[index]?.zone === "demotion" && rows[index - 1]?.zone !== "demotion";
}

function ZoneDivider({ kind }: { kind: "promotion" | "demotion" }) {
  const promotion = kind === "promotion";
  const Icon = promotion ? ArrowUp : ArrowDown;
  return (
    <li
      aria-hidden
      className={cn(
        "flex items-center justify-center gap-2 py-2 text-label font-black uppercase",
        promotion ? "text-leaf-600" : "text-cherry-500",
      )}
    >
      <Icon className="size-4" strokeWidth={3} />
      {promotion ? "Promotion zone" : "Demotion zone"}
      <Icon className="size-4" strokeWidth={3} />
    </li>
  );
}
