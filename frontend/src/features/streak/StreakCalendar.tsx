"use client";

import { Flame, Snowflake } from "lucide-react";

import { cn } from "@/lib/cn";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface StreakCalendarProps {
  /** Month shown, as YYYY-MM. */
  month: string;
  today: string;
  practicedDays: string[];
  freezeDays: string[];
}

function isoDay(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Month grid: practised days glow orange, freeze-covered days are icy blue, today is ringed. */
export function StreakCalendar({ month, today, practicedDays, freezeDays }: StreakCalendarProps) {
  const [year, monthNumber] = month.split("-").map(Number) as [number, number];
  const monthIndex = monthNumber - 1;
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const practiced = new Set(practicedDays);
  const frozen = new Set(freezeDays);

  return (
    <div className="rounded-card border-2 border-line p-4">
      <div className="grid grid-cols-7 gap-y-2 text-center" role="list" aria-label="Streak calendar">
        <div className="contents">
          {WEEKDAYS.map((day) => (
            <span key={day} aria-hidden className="text-sm font-extrabold text-muted">
              {day}
            </span>
          ))}
        </div>
        <div className="contents">
          {Array.from({ length: firstWeekday }, (_, i) => (
            <span key={`blank-${i}`} aria-hidden />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = isoDay(year, monthIndex, i + 1);
            const done = practiced.has(day);
            const freeze = frozen.has(day);
            const isToday = day === today;
            const status = done ? "practiced" : freeze ? "streak freeze used" : "no practice";
            return (
              <span key={day} role="listitem" aria-label={`${day}: ${status}`} className="flex justify-center">
                <span
                  className={cn(
                    "relative flex size-9 items-center justify-center rounded-full text-sm font-extrabold",
                    done && "bg-ember-500 text-white",
                    freeze && !done && "bg-sky-100 text-sky-700",
                    !done && !freeze && "text-muted",
                    isToday && "ring-[3px] ring-line-strong ring-offset-2 ring-offset-surface",
                  )}
                >
                  {i + 1}
                  {done && <Flame className="absolute -top-1 -right-1 size-3.5 text-sun-400" fill="currentColor" aria-hidden />}
                  {freeze && !done && <Snowflake className="absolute -top-1 -right-1 size-3.5 text-sky-500" aria-hidden />}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
