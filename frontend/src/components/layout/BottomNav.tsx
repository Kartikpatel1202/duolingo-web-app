"use client";

import { LogOut } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { MoreNavIcon } from "@/components/icons/NavIcons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useLogout } from "@/hooks/api/useAuth";
import { cn } from "@/lib/cn";

import { MORE_ITEMS, PRIMARY_ITEMS, isActive, type PrimaryNavItem } from "./navItems";

const TAB =
  "focus-ring relative flex size-12 items-center justify-center rounded-tile border-2 transition-colors";
const SHEET_LINK =
  "tactile focus-ring flex min-h-14 items-center gap-4 rounded-tile border-2 border-line bg-surface px-4 font-extrabold uppercase tracking-wide text-ink-soft [--tactile-edge:var(--color-line)]";

/** Phone tab bar (pinned above the home indicator): the primary items plus a "More" sheet. */
export function BottomNav() {
  const pathname = usePathname();
  const logout = useLogout();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ITEMS.some((item) => isActive(pathname, item.href));

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
          {PRIMARY_ITEMS.map((item) => (
            <li key={item.href}>
              <TabLink item={item} active={isActive(pathname, item.href)} />
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-label="More"
              aria-haspopup="dialog"
              onClick={() => setMoreOpen(true)}
              className={cn(TAB, moreActive ? "border-sky-400 bg-sky-50" : "border-transparent")}
            >
              <MoreNavIcon />
            </button>
          </li>
        </ul>
      </nav>
      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} labelledBy="more-title">
        <h2 id="more-title" className="mb-3 text-heading font-extrabold text-ink">
          More
        </h2>
        <ul className="flex flex-col gap-2 pb-2">
          {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} onClick={() => setMoreOpen(false)} className={SHEET_LINK}>
                <Icon className="size-7 text-sky-500" strokeWidth={2.4} aria-hidden />
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                logout();
              }}
              className={`${SHEET_LINK} w-full`}
            >
              <LogOut className="size-7 text-muted" strokeWidth={2.4} aria-hidden />
              Log out
            </button>
          </li>
        </ul>
      </BottomSheet>
    </>
  );
}

function TabLink({ item, active }: { item: PrimaryNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={cn(TAB, active ? "border-sky-400 bg-sky-50" : "border-transparent")}
    >
      {/* The icon pops slightly when its tab becomes active. */}
      <motion.span animate={{ scale: active ? 1.12 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
        <Icon />
      </motion.span>
    </Link>
  );
}
