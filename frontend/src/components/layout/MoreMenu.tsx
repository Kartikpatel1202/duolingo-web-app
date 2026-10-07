"use client";

import { LogOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MoreNavIcon } from "@/components/icons/NavIcons";
import { useLogout } from "@/hooks/api/useAuth";

import { MORE_ITEMS, isActive } from "./navItems";
import { sideNavItemClasses } from "./navStyles";

const LINK =
  "focus-ring flex h-11 items-center gap-3 rounded-tile px-3 text-sm font-extrabold uppercase tracking-wide text-ink-soft hover:bg-mist";

/** Sidebar "More": a small fly-out with the secondary destinations. Closes on Escape/outside click. */
export function MoreMenu() {
  const pathname = usePathname();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const active = MORE_ITEMS.some((item) => isActive(pathname, item.href));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        title="More"
        onClick={() => setOpen((value) => !value)}
        className={sideNavItemClasses(active || open)}
      >
        <MoreNavIcon />
        <span className="sr-only lg:not-sr-only">More</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, x: -8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute bottom-0 left-full z-40 ml-3 w-56 origin-bottom-left rounded-card border-2 border-line bg-surface p-2 shadow-[0_4px_0_var(--color-line)]"
          >
            <ul>
              {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(pathname, href) ? "page" : undefined}
                    className={LINK}
                  >
                    <Icon className="size-5 text-sky-500" strokeWidth={2.6} aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
              <li className="mt-1 border-t-2 border-line pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className={`${LINK} w-full`}
                >
                  <LogOut className="size-5 text-muted" strokeWidth={2.6} aria-hidden />
                  Log out
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
