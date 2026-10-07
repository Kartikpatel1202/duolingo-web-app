"use client";

import { Award, BookOpen, Flame, Plus, Shield } from "lucide-react";

import { Avatar, Badge, ErrorState, Skeleton, type Tone } from "@/components/ui";
import { useFeed } from "@/hooks/api/useEngagement";
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
      <section aria-label="Friend streaks" className="space-y-3">
        <div className="flex justify-between">
          {Array.from({ length: FRIEND_SLOTS }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-line-strong text-muted"
            >
              <Plus className="size-6" strokeWidth={3} />
            </span>
          ))}
        </div>
        <p className="rounded-card border-2 border-line px-4 py-3 text-center font-bold text-ink-soft">
          Friend streaks are coming soon — practise together and keep each other going.
        </p>
      </section>

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
