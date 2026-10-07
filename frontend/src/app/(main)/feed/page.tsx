import type { Metadata } from "next";

import { FeedView } from "@/features/feed/FeedView";

export const metadata: Metadata = { title: "Feed" };

export default function FeedPage() {
  return <FeedView />;
}
