"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/icons/BrandLogo";
import { BRAND } from "@/lib/brand";

import { ChessPromo } from "./ChessPromo";
import { MoreMenu } from "./MoreMenu";
import { PRIMARY_ITEMS, isActive } from "./navItems";
import { sideNavItemClasses } from "./navStyles";

/** Tablet: icon rail (88px). Desktop (lg+): labelled sidebar (256px). Hidden on phones. */
export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col border-r-2 border-line bg-surface px-3 pt-7 pb-6 md:flex lg:w-64 lg:px-4">
      <Link
        href="/learn"
        className="focus-ring mb-7 flex justify-center rounded-tile lg:justify-start lg:px-4"
        aria-label={`${BRAND.name} home`}
      >
        <span className="lg:hidden">
          <BrandLogo compact />
        </span>
        <span className="hidden lg:block">
          <BrandLogo wordmarkOnly />
        </span>
      </Link>
      <nav aria-label="Primary">
        <ul className="flex flex-col gap-2">
          {PRIMARY_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  title={label}
                  className={sideNavItemClasses(active)}
                >
                  <Icon />
                  <span className="sr-only lg:not-sr-only">{label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <MoreMenu />
          </li>
        </ul>
      </nav>
      <ChessPromo />
    </aside>
  );
}
