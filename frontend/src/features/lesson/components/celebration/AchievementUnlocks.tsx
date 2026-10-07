"use client";

import { motion } from "motion/react";

import { BadgeArt } from "@/components/illustrations";
import { achievementIcon } from "@/features/profile/achievementVisuals";

import type { AchievementSummary } from "@/types/api";

/** "Achievement unlocked!" cards — straight from the completion response, never invented. */
export function AchievementUnlocks({ achievements }: { achievements: AchievementSummary[] }) {
  if (achievements.length === 0) return null;
  return (
    <section aria-labelledby="achievements-unlocked" className="w-full space-y-3">
      <h2 id="achievements-unlocked" className="text-label font-black uppercase text-grape-600">
        Achievement unlocked!
      </h2>
      <ul className="flex flex-col gap-3">
        {achievements.map((achievement, i) => (
          <motion.li
            key={achievement.code}
            initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 1 + i * 0.25 }}
            className="flex items-center gap-4 rounded-card border-2 border-grape-100 bg-grape-50 p-3 text-left"
          >
            <BadgeArt icon={achievementIcon(achievement.icon)} tone="grape" earned className="size-16 shrink-0" />
            <div>
              <p className="font-black text-grape-700">{achievement.title}</p>
              <p className="text-sm font-semibold text-grape-600">{achievement.description}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
