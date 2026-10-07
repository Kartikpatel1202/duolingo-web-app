import type { Metadata } from "next";

import { QuestsView } from "@/features/quests/QuestsView";

export const metadata: Metadata = { title: "Quests" };

export default function QuestsPage() {
  return <QuestsView />;
}
