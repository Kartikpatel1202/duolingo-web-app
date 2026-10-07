"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/** How long the card lingers after the mouse leaves, so a quick pass between stat and card is smooth. */
const HIDE_DELAY_MS = 150;

interface StatPopoverProps {
  /** The stat's figure (icon + count), drawn by the stats bar. */
  children: ReactNode;
  /** Classes of the trigger button. */
  className: string;
  /** Accessible name of the card. */
  label: string;
  /** Accessible name of the trigger button, when its content does not name it. */
  triggerLabel?: string;
  /** Widest the card gets (px); it never exceeds the stats bar. */
  width: number;
  /** Colour class for the pointer, so it blends with the card's top edge. */
  pointerClassName?: string;
  /** The card's content; `close` hides it (for links that leave the page). */
  card: (close: () => void) => ReactNode;
}

/**
 * A stat in the stats bar as a button that opens a card beneath it, with a pointer centred under
 * the stat. The card is positioned against the stats bar (its nearest positioned ancestor): as
 * close to centred under the stat as the bar's edges allow, and the pointer is placed on the stat
 * itself, so the card stays attached to it wherever the bar sits.
 *
 * It opens when a mouse hovers the stat and stays open while the mouse is over the stat or the
 * card; leaving both closes it after a short delay, so crossing the gap between them does not make
 * it flicker. Touch and keyboard use the button itself (press to toggle). Escape or a press outside
 * closes it.
 */
export function StatPopover({
  children,
  className,
  label,
  triggerLabel,
  width,
  pointerClassName,
  card,
}: StatPopoverProps) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState({ left: 0, width, pointer: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastPointer = useRef<string>("mouse");

  function cancelHide() {
    clearTimeout(hideTimer.current);
  }
  function hoverStart(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return; // touch "hover" is just the start of a tap
    cancelHide();
    setOpen(true);
  }
  function hoverEnd(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    cancelHide();
    hideTimer.current = setTimeout(() => setOpen(false), HIDE_DELAY_MS);
  }
  useEffect(() => cancelHide, []);

  useLayoutEffect(() => {
    const button = trigger.current;
    const bar = button?.offsetParent;
    if (!open || !button || !bar) return;
    const center = button.offsetLeft + button.offsetWidth / 2;
    const cardWidth = Math.min(width, bar.clientWidth);
    const left = Math.min(Math.max(center - cardWidth / 2, 0), bar.clientWidth - cardWidth);
    setPlace({ left, width: cardWidth, pointer: center - left });
  }, [open, width]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;
      if (trigger.current?.contains(event.target) || panel.current?.contains(event.target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={triggerLabel}
        onPointerEnter={hoverStart}
        onPointerLeave={hoverEnd}
        onPointerDown={(event) => {
          lastPointer.current = event.pointerType;
        }}
        // A mouse click on a stat that opened by hover keeps it open; touch and keyboard toggle.
        onClick={() => setOpen((value) => (lastPointer.current === "mouse" ? true : !value))}
        className={cn(className, open && "bg-mist")}
      >
        {children}
      </button>
      {open && (
        <div
          ref={panel}
          id={panelId}
          role="dialog"
          aria-label={label}
          className="absolute top-full z-50 mt-3"
          style={{ left: place.left, width: place.width }}
          onPointerEnter={hoverStart}
          onPointerLeave={hoverEnd}
        >
          {/* Fills the gap under the stat so the pointer can cross it without leaving the card. */}
          <span aria-hidden className="absolute -top-3 left-0 h-3 w-full" />
          <span
            aria-hidden
            className={cn(
              "absolute -top-[9px] z-10 size-4 -translate-x-1/2 rotate-45 border-t-2 border-l-2 border-line",
              pointerClassName ?? "bg-surface",
            )}
            style={{ left: place.pointer }}
          />
          <div className="overflow-hidden rounded-2xl border-2 border-line bg-surface shadow-[0_4px_0_var(--color-line)]">
            {card(() => setOpen(false))}
          </div>
        </div>
      )}
    </>
  );
}
