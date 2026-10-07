"use client";

import { Heart } from "lucide-react";
import { useId, type ReactNode } from "react";

import { useToast } from "@/components/ui";
import { useCurrentUser } from "@/hooks/api/useLearner";
import { useRefillHearts } from "@/hooks/api/useLessonApi";
import { friendlyError } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import { timeUntil } from "@/lib/format";

import { StatPopover } from "./StatPopover";
import { GemIcon, HeartIcon } from "./StatIcons";

interface HeartsMenuProps {
  /** The hearts figure itself (icon + count), drawn by the stats bar. */
  children: ReactNode;
  className: string;
}

/** The hearts pill as a button that opens the hearts card beneath it. */
export function HeartsMenu({ children, className }: HeartsMenuProps) {
  return (
    <StatPopover className={className} label="Hearts" width={340} card={() => <HeartsCard />}>
      {children}
    </StatPopover>
  );
}

const ROW =
  "flex w-full items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-3.5 text-left text-[14px] font-extrabold tracking-wide text-ink-soft uppercase";

/** Hearts left, and what can be done about it: a real refill (API) and the unlimited-hearts teaser. */
function HeartsCard() {
  const { data: user } = useCurrentUser();
  const refill = useRefillHearts();
  const toast = useToast();
  if (!user) return null;
  const { hearts } = user;
  const full = hearts.current >= hearts.max;
  const affordable = user.gems >= hearts.refill_cost_gems;

  function doRefill() {
    refill.mutate(undefined, {
      onSuccess: () => toast.show({ tone: "success", title: "Hearts refilled!" }),
      onError: (error) => toast.show({ tone: "error", ...friendlyError(error) }),
    });
  }

  return (
    <div className="space-y-4 p-5">
      <h2 className="text-center text-title font-black text-ink">Hearts</h2>
      <div className="flex justify-center gap-2" role="img" aria-label={`${hearts.current} of ${hearts.max} hearts`}>
        {Array.from({ length: hearts.max }, (_, i) => (
          <HeartIcon key={i} className={cn("size-8", i >= hearts.current && "text-line-strong")} />
        ))}
      </div>
      <div className="space-y-2 text-center">
        <p className="text-[17px] font-extrabold text-ink">
          {full ? "You have full hearts" : `You have ${hearts.current} of ${hearts.max} hearts`}
        </p>
        <p className="font-semibold text-muted">
          {full
            ? "Keep on learning"
            : hearts.next_heart_at
              ? `Next heart in ${timeUntil(hearts.next_heart_at)} · one every ${hearts.regen_minutes} minutes`
              : "Keep on learning"}
        </p>
      </div>

      {/* Unlimited hearts is not part of this app: the row is shown, pressing it does nothing. */}
      <button type="button" aria-disabled title="Coming soon" className={cn(ROW, "cursor-default")}>
        <UnlimitedHeartIcon className="size-8 shrink-0" />
        <span className="flex-1">Unlimited hearts</span>
        <span className="text-[13px] text-grape-500">Free trial</span>
      </button>

      <button
        type="button"
        onClick={doRefill}
        disabled={full || !affordable || refill.isPending}
        className={cn(ROW, "focus-ring disabled:cursor-not-allowed disabled:opacity-60")}
      >
        <Heart className="size-8 shrink-0 text-line-strong" strokeWidth={2.4} aria-hidden />
        <span className="flex-1">Refill hearts</span>
        <span className="flex items-center gap-1.5 text-muted">
          <GemIcon className="size-5" />
          {hearts.refill_cost_gems}
        </span>
      </button>
      {!full && !affordable && (
        <p role="alert" className="text-center text-sm font-bold text-sun-700">
          You need {hearts.refill_cost_gems} gems — you have {user.gems}.
        </p>
      )}
    </div>
  );
}

/** A heart in a rainbow gradient with an infinity loop on it. */
function UnlimitedHeartIcon({ className }: { className?: string }) {
  const gradient = useId();
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-sky-500)" />
          <stop offset="0.5" stopColor="var(--color-grape-500)" />
          <stop offset="1" stopColor="var(--color-teal-500)" />
        </linearGradient>
      </defs>
      <path
        d="M16 29C6 21 2 15.5 2 10.5A7.5 7.5 0 0 1 16 7a7.5 7.5 0 0 1 14 3.5C30 15.5 26 21 16 29Z"
        fill={`url(#${gradient})`}
      />
      <path
        d="M16 15c-2-2.500-3.500-3.500-5-3.500a3.500 3.500 0 1 0 0 7c1.500 0 3-1 5-3.500m0 0c2-2.500 3.500-3.500 5-3.500a3.500 3.500 0 1 1 0 7c-1.500 0-3-1-5-3.500"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
