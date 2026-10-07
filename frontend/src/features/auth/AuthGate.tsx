"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useSession } from "@/hooks/useSession";

/**
 * Wraps the signed-in part of the app. Without a session it sends the visitor to the login page
 * (remembering where they were going) and renders nothing, so protected screens never flash.
 *
 * This is a convenience for navigation, not the security boundary: the API rejects every learner
 * request without a valid session (401), whatever the browser renders.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (session === "signed-out") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [session, router, pathname]);

  if (session !== "signed-in") return <div className="min-h-dvh bg-surface" aria-busy="true" />;
  return <>{children}</>;
}
