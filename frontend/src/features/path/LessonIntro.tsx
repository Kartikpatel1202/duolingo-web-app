"use client";

import { Crown } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

import { TONE_TEXT, type Tone } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PathSkill } from "@/types/api";

import { NODE_FILL } from "./skillPresentation";
import { useSkillActions } from "./useSkillActions";

interface LessonIntroProps {
  skill: PathSkill;
  /** The unit's title, shown as the card's heading (the unit being practised). */
  unitTitle: string;
  unitTone: Tone;
  onClose: () => void;
}

/** The white button's label colour and 3D edge, taken from the unit's colour. */
const BUTTON_STYLE: Partial<Record<Tone, string>> = {
  lime: "text-lime-600 [--tactile-edge:#d9e3d1]",
  purple: "text-purple-500 [--tactile-edge:#e5e5e5]",
};

/**
 * The card that opens under a path node before a lesson starts: unit title, "Lesson n of m" and
 * START +XP. It only navigates to the lesson page; the attempt is created there, by the API.
 *
 * It sits over the path (not in a dialog), so the learner keeps their place. Escape or a press
 * anywhere outside closes it.
 */
export function LessonIntro({ skill, unitTitle, unitTone, onClose }: LessonIntroProps) {
  const { detail, nextLesson, startLesson, legendaryLesson, startLegendary } = useSkillActions(skill);
  const root = useRef<HTMLDivElement>(null);
  const completed = skill.status === "completed";
  const number = Math.min(skill.lessons_completed + 1, skill.total_lessons);

  useEffect(() => {
    root.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    // Bring the whole card (and its button) into view when it opens near the screen edge.
    root.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });

    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node) || root.current?.contains(event.target)) return;
      onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // A unit the learner has not reached has no lesson to start yet, but the card still names the
  // reward of its first lesson; the button stays off until the API unlocks it.
  const reward = (nextLesson ?? detail?.lessons[0])?.xp_reward;
  const action = completed ? "Practice again" : reward != null ? `Start +${reward} XP` : "Start";

  return (
    <motion.div
      ref={root}
      role="dialog"
      aria-modal="false"
      aria-label={`${skill.title}, lesson ${number} of ${skill.total_lessons}`}
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="relative w-full"
    >
      <div
        className={cn(
          "rounded-card px-5 pt-4 pb-5 text-white shadow-[0_6px_0_var(--tactile-edge)]",
          NODE_FILL[unitTone],
        )}
      >
        <h2 className="text-heading font-extrabold">{unitTitle}</h2>
        <p className="mt-0.5 font-bold text-white/90">
          {completed ? `${skill.total_lessons} lessons complete` : `Lesson ${number} of ${skill.total_lessons}`}
        </p>
        <button
          type="button"
          data-autofocus
          onClick={startLesson}
          disabled={skill.next_lesson_id == null}
          className={cn(
            "tactile focus-ring mt-4 flex h-14 w-full items-center justify-center rounded-card bg-white text-[17px] font-black tracking-wide uppercase disabled:cursor-not-allowed disabled:opacity-60",
            BUTTON_STYLE[unitTone] ?? `${TONE_TEXT[unitTone]} [--tactile-edge:#e5e5e5]`,
          )}
        >
          {action}
        </button>
        {legendaryLesson && (
          <button
            type="button"
            onClick={startLegendary}
            className="tactile focus-ring mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-card bg-grape-500 text-[15px] font-black tracking-wide text-white uppercase [--tactile-edge:var(--color-grape-600)]"
          >
            <Crown className="size-5" fill="currentColor" aria-hidden />
            Legendary
          </button>
        )}
      </div>
    </motion.div>
  );
}
