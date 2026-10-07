import { Flame, Newspaper, Settings, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

import {
  LeaderboardNavIcon,
  LearnNavIcon,
  ProfileNavIcon,
  QuestsNavIcon,
  ShopNavIcon,
  type NavIconProps,
} from "@/components/icons/NavIcons";

export interface PrimaryNavItem {
  href: string;
  label: string;
  icon: ComponentType<NavIconProps>;
}

export interface MoreNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * The primary navigation is deliberately short (it mirrors the product's core loop). Everything
 * else lives behind "More" so new screens never crowd the main Learn composition.
 */
export const PRIMARY_ITEMS: readonly PrimaryNavItem[] = [
  { href: "/learn", label: "Learn", icon: LearnNavIcon },
  { href: "/leaderboard", label: "Leaderboards", icon: LeaderboardNavIcon },
  { href: "/quests", label: "Quests", icon: QuestsNavIcon },
  { href: "/shop", label: "Shop", icon: ShopNavIcon },
  { href: "/profile", label: "Profile", icon: ProfileNavIcon },
];

export const MORE_ITEMS: readonly MoreNavItem[] = [
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/streak", label: "Streak", icon: Flame },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
