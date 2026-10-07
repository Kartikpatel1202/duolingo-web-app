import { cn } from "@/lib/cn";

/** Sidebar row: 48px tall, uppercase label, light-blue rounded pill when active. */
export function sideNavItemClasses(active: boolean): string {
  return cn(
    "focus-ring flex h-12 w-full items-center justify-center gap-4 rounded-tile border-2 px-2 text-[15px] font-extrabold uppercase tracking-wide transition-[background-color,border-color,transform] active:scale-[0.97] lg:justify-start lg:px-3",
    active ? "border-sky-400 bg-sky-50 text-sky-500" : "border-transparent text-ink-soft hover:bg-mist",
  );
}
