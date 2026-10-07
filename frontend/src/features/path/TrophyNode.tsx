"use client";

import { motion } from "motion/react";
import Image from "next/image";

import { Trophy } from "@/components/illustrations";

import type { PathPoint } from "./pathLayout";
import type { UnitArt } from "./unitArt";

interface TrophyNodeProps {
  completed: number;
  total: number;
  point: PathPoint;
  /** The unit's own look; its locked-trophy artwork is shown until every skill is complete. */
  art?: UnitArt;
}

/** The finish line of a unit: grey until every skill is complete, gold afterwards. */
export function TrophyNode({ completed, total, point, art }: TrophyNodeProps) {
  const finished = total > 0 && completed === total;
  const label = `${completed} of ${total} skills completed`;
  if (art && !finished) {
    const { src, width, height } = art.locked.trophy;
    return (
      <div
        role="img"
        aria-label={label}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${point.x * 100}%`, top: point.y }}
      >
        <Image src={src} alt="" width={width} height={height} unoptimized draggable={false} />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={label}
      className="absolute flex size-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-line bg-surface shadow-[0_6px_0_var(--color-line)]"
      style={{ left: `${point.x * 100}%`, top: point.y }}
    >
      <motion.span
        className="block"
        // Finished units celebrate once as the trophy scrolls into view, and again on hover.
        whileInView={finished ? { scale: [1, 1.25, 1], rotate: [0, -10, 10, 0] } : undefined}
        whileHover={finished ? { scale: 1.15, rotate: -6 } : { rotate: [0, -3, 3, 0] }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Trophy tier="gold" locked={!finished} className="size-11" />
      </motion.span>
    </div>
  );
}
