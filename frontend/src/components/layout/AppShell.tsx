import type { ReactNode } from "react";

import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";

interface AppShellProps {
  children: ReactNode;
  /** Phone-only sticky header (< 768px). */
  mobileHeader: ReactNode;
  /** Sticky stats strip above the content on tablet / small desktop (768–1279px). */
  topBar: ReactNode;
  /** Right column on wide screens (≥ 1280px). */
  rail: ReactNode;
}

/**
 * Responsive frame. The layout changes per breakpoint rather than scaling down:
 *   < 768   header + content + bottom tab bar
 *   768+    icon rail + content (stats strip on top)
 *   1024+   labelled sidebar
 *   1280+   labelled sidebar + content + right rail
 * `--shell-top` tells sticky content (unit banners) how much chrome sits above it.
 */
export function AppShell({ children, mobileHeader, topBar, rail }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-white [--shell-top:68px] md:[--shell-top:80px] xl:[--shell-top:24px]">
      <SideNav />
      <div className="md:pl-[88px] lg:pl-60">
        <header className="sticky top-0 z-20 border-b-2 border-line bg-white/95 backdrop-blur md:hidden">
          {mobileHeader}
        </header>
        <div className="mx-auto flex w-full max-w-[1100px] gap-12 px-4 sm:px-6 md:px-8">
          <main id="main" className="min-w-0 flex-1 pt-4 pb-32 md:pb-16 xl:pt-6">
            <div className="sticky top-0 z-20 -mx-2 mb-2 hidden bg-white/95 px-2 py-3 backdrop-blur md:block xl:hidden">
              {topBar}
            </div>
            {children}
          </main>
          <aside className="sticky top-0 hidden h-dvh w-[340px] shrink-0 flex-col gap-5 overflow-y-auto py-6 xl:flex">
            {rail}
          </aside>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
