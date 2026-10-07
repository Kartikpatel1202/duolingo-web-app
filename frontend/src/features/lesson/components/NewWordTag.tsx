/** "● NEW WORD" label above a prompt that introduces a word (set by the exercise's `label`). */
export function NewWordTag() {
  return (
    <p className="flex items-center gap-2 text-[13px] font-black tracking-wide text-grape-500 uppercase">
      <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
        <circle cx="10" cy="10" r="10" fill="currentColor" />
        <circle cx="7.2" cy="7.4" r="1.7" fill="white" />
        <circle cx="12.6" cy="9" r="1.7" fill="white" />
        <circle cx="8.6" cy="13" r="1.7" fill="white" />
      </svg>
      New word
    </p>
  );
}
