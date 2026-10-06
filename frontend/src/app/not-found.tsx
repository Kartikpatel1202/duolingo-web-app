import { Compass } from "lucide-react";

import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex size-24 items-center justify-center rounded-full bg-sky-100 text-sky-500" aria-hidden>
        <Compass className="size-12" strokeWidth={2.4} />
      </span>
      <h1 className="text-title font-black text-ink">This page wandered off</h1>
      <p className="font-bold text-muted">Let&apos;s get you back to your path.</p>
      <ButtonLink href="/learn">Back to learning</ButtonLink>
    </main>
  );
}
