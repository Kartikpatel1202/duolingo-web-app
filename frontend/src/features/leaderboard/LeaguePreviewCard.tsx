"use client";

import Image from "next/image";
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
        <h2 id="league-preview-title" className="text-heading font-extrabold text-ink-soft">
          {data?.league.name ?? "League"}
        </h2>
        <Link href="/leaderboard" className="focus-ring rounded text-label font-black uppercase text-sky-500 hover:text-sky-600">
          View league
        </Link>
      </div>
      {data && me?.xp === 0 ? (
        // Nothing earned yet this week: invite the learner in instead of showing a table.
        <div className="flex items-center gap-3">
          {/* Artwork cut from the reference: Duo asleep on the ground, with "Zz". */}
          <Image src="/brand/path/duo-sleeping.png" alt="" aria-hidden width={88} height={57} unoptimized className="shrink-0" />
          <p className="text-sm leading-snug font-semibold text-muted">
            Complete a lesson to join this week&apos;s leaderboard and compete against other learners.
          </p>
        </div>
      ) : data ? (
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
