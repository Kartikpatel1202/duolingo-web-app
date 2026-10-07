"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui";
import { useSignup } from "@/hooks/api/useAuth";
import { toApiError } from "@/lib/api/errors";

import { AuthField, AuthPage, EMAIL_PATTERN, FormError, useRedirectWhenSignedIn } from "./AuthPage";

/** Mirrors the API's rule (`MIN_PASSWORD_LENGTH`); the server validates it again. */
const MIN_PASSWORD_LENGTH = 8;

type Errors = { email?: string; password?: string; confirm?: string; form?: string };

function validate(email: string, password: string, confirm: string): Errors {
  const errors: Errors = {};
  if (!email) errors.email = "Enter your email.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "That email address doesn't look right.";
  if (!password) errors.password = "Choose a password.";
  else if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!confirm) errors.confirm = "Type your password again.";
  else if (password && confirm !== password) errors.confirm = "The passwords don't match.";
  return errors;
}

/**
 * Create an account. The API stores the learner (with only a hash of the password), signs them in
 * with the same session as a login, and the app opens their learning path.
 */
export function SignupView() {
  const signup = useSignup();
  const redirecting = useRedirectWhenSignedIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(email.trim(), password, confirm);
    setErrors(found);
    if (found.email || found.password || found.confirm) return;

    signup.mutate(
      { email: email.trim(), password },
      {
        onError: (error) => {
          const apiError = toApiError(error);
          if (apiError.code === "EMAIL_TAKEN") {
            setErrors({ email: "An account with this email already exists. Try logging in." });
            return;
          }
          setErrors({
            form:
              apiError.kind === "network"
                ? "We couldn't reach the server. Check your connection and try again."
                : apiError.kind === "validation"
                  ? "Please check your email and password and try again."
                  : "Something went wrong. Please try again.",
          });
        },
      },
    );
  }

  return (
    <AuthPage title="Create your profile" switchTo={{ href: "/login", label: "Log in" }}>
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
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <AuthField
          label="Confirm password"
          type="password"
          name="confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={errors.confirm}
        />
        {errors.form && <FormError>{errors.form}</FormError>}
        <Button type="submit" size="lg" fullWidth loading={signup.isPending || redirecting} className="mt-2">
          Sign up
        </Button>
      </form>
      <p className="text-center text-[15px] font-extrabold uppercase tracking-wide text-muted">
        Already have an account?{" "}
        <Link href="/login" className="focus-ring rounded text-sky-500 hover:text-sky-600">
          Log in
        </Link>
      </p>
    </AuthPage>
  );
}
