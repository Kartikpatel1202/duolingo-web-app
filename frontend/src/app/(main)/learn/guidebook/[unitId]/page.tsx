import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuidebookView } from "@/features/guidebook/GuidebookView";

export const metadata: Metadata = { title: "Guidebook" };

export default async function GuidebookPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const id = Number(unitId);
  if (!Number.isInteger(id) || id < 1) notFound();
  return <GuidebookView unitId={id} />;
}
