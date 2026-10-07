import type { Metadata } from "next";

import { StreakView } from "@/features/streak/StreakView";

export const metadata: Metadata = { title: "Streak" };

export default function StreakPage() {
  return <StreakView />;
}
