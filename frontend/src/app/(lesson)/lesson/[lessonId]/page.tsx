import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonScreen } from "@/features/lesson";

export const metadata: Metadata = { title: "Lesson" };

interface LessonPageProps {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export default async function LessonPage({ params, searchParams }: LessonPageProps) {
  const lessonId = Number((await params).lessonId);
  if (!Number.isInteger(lessonId) || lessonId <= 0) notFound();
  const mode = (await searchParams).mode === "legendary" ? "legendary" : "standard";
  return <LessonScreen lessonId={lessonId} mode={mode} />;
}
