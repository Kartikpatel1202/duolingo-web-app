"use client";

import { motion } from "motion/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type TileState = "idle" | "selected" | "correct" | "incorrect" | "dimmed";

const STATES: Record<TileState, string> = {
  idle: "border-line bg-surface text-ink [--tactile-edge:var(--color-line)]",
  selected: "border-sky-400 bg-sky-50 text-sky-700 [--tactile-edge:var(--color-sky-400)]",
  correct: "border-leaf-400 bg-leaf-50 text-leaf-700 [--tactile-edge:var(--color-leaf-400)]",
  incorrect: "border-cherry-400 bg-cherry-50 text-cherry-700 [--tactile-edge:var(--color-cherry-400)]",
  dimmed: "border-line bg-surface text-muted opacity-60 [--tactile-edge:var(--color-line)]",
};

/** Shared look of every tappable answer surface (also used by word-bank tiles). */
export const TILE_BASE =
  "tactile focus-ring relative flex items-center justify-center gap-3 rounded-tile border-2 font-bold transition-colors disabled:cursor-default";

interface ChoiceTileProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  state: TileState;
  children: ReactNode;
  /** Number-key shortcut shown in the corner (1–9). */
  shortcut?: number;
  /** Classes for the outer wrapper (grid/flex sizing). */
  wrapperClassName?: string;
}

/**
 * The tappable answer card shared by every exercise type. The shake lives on a wrapper so that
 * motion's inline transform never overrides the button's CSS press/lift (`tactile`).
 */
export function ChoiceTile({ state, shortcut, className, wrapperClassName, children, ...props }: ChoiceTileProps) {
  return (
    <motion.div
      className={cn("flex", wrapperClassName)}
      animate={state === "incorrect" ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <button
        type="button"
        aria-pressed={state === "selected"}
        className={cn(TILE_BASE, "min-h-14 w-full px-4 py-3 text-lg", STATES[state], className)}
        {...props}
      >
        {shortcut !== undefined && (
          <span
            aria-hidden
            className="absolute top-2 left-2 hidden size-6 items-center justify-center rounded-md border-2 border-current text-xs font-extrabold opacity-50 md:flex"
          >
            {shortcut}
          </span>
        )}
        {children}
      </button>
    </motion.div>
  );
}
