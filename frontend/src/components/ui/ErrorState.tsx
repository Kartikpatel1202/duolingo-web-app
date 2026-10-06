"use client";

import { CloudOff, RefreshCw, WifiOff } from "lucide-react";

import { friendlyError, toApiError } from "@/lib/api/errors";
import { cn } from "@/lib/cn";

import { Button } from "./Button";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/** Friendly failure UI. Never shows raw error text, status codes or stack traces. */
export function ErrorState({ error, onRetry, retrying, className }: ErrorStateProps) {
  const { title, description } = friendlyError(error);
  const Icon = toApiError(error).kind === "network" ? WifiOff : CloudOff;
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center gap-4 rounded-panel border-2 border-line bg-white px-6 py-10 text-center", className)}
    >
      <span className="flex size-20 items-center justify-center rounded-full bg-cherry-50 text-cherry-500" aria-hidden>
        <Icon className="size-10" strokeWidth={2.5} />
      </span>
      <div className="space-y-1">
        <h2 className="text-heading font-extrabold text-ink">{title}</h2>
        <p className="font-semibold text-muted">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} loading={retrying} icon={<RefreshCw className="size-5" strokeWidth={3} />}>
          Try again
        </Button>
      )}
    </div>
  );
}
