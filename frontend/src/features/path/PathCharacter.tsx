"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

import { DuoMascot } from "@/components/illustrations";
import { BRAND, type MascotState } from "@/lib/brand";
import { cn } from "@/lib/cn";

/** Mascot states used along the path, so neighbouring characters do not look identical. */
const STATES: readonly MascotState[] = ["idle", "happy", "celebrating", "guidebook", "sleeping", "achievement"];

interface PathCharacterProps {
  /** Which character slot this is across the whole course (unit by unit, top to bottom). */
  slot: number;
  /** Units the learner has not reached show their characters in grey, like their nodes. */
  locked: boolean;
  side: "left" | "right";
  /** Distance from the top of the unit's track, in px. */
  top: number;
}

/**
 * A character standing beside the path. Artwork comes from the reusable mapping in
 * `lib/brand.ts` (`pathCharacters`): the same file is reused wherever its slot comes round again.
 * While no files are configured, the built-in mascot is shown in a state chosen by the slot.
 */
export function PathCharacter({ slot, locked, side, top }: PathCharacterProps) {
  const reduceMotion = useReducedMotion();
  const artwork = BRAND.pathCharacters.length ? BRAND.pathCharacters[slot % BRAND.pathCharacters.length] : null;
  const state = STATES[slot % STATES.length] ?? "idle";

  return (
    <div
      aria-hidden
      className={cn("absolute -translate-y-1/2", locked && "opacity-60 grayscale")}
      style={{ top, [side]: "3%" }}
    >
      {artwork ? (
        <motion.div
          className="relative size-20 sm:size-28"
          animate={reduceMotion || locked ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.06, rotate: side === "left" ? -4 : 4 }}
        >
          <Image src={artwork} alt="" fill unoptimized sizes="112px" className="object-contain" />
        </motion.div>
      ) : (
        // Locked characters stand still; the learner's own units are the lively ones.
        <DuoMascot state={locked ? "idle" : state} animated={!locked} className="size-16 sm:size-24" />
      )}
    </div>
  );
}

interface CharacterDecorationProps {
  src: string;
  width: number;
  height: number;
  /** Horizontal centre, as a fraction of the track width. */
  x: number;
  /** Vertical centre, in px from the top of the track. */
  y: number;
  /** Grey it out (for artwork without a grey version of its own). */
  locked?: boolean;
}

/**
 * A character from the unit's configuration (extracted artwork, not redrawn). It idles with a very
 * small float and tilt, hops when hovered, and stands still with reduced motion.
 */
export function CharacterDecoration({ src, width, height, x, y, locked = false }: CharacterDecorationProps) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      aria-hidden
      className={cn("absolute z-20 -translate-x-1/2 -translate-y-1/2", locked && "opacity-60 grayscale")}
      style={{ left: `${x * 100}%`, top: y }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -4, 0, -2, 0], rotate: [0, -1.5, 0, 1.5, 0] }}
        transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ y: -9, scale: 1.04, transition: { type: "spring", stiffness: 320, damping: 11 } }}
        style={{ transformOrigin: "50% 90%" }}
      >
        <Image src={src} alt="" width={width} height={height} unoptimized draggable={false} />
      </motion.div>
    </div>
  );
}
