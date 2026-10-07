"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export interface PanelProps {
  ref: React.RefObject<HTMLDivElement | null>;
  role: "dialog";
  "aria-modal": true;
  "aria-labelledby": string;
  tabIndex: -1;
}

export interface DialogFrameProps {
  open: boolean;
  onClose: () => void;
  /** When false, Escape and the backdrop do nothing — the dialog's own buttons decide. */
  dismissible?: boolean;
  /** id of the element that names the dialog. */
  labelledBy: string;
  /** Wrapper that positions the panel (centred vs. bottom). */
  placement: string;
  /** The animated panel; spread `panelProps` onto it (dialog role, label, focus ref). */
  renderPanel: (panelProps: PanelProps) => ReactNode;
}

/**
 * Behaviour shared by Modal and BottomSheet: portal, dimmed overlay, Escape to close, focus moved
 * into the dialog and trapped there, focus restored on close, and background scroll locked.
 */
export function DialogFrame({
  open,
  onClose,
  dismissible = true,
  labelledBy,
  placement,
  renderPanel,
}: DialogFrameProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const focusFirst = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      const target = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel;
      target?.focus({ preventScroll: true });
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        if (dismissible) onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFirst);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, dismissible]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-50 flex ${placement}`} role="presentation">
          <motion.div
            className="absolute inset-0 bg-scrim/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissible ? onClose : undefined}
            aria-hidden
          />
          {renderPanel({
            ref: panelRef,
            role: "dialog",
            "aria-modal": true,
            "aria-labelledby": labelledBy,
            tabIndex: -1,
          })}
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
