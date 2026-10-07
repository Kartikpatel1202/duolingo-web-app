"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { ButtonLink } from "@/components/ui";
import { useSession } from "@/hooks/useSession";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Where to go once signed in: the page the visitor was sent here from, if it is one of ours. */
function destination(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/learn";
}

/**
 * Sends a signed-in visitor into the app. Login and sign-up both use it: it covers arriving
 * while already signed in and the moment right after a successful submit.
 * Returns true while the redirect is under way, so forms can stay in their busy state.
 */
export function useRedirectWhenSignedIn(): boolean {
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session === "signed-in") router.replace(destination());
  }, [session, router]);
  return session === "signed-in";
}

interface AuthPageProps {
  title: string;
  /** The link in the top-right corner that leads to the other form. */
  switchTo: { href: string; label: string };
  children: ReactNode;
}

/** Shared frame for the login and sign-up pages: close button, switch link, centred form. */
export function AuthPage({ title, switchTo, children }: AuthPageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Link href="/" aria-label="Close" className="focus-ring rounded-tile p-2 text-muted hover:bg-mist">
          <X className="size-6" strokeWidth={3} aria-hidden />
        </Link>
        <ButtonLink href={switchTo.href} variant="ghost" size="sm">
          {switchTo.label}
        </ButtonLink>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center gap-6 px-5 pb-24">
        <h1 className="text-center text-title font-black text-ink">{title}</h1>
        {children}
      </main>
    </div>
  );
}

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  error?: string;
}

/** A form field in the entry pages' style, with its error message announced and linked to it. */
export function AuthField({ label, error, ...input }: AuthFieldProps) {
  const errorId = useId();
  return (
    <div>
      <input
        aria-label={label}
        placeholder={label}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`focus-ring h-14 w-full rounded-card border-2 bg-mist px-4 text-[17px] font-bold text-ink placeholder:text-muted ${
          error ? "border-cherry-500" : "border-line"
        }`}
        {...input}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm font-bold text-cherry-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** The message shown above the submit button when the server rejects the form. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-tile bg-cherry-50 px-4 py-3 font-bold text-cherry-700">
      {children}
    </p>
  );
}
