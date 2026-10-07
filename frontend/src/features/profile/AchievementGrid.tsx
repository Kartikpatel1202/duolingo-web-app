"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { BadgeArt } from "@/components/illustrations";
import { ProgressBar, ResponsiveDialog } from "@/components/ui";
import { formatMonthYear } from "@/lib/format";
import type { ProfileAchievement } from "@/types/api";

import { achievementIcon, achievementTone } from "./achievementVisuals";

/** Badge grid; each badge opens a detail dialog with progress towards it. */
export function AchievementGrid({ achievements }: { achievements: ProfileAchievement[] }) {
  const [selected, setSelected] = useState<ProfileAchievement | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4" aria-label="Achievements">
        {achievements.map((achievement, index) => {
          const earned = achievement.earned_at !== null;
          return (
            <motion.li
              key={achievement.code}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
            >
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`${achievement.title}${earned ? ", earned" : `, ${achievement.progress} of ${achievement.threshold}`}`}
                onClick={() => {
                  setSelected(achievement);
                  setOpen(true);
                }}
                className="focus-ring flex w-full flex-col items-center gap-2 rounded-card p-2 transition-colors hover:bg-mist"
              >
                <BadgeArt
                  icon={achievementIcon(achievement.icon)}
                  tone={achievementTone(achievement.metric)}
                  label={String(achievement.threshold)}
                  earned={earned}
                />
                <span className={earned ? "text-sm font-extrabold text-ink" : "text-sm font-extrabold text-muted"}>
                  {achievement.title}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
      <ResponsiveDialog open={open} onClose={() => setOpen(false)} labelledBy="achievement-title">
        {selected && <AchievementDetail achievement={selected} />}
      </ResponsiveDialog>
    </>
  );
}

function AchievementDetail({ achievement }: { achievement: ProfileAchievement }) {
  const earned = achievement.earned_at !== null;
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <BadgeArt
        icon={achievementIcon(achievement.icon)}
        tone={achievementTone(achievement.metric)}
        label={String(achievement.threshold)}
        earned={earned}
        className="size-32"
      />
      <h2 id="achievement-title" className="text-title font-black text-ink">
        {achievement.title}
      </h2>
      <p className="font-semibold text-muted">{achievement.description}</p>
      <div className="w-full space-y-2">
        <ProgressBar
          value={achievement.progress / achievement.threshold}
          tone={earned ? achievementTone(achievement.metric) : "sun"}
          label={`${achievement.title} progress`}
        />
        <p className="text-sm font-extrabold text-muted">
          {earned && achievement.earned_at
            ? `Earned ${formatMonthYear(achievement.earned_at)}`
            : `${achievement.progress} / ${achievement.threshold}`}
        </p>
      </div>
    </div>
  );
}
