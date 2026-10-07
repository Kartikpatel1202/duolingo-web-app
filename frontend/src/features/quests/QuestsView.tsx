"use client";

import { Clock3, UserPlus } from "lucide-react";
import { motion } from "motion/react";

import { Chest, DuoMascot } from "@/components/illustrations";
import { Button, ErrorState, ProgressBar, Skeleton, useToast } from "@/components/ui";
import { GemIcon } from "@/features/stats";
import { useClaimQuest, useQuests } from "@/hooks/api/useEngagement";
import { friendlyError } from "@/lib/api/errors";
import { timeUntil } from "@/lib/format";
import type { Quest } from "@/types/api";

/** Daily quests with real progress (computed by the server) and claimable chests. */
export function QuestsView() {
  const { data, error, refetch, isFetching } = useQuests();
  const claim = useClaimQuest();
  const toast = useToast();

  if (error) return <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />;

  function claimQuest(quest: Quest) {
    claim.mutate(quest.code, {
      onSuccess: (result) => toast.show({ tone: "success", title: `+${result.gems_awarded} gems!`, description: "Quest chest opened." }),
      onError: (claimError) => toast.show({ tone: "error", ...friendlyError(claimError) }),
    });
  }

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-panel bg-grape-500 px-5 py-6 text-white">
        <h1 className="text-title font-black">Quests</h1>
        <p className="max-w-[60%] font-bold text-white/90">Complete quests to earn rewards!</p>
        <DuoMascot state="celebrating" className="absolute -right-1 -bottom-3 size-32" />
      </header>

      <section aria-labelledby="daily-quests-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="daily-quests-title" className="text-label font-black uppercase text-muted">
            Daily quests
          </h2>
          {data && (
            <span className="flex items-center gap-1 text-sm font-extrabold text-sun-700">
              <Clock3 className="size-4" strokeWidth={3} aria-hidden /> {timeUntil(data.resets_at)}
            </span>
          )}
        </div>
        <ul className="divide-y-2 divide-line rounded-card border-2 border-line">
          {data
            ? data.quests.map((quest) => (
                <QuestRow
                  key={quest.code}
                  quest={quest}
                  claiming={claim.isPending && claim.variables === quest.code}
                  onClaim={() => claimQuest(quest)}
                />
              ))
            : Array.from({ length: 3 }, (_, i) => (
                <li key={i} className="p-4">
                  <Skeleton className="h-12 w-full" />
                </li>
              ))}
        </ul>
      </section>

      {data && (
        <section aria-labelledby="upcoming-title" className="space-y-3">
          <h2 id="upcoming-title" className="text-label font-black uppercase text-muted">
            Upcoming
          </h2>
          <ul className="divide-y-2 divide-line rounded-card border-2 border-dashed border-line opacity-80">
            {["Weekly challenge", "Monthly badge"].map((title) => (
              <li key={title} className="flex items-center gap-4 p-4">
                <div className="flex-1 space-y-2">
                  <p className="font-extrabold text-muted">Revealed in {timeUntil(data.next_week_at)}</p>
                  <ProgressBar value={0} tone="neutral" label={`${title} (not revealed yet)`} />
                </div>
                <Chest state="locked" className="size-12" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="friends-quest-title" className="space-y-3">
        <h2 id="friends-quest-title" className="text-label font-black uppercase text-muted">
          Friends quest
        </h2>
        <div className="flex items-center gap-4 rounded-card border-2 border-dashed border-line p-4">
          <UserPlus className="size-10 text-sky-500" aria-hidden />
          <p className="flex-1 font-bold text-ink-soft">Team up with a friend to complete quests together — coming soon.</p>
        </div>
      </section>
    </div>
  );
}

function QuestRow({ quest, claiming, onClaim }: { quest: Quest; claiming: boolean; onClaim: () => void }) {
  return (
    <li className="flex items-center gap-4 p-4" data-quest={quest.code}>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-extrabold text-ink">{quest.title}</p>
        <div className="flex items-center gap-3">
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
      {quest.completed && !quest.claimed ? (
        <Button size="sm" variant="reward" onClick={onClaim} loading={claiming} aria-label={`Claim ${quest.title} reward`}>
          <span className="flex items-center gap-1">
            <GemIcon className="size-4" /> {quest.reward_gems}
          </span>
        </Button>
      ) : (
        <motion.span
          animate={quest.claimed ? { scale: [1, 1.15, 1] } : undefined}
          aria-label={quest.claimed ? "Reward claimed" : `Reward: ${quest.reward_gems} gems`}
          role="img"
        >
          <Chest state={quest.claimed ? "claimed" : "locked"} className="size-14" />
        </motion.span>
      )}
    </li>
  );
}
