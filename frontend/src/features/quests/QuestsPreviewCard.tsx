"use client";

import Image from "next/image";
import Link from "next/link";

import { Chest } from "@/components/illustrations";
import { Card, ProgressBar, Skeleton } from "@/components/ui";
import { XpIcon } from "@/features/stats";
import { useQuests } from "@/hooks/api/useEngagement";

/** Right-rail summary of today's quests (same cache as the Quests page; claiming happens there). */
export function QuestsPreviewCard() {
  const { data } = useQuests();

  return (
    <Card as="section" aria-labelledby="quests-preview-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="quests-preview-title" className="text-heading font-extrabold text-ink">
          Daily Quests
        </h2>
        <Link href="/quests" className="focus-ring rounded text-label font-black uppercase text-sky-500 hover:text-sky-600">
          View all
        </Link>
      </div>
      {data ? (
        <ul className="flex flex-col gap-4">
          {data.quests.map((quest) => (
            <li key={quest.code} className="flex items-center gap-3">
              <XpIcon className="size-9 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="font-extrabold text-ink">{quest.title}</p>
                <div className="flex items-center gap-2">
                  <ProgressBar
                    value={quest.progress / quest.target}
                    tone={quest.completed ? "leaf" : "sun"}
                    label={`${quest.title}: ${quest.progress} of ${quest.target}`}
                  />
                  <span className="shrink-0 text-sm font-extrabold tabular-nums text-muted">
                    {quest.progress} / {quest.target}
                  </span>
                </div>
              </div>
              {quest.claimed || quest.completed ? (
                <Chest state={quest.claimed ? "claimed" : "available"} className="size-10 shrink-0" />
              ) : (
                // The locked chest from the reference (cut from the screenshot, not redrawn).
                <Image
                  src="/brand/path/quest-chest-locked.png"
                  alt=""
                  aria-hidden
                  width={44}
                  height={38}
                  unoptimized
                  className="shrink-0"
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Skeleton className="h-40 w-full" />
      )}
    </Card>
  );
}
