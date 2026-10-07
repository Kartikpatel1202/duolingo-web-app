"use client";

import { Lock } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { Flame } from "@/components/illustrations";
import { ButtonLink, Skeleton } from "@/components/ui";
import { useStreakCalendar } from "@/hooks/api/useEngagement";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";
import type { StreakCalendar } from "@/types/api";

import { StatPopover } from "./StatPopover";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const BRAND_ART = "/brand/path";

interface StreakMenuProps {
  /** The streak figure itself (flame + count), drawn by the stats bar. */
  children: ReactNode;
  className: string;
  current: number;
  activeToday: boolean;
}

/** The flame in the stats bar as a button that opens the streak card beneath it. */
export function StreakMenu({ children, className, current, activeToday }: StreakMenuProps) {
  return (
    <StatPopover
      className={className}
      label="Your streak"
      width={340}
      // The card's header is pale yellow, so the pointer matches it.
      pointerClassName="bg-sun-50"
      card={(close) => <StreakCard current={current} activeToday={activeToday} onNavigate={close} />}
    >
      {children}
    </StatPopover>
  );
}

/** ISO dates (YYYY-MM-DD) of the Sunday-to-Saturday week containing `today`. */
function weekOf(today: string): string[] {
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

function headline(current: number, activeToday: boolean): string {
  if (current === 0) return "Do a lesson today to start a new streak!";
  return activeToday ? "You practised today. Keep it going!" : "Do a lesson today to extend your streak!";
}

function StreakCard({
  current,
  activeToday,
  onNavigate,
}: {
  current: number;
  activeToday: boolean;
  onNavigate: () => void;
}) {
  const { data } = useStreakCalendar(null);
  return (
    <div>
      <section className="bg-sun-50 px-5 pt-5 pb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className={cn("text-title font-black", current > 0 ? "text-ember-500" : "text-sun-600")}>
              {pluralize(current, "day")} streak
            </h2>
            <p className="font-semibold text-ink-soft">{headline(current, activeToday)}</p>
          </div>
          {/* A pale flame until the streak starts. */}
          <Flame lit className={cn("h-20 w-16 shrink-0", current === 0 && "opacity-30")} />
        </div>
        <Week data={data} />
      </section>

      <div className="space-y-4 p-4">
        {/* Friends are not part of this app yet: the banner is shown, its action does nothing. */}
        <section className="flex items-center gap-4 rounded-card bg-blaze-500 p-4 text-white">
          <span aria-hidden className="relative flex h-16 w-20 shrink-0 items-end">
            <Image src={`${BRAND_ART}/duo.png`} alt="" width={48} height={52} unoptimized className="relative z-10" />
            <Image src={`${BRAND_ART}/lily.png`} alt="" width={46} height={72} unoptimized className="-ml-3" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <h3 className="font-extrabold">Friend Streaks</h3>
              <p className="text-sm font-bold">0 active Friend Streaks</p>
            </div>
            <button
              type="button"
              aria-disabled
              title="Coming soon"
              className="tactile focus-ring h-9 w-full cursor-default rounded-tile bg-white text-[13px] font-black tracking-wide text-blaze-500 uppercase [--tactile-depth:3px] [--tactile-edge:var(--color-line)]"
            >
              View list
            </button>
          </div>
        </section>

        <section className="flex items-center gap-4 rounded-card border-2 border-line p-4">
          <Lock className="size-12 shrink-0 text-line-strong" fill="currentColor" strokeWidth={1.5} aria-hidden />
          <div>
            <h3 className="font-extrabold text-ink">Streak Society</h3>
            <p className="mt-1 font-semibold text-muted">
              {data?.society.unlocked
                ? "You are in the Streak Society. Exclusive rewards await."
                : `Reach a ${data?.society.threshold ?? 7} day streak to join the Streak Society and earn exclusive rewards.`}
            </p>
          </div>
        </section>

        <ButtonLink href="/streak" variant="secondary" size="lg" fullWidth onClick={onNavigate}>
          View more
        </ButtonLink>
      </div>
    </div>
  );
}

/** This week, Sunday to Saturday: a circle per day (orange once practised), today's letter orange. */
function Week({ data }: { data: StreakCalendar | undefined }) {
  if (!data) return <Skeleton className="mt-5 h-[74px] w-full rounded-card" />;
  const practised = new Set(data.practiced_days);
  return (
    <ol className="mt-5 grid grid-cols-7 gap-1 rounded-card bg-surface px-3 py-3" aria-label="This week">
      {weekOf(data.today).map((day, index) => {
        const isToday = day === data.today;
        const done = practised.has(day);
        return (
          <li
            key={day}
            aria-label={`${day}: ${done ? "practised" : "no practice"}${isToday ? " (today)" : ""}`}
            className="flex flex-col items-center gap-2"
          >
            <span aria-hidden className={cn("text-sm font-extrabold", isToday ? "text-ember-500" : "text-muted")}>
              {WEEKDAY_LETTERS[index]}
            </span>
            <span aria-hidden className={cn("size-7 rounded-full", done ? "bg-ember-500" : "bg-line")} />
          </li>
        );
      })}
    </ol>
  );
}
