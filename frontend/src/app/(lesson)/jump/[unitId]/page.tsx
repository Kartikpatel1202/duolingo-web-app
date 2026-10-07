import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JumpAheadScreen } from "@/features/lesson";

export const metadata: Metadata = { title: "Jump ahead" };

interface JumpPageProps {
  params: Promise<{ unitId: string }>;
}

export default async function JumpPage({ params }: JumpPageProps) {
  const unitId = Number((await params).unitId);
  if (!Number.isInteger(unitId) || unitId <= 0) notFound();
  return <JumpAheadScreen unitId={unitId} />;
}
