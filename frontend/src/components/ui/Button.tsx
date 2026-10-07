import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "reward" | "ghost" | "super";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-leaf-500 text-white [--tactile-edge:var(--color-leaf-600)]",
  secondary: "bg-sky-500 text-white [--tactile-edge:var(--color-sky-600)]",
  super: "bg-indigo-500 text-white [--tactile-edge:var(--color-indigo-600)]",
  danger: "bg-cherry-500 text-white [--tactile-edge:var(--color-cherry-600)]",
  reward: "bg-sun-500 text-ink [--tactile-edge:var(--color-sun-600)]",
  ghost: "border-2 border-line bg-surface text-sky-600 [--tactile-edge:var(--color-line)]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 text-[13px] rounded-tile",
  md: "min-h-12 px-5 text-[15px] rounded-tile",
  lg: "min-h-14 px-6 text-base rounded-card",
};

interface StyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** Shared by <Button> and <ButtonLink> so links and buttons are visually identical. */
export function buttonClasses({ variant = "primary", size = "md", fullWidth, className }: StyleOptions) {
  return cn(
    "tactile focus-ring relative inline-flex select-none items-center justify-center gap-2",
    "font-extrabold uppercase tracking-wide whitespace-nowrap",
    "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-locked disabled:text-muted",
    "disabled:shadow-none disabled:[--tactile-edge:transparent]",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleOptions {
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {/* Content stays in the layout while loading, so the button never changes size. */}
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {icon}
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="size-5 animate-spin rounded-full border-[3px] border-current border-r-transparent" />
        </span>
      )}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleOptions & { icon?: ReactNode };

export function ButtonLink({ variant, size, fullWidth, className, icon, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}
