"use client";

import { Bell, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/cn";
import { DuoMascot } from "@/components/illustrations";
import { Button, IconButton } from "@/components/ui";

const STORAGE_KEY = "lingo-reminder-banner";
const CHANGE_EVENT = "lingo-reminder-banner-change";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function isDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dismissed";
  } catch {
    return true;
  }
}

function dismiss() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "dismissed");
  } catch {
    // Without storage the banner simply hides for this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Practice-reminder prompt. "Allow" asks the browser for notification permission (if supported);
 * either choice hides the banner for this browser. Reminders themselves are not scheduled — this
 * is a product mock and labelled as such in the docs.
 */
export function ReminderBanner({ className }: { className?: string }) {
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => true);

  async function allow() {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission().catch(() => undefined);
    }
    dismiss();
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.aside
          aria-label="Practice reminders"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className={cn("flex items-center gap-3 overflow-hidden rounded-card bg-sky-500 py-2 pr-2 pl-3 text-white", className)}
        >
          <DuoMascot state="idle" className="hidden size-12 shrink-0 min-[400px]:block" />
          <p className="min-w-0 flex-1 text-sm font-extrabold sm:text-base">You&apos;re missing out on practice reminders!</p>
          <Button size="sm" variant="ghost" onClick={() => void allow()} icon={<Bell className="size-4" strokeWidth={3} />}>
            Allow
          </Button>
          <IconButton label="Dismiss reminders" icon={<X className="size-5" strokeWidth={3} />} onClick={dismiss} className="text-white hover:bg-white/15 hover:text-white" />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
