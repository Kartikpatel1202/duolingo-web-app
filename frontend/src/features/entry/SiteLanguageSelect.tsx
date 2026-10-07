"use client";

import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/cn";

import { LanguageFlag, type FlagCode } from "./LanguageFlag";

interface SiteLanguage {
  code: string;
  /** The language's own name for itself. */
  name: string;
  flag: FlagCode;
}

/**
 * Interface languages offered in the picker. Only English is translated in this build; the others
 * are listed as previews and cannot be selected.
 */
const CURRENT = "en";
const LANGUAGES: readonly SiteLanguage[] = [
  { code: "ar", name: "العربية", flag: "sa" },
  { code: "bn", name: "বাংলা", flag: "in" },
  { code: "cs", name: "Čeština", flag: "cz" },
  { code: "de", name: "Deutsch", flag: "de" },
  { code: "el", name: "Ελληνικά", flag: "gr" },
  { code: "en", name: "English", flag: "us" },
  { code: "es", name: "Español", flag: "es" },
  { code: "fr", name: "Français", flag: "fr" },
  { code: "hi", name: "हिंदी", flag: "in" },
  { code: "hu", name: "Magyar", flag: "hu" },
  { code: "id", name: "Bahasa Indonesia", flag: "id" },
  { code: "it", name: "Italiano", flag: "it" },
  { code: "ja", name: "日本語", flag: "jp" },
  { code: "kn", name: "ಕನ್ನಡ", flag: "in" },
  { code: "ko", name: "한국어", flag: "kr" },
  { code: "mr", name: "मराठी", flag: "in" },
  { code: "nl", name: "Nederlands", flag: "nl" },
  { code: "pa", name: "ਪੰਜਾਬੀ", flag: "in" },
  { code: "pl", name: "Polski", flag: "pl" },
  { code: "pt", name: "Português", flag: "br" },
  { code: "ro", name: "Română", flag: "ro" },
  { code: "ru", name: "Русский", flag: "ru" },
  { code: "sv", name: "svenska", flag: "se" },
  { code: "ta", name: "தமிழ்", flag: "in" },
  { code: "te", name: "తెలుగు", flag: "in" },
  { code: "th", name: "ภาษาไทย", flag: "th" },
  { code: "tl", name: "Tagalog", flag: "ph" },
  { code: "tr", name: "Türkçe", flag: "tr" },
  { code: "uk", name: "Українською", flag: "ua" },
  { code: "ur", name: "اُردُو", flag: "pk" },
  { code: "vi", name: "Tiếng Việt", flag: "vn" },
  { code: "zh", name: "中文", flag: "cn" },
];

const ROW = "flex h-10 items-center gap-3 rounded-tile px-3 text-left text-[15px] font-bold";

/** "Site language" picker for the entry header: a two-column panel of languages with flags. */
export function SiteLanguageSelect() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const current = LANGUAGES.find((language) => language.code === CURRENT);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className="relative min-w-0">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex items-center gap-1.5 rounded-tile px-2 py-2 text-[13px] font-extrabold uppercase tracking-wide text-muted hover:text-ink-soft sm:text-[15px]"
      >
        {/* Phones show just the current language; the full label stays for screen readers. */}
        <span className="sr-only sm:not-sr-only">Site language:</span>
        {current?.name}
        <ChevronDown
          className={cn("size-5 transition-transform", open && "rotate-180")}
          strokeWidth={3}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full right-0 z-30 mt-2 max-h-[min(640px,calc(100dvh-110px))] w-[384px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-panel border-2 border-line bg-surface p-3"
          >
            <ul aria-label="Site language" className="grid grid-cols-2 gap-x-2">
              {LANGUAGES.map((language) => (
                <li key={language.code}>
                  {language.code === CURRENT ? (
                    <button
                      type="button"
                      aria-current="true"
                      onClick={() => setOpen(false)}
                      className={cn(ROW, "focus-ring w-full bg-sky-50 text-sky-700")}
                    >
                      <LanguageFlag code={language.flag} />
                      <span lang={language.code} className="min-w-0 flex-1 truncate">
                        {language.name}
                      </span>
                      <Check className="size-4 shrink-0" strokeWidth={3.5} aria-hidden />
                    </button>
                  ) : (
                    <span
                      aria-disabled="true"
                      title="Coming soon"
                      className={cn(ROW, "cursor-not-allowed text-ink-soft")}
                    >
                      <LanguageFlag code={language.flag} />
                      <span lang={language.code} className="min-w-0 flex-1 truncate">
                        {language.name}
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
