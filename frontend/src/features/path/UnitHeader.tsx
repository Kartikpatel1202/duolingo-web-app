import { Trophy } from "lucide-react";

import type { Tone } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PathUnit } from "@/types/api";

import { NODE_FILL } from "./skillPresentation";

interface UnitHeaderProps {
  unit: PathUnit;
  tone: Tone;
  headingId: string;
}

/** Sticky, colourful unit banner — the "chapter title" of the game board. */
export function UnitHeader({ unit, tone, headingId }: UnitHeaderProps) {
  const completed = unit.skills.filter((skill) => skill.status === "completed").length;
  const total = unit.skills.length;
  const allDone = total > 0 && completed === total;

  return (
    <div
      className={cn(
        "sticky top-[var(--shell-top)] z-10 flex items-center justify-between gap-4 rounded-card px-5 py-4 text-white",
        "shadow-[0_5px_0_var(--tactile-edge)]",
        NODE_FILL[tone],
      )}
    >
      <div className="min-w-0">
        <p className="text-label font-black uppercase text-white/80">Unit {unit.position}</p>
        <h2 id={headingId} className="text-heading font-extrabold text-balance">
          {unit.description ?? unit.title}
        </h2>
      </div>
      <div
        className="flex shrink-0 flex-col items-center rounded-tile bg-black/10 px-3 py-1.5"
        aria-label={`${completed} of ${total} skills completed`}
        role="img"
      >
        <Trophy className={cn("size-6", allDone ? "text-sun-400" : "text-white/80")} fill={allDone ? "currentColor" : "none"} strokeWidth={2.6} aria-hidden />
        <span className="text-sm font-black tabular-nums" aria-hidden>
          {completed}/{total}
        </span>
      </div>
    </div>
  );
}
