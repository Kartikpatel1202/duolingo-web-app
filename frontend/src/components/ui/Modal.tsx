"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { springSnappy } from "@/lib/motion";

import { DialogFrame } from "./DialogFrame";
import { IconButton } from "./IconButton";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}

/** Centred dialog for tablet/desktop. */
export function Modal({ open, onClose, labelledBy, children }: DialogProps) {
  return (
    <DialogFrame
      open={open}
      onClose={onClose}
      labelledBy={labelledBy}
      placement="items-center justify-center p-6"
      renderPanel={(panelProps) => (
        <motion.div
          {...panelProps}
          className="relative w-full max-w-md rounded-panel border-2 border-line bg-white p-6 shadow-[0_8px_0_var(--color-line)] outline-none"
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: springSnappy }}
          exit={{ opacity: 0, scale: 0.95, y: 8, transition: { duration: 0.15 } }}
        >
          <IconButton
            label="Close"
            icon={<X className="size-6" strokeWidth={3} />}
            onClick={onClose}
            className="absolute top-3 right-3"
          />
          {children}
        </motion.div>
      )}
    />
  );
}
