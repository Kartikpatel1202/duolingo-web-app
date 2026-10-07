"use client";

import { Award, BookOpen, Flame, Plus, Shield } from "lucide-react";

import { Avatar, Badge, ErrorState, Skeleton, type Tone } from "@/components/ui";
import { useFeed } from "@/hooks/api/useEngagement";
import { useCurrentUser } from "@/hooks/api/useLearner";
import { cn } from "@/lib/cn";
import type { FeedItem } from "@/types/api";

const KIND_STYLE: Record<FeedItem["kind"], { tone: Tone; icon: typeof Award }> = {
  tip: { tone: "grape", icon: BookOpen },
  league: { tone: "sky", icon: Shield },
  achievement: { tone: "sun", icon: Award },
  streak: { tone: "ember", icon: Flame },
};

const FRIEND_SLOTS = 5;

/** Activity feed: friend-streak slots (placeholders) and real, deterministic activity cards. */
export function FeedView() {
  const { data, error, refetch, isFetching } = useFeed();

  return (
    <div className="space-y-6">
      <h1 className="text-title font-black text-ink">Feed</h1>
      <FriendStreaksCard />

      {error ? (
        <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
      ) : !data ? (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-4" aria-label="Activity">
          {data.items.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Friend streaks teaser. Friends are not part of this app yet, so the card says so plainly: the
 * learner's own avatar fills the first seat and the other seats are empty invitations.
 */
function FriendStreaksCard() {
  const { data: user } = useCurrentUser();
  return (
    <section
      aria-label="Friend streaks"
      className="overflow-hidden rounded-panel border-2 border-ember-100 bg-[linear-gradient(135deg,var(--color-ember-50),var(--color-sun-50))]"
    >
      <div className="flex items-start gap-4 p-5">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-card bg-ember-500 text-white shadow-[0_4px_0_var(--color-ember-600)]"
        >
          <Flame className="size-8" fill="currentColor" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-heading font-extrabold text-ink">Friend streaks</h2>
            <Badge tone="ember">Coming soon</Badge>
          </div>
          <p className="font-semibold text-ink-soft">
            Practise together and keep each other going. Invite friends here once it opens.
          </p>
        </div>
      </div>

      <ul aria-hidden className="flex items-start justify-between gap-2 border-t-2 border-ember-100 bg-surface/70 px-5 py-4">
        <li className="flex w-14 flex-col items-center gap-1.5">
          {user ? (
            <Avatar name={user.display_name} color={user.avatar_color} size="md" />
          ) : (
            <Skeleton shape="circle" className="size-11" />
          )}
          <span className="text-xs font-extrabold text-ink-soft">You</span>
        </li>
        {Array.from({ length: FRIEND_SLOTS - 1 }, (_, i) => (
          <li key={i} className="flex w-14 flex-col items-center gap-1.5">
            <span className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-ember-500/50 bg-surface text-ember-500">
              <Plus className="size-5" strokeWidth={3} />
            </span>
            <span className="text-xs font-extrabold text-muted">Friend</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const style = KIND_STYLE[item.kind];
  const Icon = style.icon;
  const isTip = item.kind === "tip";
  return (
    <li className="overflow-hidden rounded-card border-2 border-line">
      {isTip && (
        <div className="flex h-24 items-center justify-center bg-grape-100" aria-hidden>
          <Icon className="size-12 text-grape-500" strokeWidth={2.2} />
        </div>
      )}
      <div className="flex items-start gap-3 p-4">
        {item.actor_name && item.actor_color && <Avatar name={item.actor_name} color={item.actor_color} size="md" />}
        <div className="min-w-0 flex-1 space-y-1">
          <Badge tone={style.tone} icon={isTip ? undefined : <Icon className="size-3.5" strokeWidth={3} />}>
            {item.label}
          </Badge>
          <p className={cn("font-extrabold text-ink", isTip && "text-heading")}>{item.title}</p>
          <p className="font-semibold text-muted">{item.body}</p>
        </div>
      </div>
    </li>
  );
}
