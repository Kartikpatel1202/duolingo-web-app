import { createElement } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

interface LookupIconProps extends LucideProps {
  /** Icon chosen from a lookup table (e.g. a backend icon key → icon map). */
  icon: LucideIcon;
}

/** Renders an icon picked at runtime without declaring a component during render. */
export function LookupIcon({ icon, ...props }: LookupIconProps) {
  return createElement(icon, props);
}
