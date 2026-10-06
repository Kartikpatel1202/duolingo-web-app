"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/icons/BrandLogo";
import { cn } from "@/lib/cn";

import { NAV_ITEMS, isActive } from "./navItems";

/** Tablet: icon rail (88px). Desktop (lg+): labelled sidebar (240px). Hidden on phones. */
export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col border-r-2 border-line bg-white px-3 py-6 md:flex lg:w-60 lg:px-4">
      <Link href="/learn" className="focus-ring mb-8 flex justify-center rounded-tile lg:justify-start lg:px-3" aria-label="Lingo home">
        <span className="lg:hidden">
          <BrandLogo compact />
        </span>
        <span className="hidden lg:block">
          <BrandLogo />
        </span>
      </Link>
      <nav aria-label="Primary">
        <ul className="flex flex-col gap-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  title={label}
                  className={cn(
                    "focus-ring flex h-12 items-center justify-center gap-4 rounded-tile border-2 px-3 text-[15px] font-extrabold uppercase tracking-wide transition-colors lg:justify-start",
                    active
                      ? "border-sky-400 bg-sky-50 text-sky-600"
                      : "border-transparent text-ink-soft hover:bg-mist",
                  )}
                >
                  <Icon className="size-7 shrink-0" strokeWidth={2.4} aria-hidden />
                  <span className="sr-only lg:not-sr-only">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
