"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The right-hand column. It stays on screen while the page scrolls, and never clips its cards:
 * when it is taller than the window it scrolls with the page until its last card is visible, then
 * stays pinned there (a plain `sticky top-0` would hide the bottom cards, and an inner scroll area
 * needs a scrollbar). It does this by sticking at `top = window height − its own height`.
 */
export function StickyRail({ children }: { children: ReactNode }) {
  const rail = useRef<HTMLElement>(null);
  const [top, setTop] = useState(0);

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () => setTop(Math.min(0, window.innerHeight - element.offsetHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <aside
      ref={rail}
      className="sticky hidden w-[368px] shrink-0 flex-col gap-5 self-start py-6 xl:flex [&>*]:shrink-0"
      style={{ top }}
    >
      {children}
    </aside>
  );
}
