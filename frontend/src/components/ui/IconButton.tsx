import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Icon-only buttons must always be labelled for screen readers. */
  label: string;
  icon: ReactNode;
  variant?: "plain" | "outlined";
}

export function IconButton({ label, icon, variant = "plain", className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-tile text-muted",
        "transition-colors hover:bg-mist hover:text-ink-soft disabled:opacity-40",
        variant === "outlined" && "tactile border-2 border-line bg-white [--tactile-edge:var(--color-line)]",
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
