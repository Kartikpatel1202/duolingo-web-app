import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/features/auth/AuthGate";
import { LeaguePreviewCard } from "@/features/leaderboard";
import { CourseProgressCard } from "@/features/path";
import { QuestsPreviewCard } from "@/features/quests/QuestsPreviewCard";
import { SuperPromoCard } from "@/features/shop/SuperPromoCard";
import { CourseSwitcher, DailyGoalCard, ReminderBanner, StatsBar } from "@/features/stats";

/** Shell for the signed-in pages; feature widgets are passed in as slots. */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AppShell
        mobileHeader={
          <div className="px-3 py-2">
            <StatsBar leading={<CourseSwitcher />} />
          </div>
        }
        topBar={<StatsBar leading={<CourseSwitcher />} className="ml-auto max-w-md" />}
        rail={
          <>
            <StatsBar leading={<CourseSwitcher />} />
            <SuperPromoCard />
            <LeaguePreviewCard />
            <QuestsPreviewCard />
            <DailyGoalCard />
            <CourseProgressCard />
            <ReminderBanner />
          </>
        }
      >
        {children}
      </AppShell>
    </AuthGate>
  );
}
