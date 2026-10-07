"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui";
import { useLogin } from "@/hooks/api/useAuth";
import { toApiError } from "@/lib/api/errors";

import { AuthField, AuthPage, EMAIL_PATTERN, FormError, useRedirectWhenSignedIn } from "./AuthPage";

type Errors = { email?: string; password?: string; form?: string };

function validate(email: string, password: string): Errors {
  const errors: Errors = {};
  if (!email) errors.email = "Enter your email.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "That email address doesn't look right.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

/** Log in with the email and password of an existing account; the API issues the session. */
export function LoginView() {
  const login = useLogin();
  const redirecting = useRedirectWhenSignedIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(email.trim(), password);
    setErrors(found);
    if (found.email || found.password) return;

    login.mutate(
      { identifier: email.trim(), password },
      {
        onError: (error) => {
          const apiError = toApiError(error);
          setErrors({
            form:
              apiError.status === 401
                ? "Wrong email or password."
                : apiError.kind === "network"
                  ? "We couldn't reach the server. Check your connection and try again."
                  : "Something went wrong. Please try again.",
          });
        },
      },
    );
  }

  return (
    <AuthPage title="Log in" switchTo={{ href: "/welcome", label: "Sign up" }}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <AuthField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <AuthField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        {errors.form && <FormError>{errors.form}</FormError>}
        <Button type="submit" variant="secondary" size="lg" fullWidth loading={login.isPending || redirecting} className="mt-2">
          Log in
        </Button>
      </form>
    </AuthPage>
  );
}
