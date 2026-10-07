"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { IconButton, ProgressBar } from "@/components/ui";
import { AnimatedStat, HeartIcon } from "@/features/stats";
import type { Hearts } from "@/types/api";

interface LessonHeaderProps {
  progress: number;
  /** Hearts (standard lessons) — or the challenge widget in their place. */
  hearts: Hearts | null;
  challenge?: ReactNode;
  legendary: boolean;
  onExit: () => void;
}

/** [X]  ━━━━━━━━━━━━━  ❤ 4 */
export function LessonHeader({ progress, hearts, challenge, legendary, onExit }: LessonHeaderProps) {
  return (
    <header className="flex items-center gap-3 py-3 sm:gap-5 sm:py-5">
      <IconButton label="Exit lesson" icon={<X className="size-7" strokeWidth={3} />} onClick={onExit} />
      <ProgressBar
        value={progress}
        tone={legendary ? "grape" : "leaf"}
        size="md"
        label="Lesson progress"
        className="flex-1"
      />
      {challenge ??
        (hearts && (
          <AnimatedStat
            value={hearts.current}
            icon={<HeartIcon className="size-7" />}
            tone="cherry"
            label={`${hearts.current} of ${hearts.max} hearts`}
            onIncrease="bounce"
            onDecrease="shake"
          />
        ))}
    </header>
  );
}
