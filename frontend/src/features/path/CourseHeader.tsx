"use client";

import { Card, Button, ProgressBar, Skeleton } from "@/components/ui";
import { CourseFlag } from "@/components/icons/CourseFlag";
import { useProgress } from "@/hooks/api/useLearner";
import type { Course } from "@/types/api";

interface CourseHeaderProps {
  course: Course;
  /** Opens the learner's current skill; absent when the course is finished. */
  onContinue?: () => void;
}

/** Course title with overall progress (from GET /api/progress) and a "continue" shortcut. */
export function CourseHeader({ course, onContinue }: CourseHeaderProps) {
  const { data: progress } = useProgress();
  const courseProgress = progress?.courses.find((entry) => entry.course_id === course.id);

  return (
    <Card as="section" aria-labelledby="course-title" className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-4">
        <CourseFlag language={course.learning_language} className="hidden h-10 w-13 md:block" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <h1 id="course-title" className="text-title font-black text-ink">
              {course.title}
            </h1>
            {courseProgress ? (
              <span className="text-sm font-extrabold tabular-nums text-muted">
                {courseProgress.lessons_completed}/{courseProgress.total_lessons} lessons
              </span>
            ) : (
              <Skeleton className="h-4 w-20" />
            )}
          </div>
          <ProgressBar value={courseProgress?.progress ?? 0} tone="leaf" size="sm" label="Course progress" />
        </div>
      </div>
      {onContinue && (
        <Button onClick={onContinue} className="sm:w-auto" fullWidth>
          Continue
        </Button>
      )}
    </Card>
  );
}
