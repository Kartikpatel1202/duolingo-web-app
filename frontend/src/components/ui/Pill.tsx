import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { TONE_TEXT, type Tone } from "./tones";

interface PillProps {
  icon: ReactNode;
  tone: Tone;
  children: ReactNode;
  /** Accessible description, e.g. "5 day streak". */
  label: string;
  className?: string;
}

/** Icon + value chip used by the stats bar. */
export function Pill({ icon, tone, children, label, className }: PillProps) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-tile px-2 text-[17px] font-extrabold tabular-nums",
        TONE_TEXT[tone],
        className,
      )}
    >
      <span aria-hidden className="inline-flex">
        {icon}
      </span>
      <span aria-hidden>{children}</span>
    </span>
  );
}
