import type { ReactNode } from "react";

import { CourseFlag } from "@/components/icons/CourseFlag";
import { AppShell } from "@/components/layout/AppShell";
import { LeaguePreviewCard } from "@/features/leaderboard";
import { DailyGoalCard, StatsBar } from "@/features/stats";

/** Shell for the main app pages; feature widgets are passed in as slots. */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      mobileHeader={
        <div className="flex items-center gap-3 px-4 py-2.5">
          <CourseFlag language="es" />
          <StatsBar className="flex-1" />
        </div>
      }
      topBar={<StatsBar className="ml-auto max-w-sm" />}
      rail={
        <>
          <StatsBar />
          <DailyGoalCard />
          <LeaguePreviewCard />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
