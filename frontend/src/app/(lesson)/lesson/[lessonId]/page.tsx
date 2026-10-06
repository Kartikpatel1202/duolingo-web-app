import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonPlaceholder } from "@/features/lesson/LessonPlaceholder";

export const metadata: Metadata = { title: "Lesson" };

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const lessonId = Number((await params).lessonId);
  if (!Number.isInteger(lessonId) || lessonId <= 0) notFound();
  return <LessonPlaceholder lessonId={lessonId} />;
}
