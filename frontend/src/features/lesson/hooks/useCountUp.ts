"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/** Animates a number from 0 up to `target` (instantly when the user prefers reduced motion). */
export function useCountUp(target: number, duration = 0.9, delay = 0.3): number {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const controls = animate(0, target, {
      duration,
      delay,
      ease: "easeOut",
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [target, duration, delay, reduceMotion]);

  return reduceMotion ? target : value;
}
