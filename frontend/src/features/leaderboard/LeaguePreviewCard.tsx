"use client";

import Link from "next/link";

import { Card, Skeleton } from "@/components/ui";
import { useLeaderboard } from "@/hooks/api/useCommunity";

import { LeaderboardRow } from "./LeaderboardRow";

const PREVIEW_ROWS = 3;

/** Right-rail teaser: top of the league + the learner's own rank. Shares the page's cache. */
export function LeaguePreviewCard() {
  const { data } = useLeaderboard();
  const me = data?.entries.find((row) => row.is_current_user);
  const top = data?.entries.slice(0, PREVIEW_ROWS) ?? [];
  const showMe = me && me.rank > PREVIEW_ROWS;

  return (
    <Card as="section" aria-labelledby="league-preview-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="league-preview-title" className="text-heading font-extrabold text-ink">
          Weekly league
        </h2>
        <Link href="/leaderboard" className="focus-ring rounded text-label font-black uppercase text-sky-500 hover:text-sky-600">
          View all
        </Link>
      </div>
      {data ? (
        <ol className="flex flex-col gap-1">
          {top.map((row) => (
            <LeaderboardRow key={row.user_id} row={row} compact />
          ))}
          {showMe && <LeaderboardRow row={me} compact />}
        </ol>
      ) : (
        <Skeleton className="h-36 w-full" />
      )}
    </Card>
  );
}
