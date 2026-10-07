import type { LucideIcon } from "lucide-react";

import { LookupIcon } from "@/components/icons/LookupIcon";
import { TONE_COLOR, type Tone } from "@/components/ui/tones";
import { cn } from "@/lib/cn";

interface BadgeArtProps {
  icon: LucideIcon;
  tone: Tone;
  /** Ribbon number (e.g. the threshold). */
  label?: string;
  earned: boolean;
  className?: string;
}

/** Original hexagonal achievement badge. Unearned badges are greyed out. */
export function BadgeArt({ icon, tone, label, earned, className }: BadgeArtProps) {
  const fill = earned ? TONE_COLOR[tone] : "var(--color-locked)";
  return (
    <span className={cn("relative inline-flex items-center justify-center", className ?? "size-20")} aria-hidden>
      <svg viewBox="0 0 80 88" className="absolute inset-0 size-full">
        <path d="M40 4 74 23v42L40 84 6 65V23Z" fill={fill} />
        <path d="M40 4 74 23v42L40 84 6 65V23Z" fill="black" opacity="0.12" transform="translate(0 4)" />
        <path d="M40 4 74 23v42L40 84 6 65V23Z" fill={fill} />
        <path d="M40 12 66 27v34L40 76 14 61V27Z" fill="white" opacity={earned ? 0.22 : 0.4} />
      </svg>
      <LookupIcon icon={icon} className={cn("relative size-9", earned ? "text-white" : "text-muted")} strokeWidth={2.4} />
      {label && (
        <span
          className={cn(
            "absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border-2 border-surface px-2 text-xs font-black",
            earned ? "bg-sun-500 text-ink" : "bg-line-strong text-surface",
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
