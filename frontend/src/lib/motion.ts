/** Shared motion presets so animations feel like one system. */
import type { TargetAndTransition, Transition } from "motion/react";

export const springSnappy: Transition = { type: "spring", stiffness: 520, damping: 30 };

export type StatChangeAnimation = "bounce" | "shake" | "pulse";

/** Value-change emphasis for stat counters. */
export const statChange: Record<StatChangeAnimation, TargetAndTransition> = {
  bounce: { scale: [1, 1.28, 0.95, 1], transition: { duration: 0.45 } },
  shake: { x: [0, -5, 5, -4, 4, 0], transition: { duration: 0.4 } },
  pulse: { scale: [1, 1.15, 1], transition: { duration: 0.5 } },
};
