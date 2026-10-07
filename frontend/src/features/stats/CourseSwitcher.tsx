"use client";

import { Calculator, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { CourseFlag } from "@/components/icons/CourseFlag";
import { useCourses } from "@/hooks/api/useEngagement";
import { useCurrentUser } from "@/hooks/api/useLearner";
import { cn } from "@/lib/cn";

import { StatPopover } from "./StatPopover";

/**
 * Entries listed under the learner's courses that are not courses yet (the API only has Spanish):
 * shown in the menu as in the product's design, but they do nothing when pressed.
 */
const OTHER_COURSES: { key: string; name: string; icon: ReactNode }[] = [
  {
    key: "math",
    name: "Math",
    icon: (
      <span className="flex h-7 w-9 items-center justify-center rounded-md bg-sky-500 text-white">
        <Calculator className="size-5" strokeWidth={2.6} aria-hidden />
      </span>
    ),
  },
  { key: "en", name: "English", icon: <CourseFlag language="en" className="h-7 w-9" /> },
  { key: "de", name: "German", icon: <CourseFlag language="de" className="h-7 w-9" /> },
];

const ROW = "flex w-full items-center gap-4 px-4 py-3 text-left text-[17px] font-extrabold";

/**
 * Flag button that opens the "My courses" dropdown on hover (or press), hanging from the flag with
 * its pointer directly under it. The learner's real courses come from GET /api/courses.
 */
export function CourseSwitcher({ className }: { className?: string }) {
  const { data: user } = useCurrentUser();
  const { data } = useCourses();
  const current = data?.courses.find((course) => course.id === user?.current_course_id);
  const owned = new Set(data?.courses.map((course) => course.learning_language));

  return (
    <StatPopover
      className={cn("focus-ring shrink-0 rounded-tile p-1 transition-colors hover:bg-mist", className)}
      label="My courses"
      triggerLabel={`Choose course${current ? ` (${current.title})` : ""}`}
      width={288}
      card={() => (
        <>
          <p className="px-4 pt-4 pb-2 text-[14px] font-black tracking-wide text-muted uppercase">My courses</p>
          <ul className="pb-1">
            {data?.courses.map((course) => {
              const active = course.id === user?.current_course_id;
              return (
                <li key={course.id}>
                  <span
                    aria-current={active ? "true" : undefined}
                    className={cn(ROW, active ? "bg-sky-100 text-sky-600" : "text-ink-soft")}
                  >
                    <CourseFlag language={course.learning_language} className="h-7 w-9" />
                    {course.title}
                  </span>
                </li>
              );
            })}
            {OTHER_COURSES.filter((course) => !owned.has(course.key)).map((course) => (
              <li key={course.key}>
                <button
                  type="button"
                  aria-disabled
                  title="Coming soon"
                  className={cn(ROW, "cursor-default text-ink-soft hover:bg-mist")}
                >
                  {course.icon}
                  {course.name}
                </button>
              </li>
            ))}
            <li className="mt-1 border-t-2 border-line">
              <button
                type="button"
                aria-disabled
                title="Coming soon"
                className={cn(ROW, "cursor-default rounded-b-2xl text-ink-soft hover:bg-mist")}
              >
                <span className="flex h-7 w-9 items-center justify-center rounded-md border-2 border-line-strong text-muted">
                  <Plus className="size-5" strokeWidth={3} aria-hidden />
                </span>
                Add a new course
              </button>
            </li>
          </ul>
        </>
      )}
    >
      <CourseFlag language={current?.learning_language ?? "es"} />
    </StatPopover>
  );
}
