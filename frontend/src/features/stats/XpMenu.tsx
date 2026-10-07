"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ProgressBar } from "@/components/ui";
import { useCurrentUser } from "@/hooks/api/useLearner";

import { XpIcon } from "./StatIcons";
import { StatPopover } from "./StatPopover";

interface XpMenuProps {
  /** The XP figure itself (icon + count), drawn by the stats bar. */
  children: ReactNode;
  className: string;
}

/** The XP pill as a button that opens a card beneath it: total XP, today's goal and a profile link. */
export function XpMenu({ children, className }: XpMenuProps) {
  return (
    <StatPopover className={className} label="Your XP" width={320} card={(close) => <XpCard onNavigate={close} />}>
      {children}
    </StatPopover>
  );
}

/** Totals come from the backend (computed from the XP ledger), never from the browser. */
function XpCard({ onNavigate }: { onNavigate: () => void }) {
  const { data: user } = useCurrentUser();
  if (!user) return null;
  const { daily } = user;
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center gap-4">
        <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-full bg-sun-100">
          <XpIcon className="size-9" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-title font-black text-ink">XP</h2>
          <p className="mt-1 font-semibold text-ink-soft">You have {user.total_xp} XP in total</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-extrabold text-ink-soft">
          {daily.daily_goal_completed ? "Daily goal complete!" : `Earn ${daily.daily_goal} XP today`}
        </p>
        <div className="flex items-center gap-3">
          <ProgressBar value={daily.daily_xp / daily.daily_goal} tone="sun" label="Daily goal progress" />
          <span className="shrink-0 text-sm font-extrabold tabular-nums text-muted">
            {daily.daily_xp}/{daily.daily_goal}
          </span>
        </div>
      </div>
      <div className="text-right">
        <Link
          href="/profile"
          onClick={onNavigate}
          className="focus-ring rounded-tile px-1 text-[13px] font-black tracking-wide text-sky-500 uppercase hover:text-sky-600"
        >
          Go to profile
        </Link>
      </div>
    </div>
  );
}
