import type { Metadata } from "next";

import { LearnView } from "@/features/path";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return <LearnView />;
}
