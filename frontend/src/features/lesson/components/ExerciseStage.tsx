"use client";

import { motion, useIsPresent } from "motion/react";
import type { ReactNode } from "react";

import type { Exercise } from "@/types/api";

/**
 * Slides each exercise in and out. While an exercise is animating away it is made `inert` and
 * loses its identifying attributes, so neither keyboard users nor tests can interact with it.
 */
export function ExerciseStage({ exercise, children }: { exercise: Exercise; children: ReactNode }) {
  const isPresent = useIsPresent();
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col gap-6"
      inert={!isPresent}
      data-exercise-id={isPresent ? exercise.id : undefined}
      data-exercise-type={isPresent ? exercise.type : undefined}
    >
      {children}
    </motion.div>
  );
}
