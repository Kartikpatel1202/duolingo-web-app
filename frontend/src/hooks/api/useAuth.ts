"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { api, request } from "@/lib/api/client";
import { clearSession, saveSession } from "@/lib/auth/session";

/** Sign in. On success the session token is stored and any cached data is dropped. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ identifier, password }: { identifier: string; password: string }) =>
      request(api.POST("/api/auth/login", { body: { identifier, password } })),
    onSuccess: (session) => {
      queryClient.clear();
      saveSession(session.token);
    },
  });
}

/** Create an account. The API answers with a session, exactly as a login does. */
export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      request(api.POST("/api/auth/signup", { body: { email, password } })),
    onSuccess: (session) => {
      queryClient.clear();
      saveSession(session.token);
    },
  });
}

/** Sign in as the demo learner, for the shareable `/demo` link. The API decides if that is allowed. */
export function useDemoLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request(api.POST("/api/auth/demo")),
    onSuccess: (session) => {
      queryClient.clear();
      saveSession(session.token);
    },
  });
}

/**
 * Sign out: tell the server (best effort), forget the token and load the public landing page.
 *
 * The landing page is opened with a full page load rather than a client-side navigation: that
 * discards everything held in memory about the learner. The token is removed without notifying
 * listeners, so the route guard cannot react to it and send the visitor to the login page first.
 */
export function useLogout(): () => void {
  return useCallback(() => {
    void api.POST("/api/auth/logout").catch(() => undefined);
    // Silent: nothing may react to the cleared session before the page is replaced.
    clearSession({ notify: false });
    // A full page load is the point (see above), so this is not a client-side navigation.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }, []);
}
