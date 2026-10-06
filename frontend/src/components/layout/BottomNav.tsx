"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

import { NAV_ITEMS, isActive } from "./navItems";

/** Phone navigation, pinned above the home indicator. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={cn(
                  "focus-ring flex size-14 items-center justify-center rounded-tile border-2 transition-colors",
                  active ? "border-sky-400 bg-sky-50 text-sky-500" : "border-transparent text-muted",
                )}
              >
                <Icon className="size-7" strokeWidth={2.4} aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
