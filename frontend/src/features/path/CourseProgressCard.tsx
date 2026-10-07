"use client";

import { CourseFlag } from "@/components/icons/CourseFlag";
import { Card, ProgressBar, Skeleton } from "@/components/ui";
import { useCourses } from "@/hooks/api/useEngagement";
import { useCurrentUser, useProgress } from "@/hooks/api/useLearner";

/** Right-rail card: overall progress through the learner's current course (GET /api/progress). */
export function CourseProgressCard() {
  const { data: user } = useCurrentUser();
  const { data: progress } = useProgress();
  const { data: courses } = useCourses();

  const course = courses?.courses.find((entry) => entry.id === user?.current_course_id);
  const courseProgress = progress?.courses.find((entry) => entry.course_id === user?.current_course_id);

  return (
    <Card as="section" aria-labelledby="course-progress-title">
      {course && courseProgress ? (
        <div className="flex items-center gap-4">
          <CourseFlag language={course.learning_language} className="h-9 w-12 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="course-progress-title" className="text-heading font-extrabold text-ink">
                {course.title}
              </h2>
              <span className="text-sm font-extrabold tabular-nums text-muted">
                {courseProgress.lessons_completed}/{courseProgress.total_lessons} lessons
              </span>
            </div>
            <ProgressBar value={courseProgress.progress} tone="leaf" size="sm" label="Course progress" />
          </div>
        </div>
      ) : (
        <>
          <h2 id="course-progress-title" className="sr-only">
            Course progress
          </h2>
          <Skeleton className="h-12 w-full" />
        </>
      )}
    </Card>
  );
}
