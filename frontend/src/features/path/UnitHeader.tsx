import { ArrowLeft, NotebookText } from "lucide-react";
import Link from "next/link";

import type { Tone } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PathUnit } from "@/types/api";

import { NODE_FILL } from "./skillPresentation";

interface UnitHeaderProps {
  unit: PathUnit;
  tone: Tone;
  headingId: string;
}

/** Sticky, colourful unit banner — the "chapter title" of the game board — with its guidebook. */
export function UnitHeader({ unit, tone, headingId }: UnitHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-[var(--shell-top)] z-10 flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-white sm:px-5",
        // The darker bottom edge is the banner's depth; its colour comes from the unit's tone.
        "border-b-4 border-[var(--tactile-edge)]",
        NODE_FILL[tone],
      )}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-label font-black uppercase text-white/75">
          <ArrowLeft className="size-3.5" strokeWidth={3.5} aria-hidden />
          <span>
            Section {unit.section}, Unit {unit.position}
          </span>
        </p>
        <h2 id={headingId} className="text-heading font-extrabold text-balance">
          {unit.title}
        </h2>
      </div>
      <Link
        href={`/learn/guidebook/${unit.id}`}
        aria-label={`Guidebook for unit ${unit.position}`}
        className="tactile focus-ring flex h-12 shrink-0 items-center gap-2 rounded-tile border-2 border-black/15 bg-white/10 px-3 text-[15px] font-black uppercase tracking-wide [--tactile-edge:rgb(0_0_0/0.18)]"
      >
        <NotebookText className="size-6" strokeWidth={2.6} aria-hidden />
        <span className="hidden min-[360px]:inline">Guidebook</span>
      </Link>
    </div>
  );
}
