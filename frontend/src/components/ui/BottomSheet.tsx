"use client";

import { motion, type PanInfo } from "motion/react";

import { springSnappy } from "@/lib/motion";

import { DialogFrame } from "./DialogFrame";
import type { DialogProps } from "./Modal";

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 600;

/** Mobile dialog that slides up from the bottom; drag the handle down to dismiss. */
export function BottomSheet({ open, onClose, dismissible = true, labelledBy, children }: DialogProps) {
  function onDragEnd(_: unknown, info: PanInfo) {
    if (!dismissible) return;
    if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) onClose();
  }

  return (
    <DialogFrame
      open={open}
      onClose={onClose}
      dismissible={dismissible}
      labelledBy={labelledBy}
      placement="items-end"
      renderPanel={(panelProps) => (
        <motion.div
          {...panelProps}
          className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-panel bg-surface px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none"
          initial={{ y: "100%" }}
          animate={{ y: 0, transition: springSnappy }}
          exit={{ y: "100%", transition: { duration: 0.2 } }}
          drag={dismissible ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={onDragEnd}
        >
          <span className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-line-strong" aria-hidden />
          {children}
        </motion.div>
      )}
    />
  );
}
