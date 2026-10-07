import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article" | "aside" | "li";
  padding?: "none" | "sm" | "md";
}

const PADDING = { none: "", sm: "p-4", md: "p-5" } as const;

export function Card({ as: Tag = "div", padding = "md", className, ...props }: CardProps) {
  return (
    <Tag
      className={cn("rounded-card border-2 border-line bg-surface", PADDING[padding], className)}
      {...props}
    />
  );
}
