import type { Metadata } from "next";

import { DemoLoginView } from "@/features/entry/DemoLoginView";

// A shared link, not a page to find: keep it out of search results.
export const metadata: Metadata = { title: "Demo", robots: { index: false } };

/** The shareable demo link: signs the visitor in as the demo learner and opens the path. */
export default function DemoPage() {
  return <DemoLoginView />;
}
