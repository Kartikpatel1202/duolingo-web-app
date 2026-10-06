"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useState, type ReactNode } from "react";

import { ToastProvider } from "@/components/ui";
import { createQueryClient } from "@/lib/api/queryClient";

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session (created lazily so server renders never share a cache).
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {/* Honour the OS "reduce motion" setting for every motion component. */}
      <MotionConfig reducedMotion="user">
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
