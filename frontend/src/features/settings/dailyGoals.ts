import type { DailyGoalOption } from "@/types/api";

/** Labels for the goal options the API accepts (the option values come from the contract). */
export const DAILY_GOALS: readonly { xp: DailyGoalOption; name: string }[] = [
  { xp: 10, name: "Casual" },
  { xp: 20, name: "Regular" },
  { xp: 30, name: "Serious" },
  { xp: 50, name: "Intense" },
];
