"use client";

import Link from "next/link";

import { BrandLogo } from "@/components/icons/BrandLogo";
import { ButtonLink } from "@/components/ui";
import { BRAND } from "@/lib/brand";

import { useRedirectWhenSignedIn } from "./AuthPage";
import { LandingHero } from "./LandingHero";
import { LanguageStrip } from "./LanguageStrip";
import { SiteLanguageSelect } from "./SiteLanguageSelect";

/**
 * Public entry screen: logo and site language on top, the hero (artwork, headline, the two
 * entry actions) in the middle, and the course strip pinned to the bottom edge. Nothing else.
 */
export function LandingView() {
  // A returning learner with a valid session goes straight to their path, never back to sign-up.
  useRedirectWhenSignedIn();
  return (
    // Always white, like the reference: `data-force-light` switches the dark tokens off here.
    <div data-force-light className="flex min-h-dvh flex-col bg-surface">
      <header className="mx-auto flex h-[72px] w-full max-w-[1000px] shrink-0 items-center justify-between gap-3 px-5">
        <Link href="/" className="focus-ring shrink-0 rounded-tile" aria-label={`${BRAND.name} home`}>
          <BrandLogo landing />
        </Link>
        <SiteLanguageSelect />
      </header>

      <main
        id="main"
        className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col items-center justify-center gap-8 px-6 py-8 md:flex-row md:gap-20"
      >
        <LandingHero className="size-52 shrink-0 sm:size-64 md:size-80" />
        <div className="flex w-full max-w-[500px] flex-col items-center gap-8 text-center">
          {/* Two lines from tablet up, broken after "learn"; phones wrap naturally. */}
          <h1 className="text-[26px] leading-[1.35] font-extrabold text-ink-soft sm:text-[32px] sm:whitespace-nowrap">
            The most fun way to learn <br className="hidden sm:block" />
            languages, chess, and more!
          </h1>
          <div className="flex w-full max-w-[330px] flex-col gap-3">
            <ButtonLink href="/welcome" fullWidth>
              Get started
            </ButtonLink>
            <ButtonLink href="/login" variant="ghost" fullWidth>
              I already have an account
            </ButtonLink>
          </div>
        </div>
      </main>

      <LanguageStrip />
    </div>
  );
}
