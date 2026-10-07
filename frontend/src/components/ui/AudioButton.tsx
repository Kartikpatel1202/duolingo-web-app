"use client";

import { Volume2, VolumeX } from "lucide-react";
import { motion } from "motion/react";

import { useSpeech } from "@/hooks/useSpeech";
import { cn } from "@/lib/cn";

interface AudioButtonProps {
  text: string;
  /** BCP-47 language of `text` (e.g. "es"). */
  language: string;
  size?: "md" | "lg";
  /** "tile" is the raised blue button used in lessons; "plain" is a bare speaker for reading lists. */
  variant?: "tile" | "plain";
  className?: string;
}

const SIZES = { md: "size-11", lg: "size-14" } as const;

/** Tactile speaker button: plays the pronunciation, tap again to stop. */
export function AudioButton({ text, language, size = "md", variant = "tile", className }: AudioButtonProps) {
  const { supported, speak, stop, speakingText } = useSpeech();
  const playing = speakingText === text;
  const label = !supported
    ? "Audio is not available in this browser"
    : playing
      ? "Stop audio"
      : `Listen to “${text}”`;

  return (
    <button
      type="button"
      onClick={() => (playing ? stop() : speak(text, language))}
      disabled={!supported}
      aria-label={label}
      title={label}
      aria-pressed={supported ? playing : undefined}
      className={cn(
        "focus-ring relative inline-flex shrink-0 items-center justify-center rounded-tile",
        variant === "tile"
          ? cn(
              "tactile bg-sky-500 text-white [--tactile-edge:var(--color-sky-600)]",
              "disabled:cursor-not-allowed disabled:bg-locked disabled:text-muted disabled:shadow-none",
              SIZES[size],
            )
          : cn(
              "size-11 text-sky-500 transition-transform hover:bg-sky-50 active:scale-90",
              "disabled:cursor-not-allowed disabled:text-muted",
              playing && "bg-sky-50",
            ),
        className,
      )}
    >
      {!supported ? (
        <VolumeX className="size-6" strokeWidth={2.6} aria-hidden />
      ) : playing ? (
        <>
          <motion.span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-tile border-2 border-sky-400",
              variant === "plain" && "hidden",
            )}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.35 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut" }}
          />
          <SoundWave />
        </>
      ) : (
        <Volume2 className="size-6" strokeWidth={2.6} aria-hidden />
      )}
    </button>
  );
}

/** Three bars bouncing out of phase while speech plays. */
function SoundWave() {
  return (
    <span aria-hidden className="flex h-5 items-center gap-0.5" data-playing>
      {[0, 0.15, 0.3].map((delay) => (
        <motion.span
          key={delay}
          className="w-1 rounded-full bg-current"
          initial={{ height: 6 }}
          animate={{ height: [6, 18, 6] }}
          transition={{ duration: 0.7, repeat: Infinity, delay, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}
