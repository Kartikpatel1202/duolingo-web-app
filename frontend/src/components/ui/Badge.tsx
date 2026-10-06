import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { TONE_SOFT, type Tone } from "./tones";

interface BadgeProps {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Small uppercase status label, e.g. COMPLETED / LOCKED. */
export function Badge({ tone = "neutral", icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label font-extrabold uppercase",
        TONE_SOFT[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
