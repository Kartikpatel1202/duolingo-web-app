"use client";

import { ArrowUp, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { Badge, Button } from "@/components/ui";

/** How far down the page (px) before the scroll-to-top button appears. */
const SHOW_AFTER = 700;

/** Floating button that returns to the top of the path; hidden near the top. */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={() => {
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          // Sits above the phone tab bar, and inside the centre column on wide screens.
          className="tactile focus-ring fixed right-4 bottom-24 z-20 flex size-12 items-center justify-center rounded-tile border-2 border-line bg-surface text-sky-500 [--tactile-edge:var(--color-line)] md:bottom-6 xl:right-[calc(50%-150px)]"
        >
          <ArrowUp className="size-6" strokeWidth={3.5} aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/** Closing card of the path: the next section, which does not exist yet and is shown as locked. */
export function UpNextCard({ section }: { section: number }) {
  return (
    <section
      aria-labelledby="up-next-title"
      className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-3 rounded-panel border-2 border-line px-6 py-8 text-center"
    >
      <Badge>Up next</Badge>
      <h2 id="up-next-title" className="flex items-center gap-2 text-title font-black text-ink-soft">
        <Lock className="size-6" strokeWidth={3} aria-hidden />
        Section {section}
      </h2>
      <p className="max-w-xs font-semibold text-muted">
        More units are on the way. Finish this section to be ready for them.
      </p>
      <Button variant="ghost" fullWidth disabled className="mt-2">
        Coming soon
      </Button>
    </section>
  );
}
