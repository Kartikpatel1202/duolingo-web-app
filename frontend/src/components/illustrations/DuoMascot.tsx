"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

import { mascotSrc, type MascotState } from "@/lib/brand";
import { cn } from "@/lib/cn";

import { Mascot, type MascotMood } from "./Mascot";

/** Which placeholder drawing stands in for each state until artwork is supplied. */
const PLACEHOLDER_MOOD: Record<MascotState, MascotMood> = {
  idle: "happy",
  happy: "happy",
  guidebook: "happy",
  celebrating: "cheer",
  "lesson-success": "cheer",
  achievement: "cheer",
  "lesson-failure": "sleepy",
  sleeping: "sleepy",
  loading: "happy",
};

const CELEBRATING: ReadonlySet<MascotState> = new Set(["celebrating", "lesson-success", "achievement"]);

interface DuoMascotProps {
  state?: MascotState;
  /** Gentle idle float and a small hover reaction. Off for small, decorative uses. */
  animated?: boolean;
  /** Size and positioning classes for the box the mascot fills (default: 112px square). */
  className?: string;
  /** Artwork to use instead of the state's (a unit's own character, for example). */
  src?: string;
}

/**
 * The product mascot, everywhere it appears. It renders the artwork configured in `lib/brand.ts`
 * for the given state, or the built-in placeholder while none is supplied. The box size comes
 * from `className`, so swapping artwork (or animating it) never shifts the layout.
 */
export function DuoMascot({ state = "idle", animated = false, className, src: override }: DuoMascotProps) {
  const reduceMotion = useReducedMotion();
  const src = override ?? mascotSrc(state);
  const art = src ? (
    <Image src={src} alt="" width={320} height={320} unoptimized className="size-full object-contain" />
  ) : (
    <Mascot mood={PLACEHOLDER_MOOD[state]} className="size-full" />
  );

  if (!animated || reduceMotion) {
    return (
      <span aria-hidden data-mascot={state} className={cn("block", className ?? "size-28")}>
        {art}
      </span>
    );
  }
  return (
    <motion.span
      aria-hidden
      data-mascot={state}
      className={cn("block", className ?? "size-28")}
      // Idle: a slow float. Celebrating states add one short hop when they appear.
      initial={CELEBRATING.has(state) ? { scale: 0.85, rotate: -6 } : false}
      animate={{ y: [0, -6, 0], scale: 1, rotate: 0 }}
      transition={{
        y: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
        scale: { type: "spring", stiffness: 260, damping: 12 },
        rotate: { type: "spring", stiffness: 260, damping: 12 },
      }}
    >
      <motion.span
        className="block size-full"
        whileHover={{ scale: 1.06, rotate: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
      >
        {art}
      </motion.span>
    </motion.span>
  );
}
