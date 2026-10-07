"use client";

import { ChevronLeft, ChevronRight, CircleCheck, Lock, Snowflake, Trophy, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { Flame } from "@/components/illustrations";
import { ButtonLink, ErrorState, IconButton, Skeleton } from "@/components/ui";
import { useStreakCalendar } from "@/hooks/api/useEngagement";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";

import { StreakCalendar } from "./StreakCalendar";

type Tab = "personal" | "friends";

function shiftMonth(month: string, delta: number): string {
  const [year, number] = month.split("-").map(Number) as [number, number];
  const date = new Date(Date.UTC(year, number - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(month: string): string {
  const [year, number] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(year, number - 1, 1)).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Streak screen: big streak, month calendar (server data), freezes and the 7-day milestone. */
export function StreakView() {
  const [tab, setTab] = useState<Tab>("personal");
  const [month, setMonth] = useState<string | null>(null);
  const { data, error, refetch, isFetching } = useStreakCalendar(month);

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Streak views" className="grid grid-cols-2 border-b-2 border-line">
        {(["personal", "friends"] as const).map((value) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "focus-ring -mb-[2px] border-b-[3px] py-3 text-label font-black uppercase",
              tab === value ? "border-sky-500 text-sky-500" : "border-transparent text-muted",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {tab === "friends" ? (
        <div role="tabpanel" className="flex flex-col items-center gap-3 py-10 text-center">
          <Users className="size-14 text-sky-500" strokeWidth={2} aria-hidden />
          <h2 className="text-heading font-extrabold text-ink">Friend streaks are coming soon</h2>
          <p className="font-semibold text-muted">Practise together and keep each other going.</p>
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
      ) : !data ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <div role="tabpanel" className="space-y-6">
          <section className="flex items-center justify-between rounded-card bg-mist px-6 py-5" aria-label="Current streak">
            <div>
              <motion.p
                key={data.current}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn("text-[64px] leading-none font-black", data.active_today ? "text-ember-500" : "text-ink")}
              >
                {data.current}
              </motion.p>
              <h1 className="text-heading font-extrabold text-ink-soft">
                day streak!
              </h1>
              <p className="text-sm font-bold text-muted">
                {data.active_today ? "You practised today — nice!" : "Practise today to extend your streak."}
              </p>
            </div>
            <Flame lit={data.active_today} />
          </section>

          <section aria-labelledby="calendar-title" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="calendar-title" className="text-heading font-extrabold text-ink">
                {monthTitle(data.month)}
              </h2>
              <div className="flex">
                <IconButton
                  label="Previous month"
                  icon={<ChevronLeft className="size-6" strokeWidth={3} />}
                  onClick={() => setMonth(shiftMonth(data.month, -1))}
                />
                <IconButton
                  label="Next month"
                  icon={<ChevronRight className="size-6" strokeWidth={3} />}
                  onClick={() => setMonth(shiftMonth(data.month, 1))}
                  disabled={data.month >= data.today.slice(0, 7)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-tile border-2 border-line p-3">
                <CircleCheck className="size-7 text-sun-500" fill="var(--color-sun-100)" aria-hidden />
                <div>
                  <p className="text-heading font-black text-ink">{data.days_practiced}</p>
                  <p className="text-sm font-bold text-muted">Days practiced</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-tile border-2 border-line p-3">
                <Snowflake className="size-7 text-sky-500" aria-hidden />
                <div>
                  <p className="text-heading font-black text-ink">{data.freezes_used}</p>
                  <p className="text-sm font-bold text-muted">Freezes used</p>
                </div>
              </div>
            </div>
            <StreakCalendar
              month={data.month}
              today={data.today}
              practicedDays={data.practiced_days}
              freezeDays={data.freeze_days}
            />
          </section>

          <section className="flex items-center gap-4 rounded-card border-2 border-line p-4" aria-label="Streak freezes">
            <Snowflake className="size-10 shrink-0 text-sky-500" aria-hidden />
            <div className="flex-1">
              <p className="font-extrabold text-ink">
                {data.freezes_owned} of {data.freezes_max} streak freezes equipped
              </p>
              <p className="text-sm font-semibold text-muted">Each freeze protects your streak for one missed day.</p>
            </div>
            {data.freezes_owned < data.freezes_max && (
              <ButtonLink href="/shop" size="sm" variant="secondary">
                Get
              </ButtonLink>
            )}
          </section>

          <section aria-labelledby="society-title" className="space-y-3">
            <h2 id="society-title" className="text-heading font-extrabold text-ink">
              Streak Society
            </h2>
            <div className="flex items-center gap-4 rounded-card border-2 border-line p-5">
              {data.society.unlocked ? (
                <Trophy className="size-12 text-sun-500" fill="var(--color-sun-100)" aria-hidden />
              ) : (
                <Lock className="size-12 text-muted" aria-hidden />
              )}
              <p className="font-bold text-ink-soft">
                {data.society.unlocked
                  ? "You're a member of the Streak Society!"
                  : `Reach a ${data.society.threshold} day streak to join the Streak Society — ${pluralize(
                      data.society.days_to_go,
                      "day",
                    )} to go.`}
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
