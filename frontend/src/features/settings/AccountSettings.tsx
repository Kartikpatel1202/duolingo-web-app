"use client";

import { Avatar, Button, Card, Skeleton } from "@/components/ui";
import { CourseFlag } from "@/components/icons/CourseFlag";
import { useLogout } from "@/hooks/api/useAuth";
import { useCourses } from "@/hooks/api/useEngagement";
import { useCurrentUser } from "@/hooks/api/useLearner";

/** Who is signed in and which course they are taking — both read from the API. */
export function AccountSettings() {
  const { data: user } = useCurrentUser();
  const { data: courses } = useCourses();
  const logout = useLogout();
  const course = courses?.courses.find((entry) => entry.id === user?.current_course_id);

  return (
    <Card as="section" aria-labelledby="account-title" className="space-y-4">
      <h2 id="account-title" className="text-heading font-extrabold text-ink">
        Account
      </h2>
      {user ? (
        <div className="flex items-center gap-4">
          <Avatar name={user.display_name} color={user.avatar_color} />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-ink">{user.display_name}</p>
            <p className="text-sm font-bold text-muted">@{user.username}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            Log out
          </Button>
        </div>
      ) : (
        <Skeleton className="h-12 w-full" />
      )}
      {course && (
        <div className="flex items-center gap-3 border-t-2 border-line pt-4">
          <CourseFlag language={course.learning_language} />
          <p className="flex-1 font-bold text-ink-soft">
            Learning <span className="font-extrabold text-ink">{course.title}</span>
          </p>
        </div>
      )}
    </Card>
  );
}
