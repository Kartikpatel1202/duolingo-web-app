"use client";

import { useEffect, useRef } from "react";

import { ButtonLink } from "@/components/ui";
import { useDemoLogin } from "@/hooks/api/useAuth";
import { useSession } from "@/hooks/useSession";
import { toApiError } from "@/lib/api/errors";

import { AuthPage, FormError, useRedirectWhenSignedIn } from "./AuthPage";

/**
 * The page behind a shared demo link: it asks the API for a demo session as soon as it opens and
 * then goes to the learning path, so the visitor never types anything. No credentials are in the
 * link or in this code; where the API has the demo switched off, the visitor is offered the
 * ordinary login instead.
 */
export function DemoLoginView() {
  const session = useSession();
  const demoLogin = useDemoLogin();
  const started = useRef(false);
  useRedirectWhenSignedIn();

  const { mutate } = demoLogin;
  useEffect(() => {
    // Once only: development's double-run of effects must not ask for two sessions.
    if (session !== "signed-out" || started.current) return;
    started.current = true;
    mutate();
  }, [session, mutate]);

  if (!demoLogin.isError) {
    return (
      <AuthPage title="Opening the demo…" switchTo={{ href: "/login", label: "Log in" }}>
        <p role="status" className="text-center font-bold text-muted">
          Signing you in.
        </p>
      </AuthPage>
    );
  }

  const error = toApiError(demoLogin.error);
  return (
    <AuthPage title="Demo" switchTo={{ href: "/welcome", label: "Sign up" }}>
      <FormError>
        {error.status === 404
          ? "The demo isn't available here."
          : error.kind === "network"
            ? "We couldn't reach the server. Check your connection and try again."
            : "Something went wrong. Please try again."}
      </FormError>
      <ButtonLink href="/login" variant="secondary" size="lg" fullWidth>
        Log in
      </ButtonLink>
    </AuthPage>
  );
}
