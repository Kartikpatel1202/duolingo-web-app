/**
 * Lesson sound effects: right answer, wrong answer and lesson complete play the recordings in
 * `public/sounds`. If a file cannot play, the same effect is synthesised with the Web Audio API
 * instead. Preference persists in localStorage; every access is guarded so private mode / SSR
 * are safe.
 */

export type SoundEffect = "correct" | "incorrect" | "complete";

export const SFX_STORAGE_KEY = "lingo-sfx";
const CHANGE_EVENT = "lingo-sfx-change";

/** Recorded effects, served from `public/sounds`. Effects without a file are synthesised. */
const FILES: Partial<Record<SoundEffect, string>> = {
  correct: "/sounds/correct.mp3",
  incorrect: "/sounds/incorrect.mp3",
  complete: "/sounds/complete.mp3",
};

/** [frequency Hz, start offset s, duration s] notes per effect (the synthesised version). */
const NOTES: Record<SoundEffect, [number, number, number][]> = {
  correct: [
    [659.25, 0, 0.12],
    [987.77, 0.09, 0.2],
  ],
  incorrect: [
    [233.08, 0, 0.16],
    [196, 0.13, 0.24],
  ],
  complete: [
    [523.25, 0, 0.14],
    [659.25, 0.12, 0.14],
    [783.99, 0.24, 0.14],
    [1046.5, 0.36, 0.32],
  ],
};

export function soundEnabled(): boolean {
  try {
    return window.localStorage.getItem(SFX_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(SFX_STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Preference is best-effort; the in-memory event still updates this tab.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToSound(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

let context: AudioContext | null = null;
/** One audio element per recorded effect, created on first use and reused (rewound) after that. */
const players = new Map<SoundEffect, HTMLAudioElement>();

export function playSound(effect: SoundEffect): void {
  if (typeof window === "undefined" || !soundEnabled()) return;
  const file = FILES[effect];
  if (!file || typeof window.Audio !== "function") {
    synthesise(effect);
    return;
  }
  try {
    let player = players.get(effect);
    if (!player) {
      player = new window.Audio(file);
      player.preload = "auto";
      players.set(effect, player);
    }
    player.currentTime = 0;
    // A missing file or a blocked play() falls back to the synthesised sound.
    void player.play().catch(() => synthesise(effect));
  } catch {
    synthesise(effect);
  }
}

function synthesise(effect: SoundEffect): void {
  if (typeof window.AudioContext !== "function") return;
  try {
    context ??= new window.AudioContext();
    const ctx = context;
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    for (const [frequency, offset, duration] of NOTES[effect]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = effect === "incorrect" ? "triangle" : "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + duration + 0.02);
    }
  } catch {
    // Audio is decoration; never let it break the lesson.
  }
}
