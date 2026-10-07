"use client";

import { FastForward } from "lucide-react";
import Image from "next/image";

import type { Tone } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PathSkill } from "@/types/api";

import { LookupIcon } from "@/components/icons/LookupIcon";

import { NODE_FILL, skillAccessibleName, skillIcon } from "./skillPresentation";
import { lockedNodeArt, type UnitArt } from "./unitArt";

interface CoinNodeProps {
  skill: PathSkill;
  tone: Tone;
  isCurrent: boolean;
  /** The unit's first node while the unit is ahead of the learner: a "jump here" entry. */
  jump?: boolean;
  art: UnitArt;
  onPress: () => void;
}

/**
 * A skill drawn as a flat "coin": a shallow ellipse with a darker edge beneath it that sinks when
 * pressed. Locked skills use the artwork extracted from the reference; unlocked ones are layered
 * CSS in the unit's colour, with a light ring around the learner's current skill.
 */
export function CoinNode({ skill, tone, isCurrent, jump = false, art, onPress }: CoinNodeProps) {
  const locked = skill.status === "locked" && !jump;
  const common = {
    type: "button" as const,
    onClick: onPress,
    "aria-label": skillAccessibleName(skill),
    "aria-haspopup": "dialog" as const,
    "data-status": skill.status,
    "data-jump": jump || undefined,
  };

  if (locked) {
    const { src, width, height } = lockedNodeArt(art, skill.icon);
    return (
      <button {...common} className="focus-ring block rounded-[50%]">
        <Image src={src} alt="" width={width} height={height} unoptimized draggable={false} />
      </button>
    );
  }

  return (
    <span className="relative flex items-center justify-center">
      {isCurrent && (
        <span
          aria-hidden
          // Centred on the coin's face *and* its edge (10px below the face), so it reads as a ring
          // around the whole coin: the face is 58px tall, the edge adds 10, hence the +5px.
          className="pointer-events-none absolute left-1/2 h-[96px] w-[116px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-[8px] border-line"
          style={{ top: "calc(50% + 5px)" }}
        />
      )}
      <button
        {...common}
        className={cn(
          "tactile focus-ring relative flex h-[58px] w-[78px] items-center justify-center rounded-[50%] text-white [--tactile-depth:10px]",
          NODE_FILL[tone],
        )}
      >
        {jump ? (
          <FastForward className="size-7" fill="currentColor" strokeWidth={1.5} aria-hidden />
        ) : (
          <LookupIcon
            icon={skillIcon(skill.icon)}
            className="size-7"
            // Only the star is a solid shape; the other icons are outlines.
            fill={skill.icon === "star" ? "currentColor" : "none"}
            strokeWidth={2.4}
            aria-hidden
          />
        )}
      </button>
    </span>
  );
}
