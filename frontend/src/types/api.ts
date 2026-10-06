/**
 * Friendly names for the generated OpenAPI schemas.
 *
 * Never hand-write API shapes: everything here is an alias of `schema.d.ts`, which is generated
 * from the FastAPI contract (`npm run gen:api`). A backend change that renames a field therefore
 * breaks `tsc` instead of breaking at runtime.
 */
import type { components } from "@/lib/api/schema";

type Schemas = components["schemas"];

export type CurrentUser = Schemas["CurrentUserOut"];
export type Hearts = Schemas["HeartsOut"];
export type Streak = Schemas["StreakOut"];
export type DailyGoal = Schemas["DailyGoalOut"];
export type DailyGoalOption = Schemas["UpdateUserIn"]["daily_goal_xp"];

export type Course = Schemas["CourseOut"];
export type CoursePath = Schemas["PathOut"];
export type PathUnit = Schemas["PathUnitOut"];
export type PathSkill = Schemas["PathSkillOut"];
export type SkillStatus = Schemas["SkillStatus"];
export type SkillDetail = Schemas["SkillDetailOut"];
export type SkillLesson = Schemas["SkillLessonOut"];
export type LessonStatus = Schemas["LessonStatus"];

export type Lesson = Schemas["LessonOut"];
export type Exercise = Lesson["exercises"][number];

export type Progress = Schemas["ProgressOut"];
export type CourseProgress = Schemas["CourseProgressOut"];

export type Leaderboard = Schemas["LeaderboardOut"];
export type LeaderboardRow = Schemas["LeaderboardRowOut"];

export type Profile = Schemas["ProfileOut"];
export type ProfileAchievement = Schemas["ProfileAchievementOut"];

export type ErrorBody = Schemas["ErrorResponse"];
