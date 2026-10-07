import type { ReactNode } from "react";

import { AuthGate } from "@/features/auth/AuthGate";

/** Lessons are part of the signed-in app: without a session the visitor is sent to log in. */
export default function LessonLayout({ children }: { children: ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
