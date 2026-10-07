"use client";

import { motion, useReducedMotion } from "motion/react";

const PIECES = 36;
const COLOURS = [
  "var(--color-leaf-500)",
  "var(--color-sun-500)",
  "var(--color-sky-500)",
  "var(--color-cherry-500)",
  "var(--color-grape-500)",
  "var(--color-ember-500)",
];

/** Deterministic pseudo-random in [0, 1) so the burst is identical on every render. */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** A one-shot burst of CSS confetti (a few dozen transformed divs, no canvas, no library). */
export function Confetti() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from({ length: PIECES }, (_, i) => {
        const left = noise(i + 1) * 100;
        const drift = (noise(i + 7) - 0.5) * 240;
        const spin = (noise(i + 13) - 0.5) * 1080;
        const delay = noise(i + 21) * 0.35;
        const duration = 1.6 + noise(i + 31) * 1.2;
        const round = i % 3 === 0;
        return (
          <motion.span
            key={i}
            className="absolute -top-6 block"
            style={{
              left: `${left}%`,
              width: round ? 10 : 8,
              height: round ? 10 : 14,
              borderRadius: round ? 999 : 2,
              background: COLOURS[i % COLOURS.length],
            }}
            initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
            animate={{ y: "105vh", x: drift, rotate: spin, opacity: [1, 1, 0] }}
            transition={{ duration, delay, ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}
