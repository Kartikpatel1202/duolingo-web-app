import { BrandLogo } from "@/components/icons/BrandLogo";
import { AudioButton } from "@/components/ui";

interface PromptBubbleProps {
  text: string;
  /** Language of `text`; enables the speaker button. */
  language?: string | null;
}

/** The mascot "saying" the sentence to translate, with optional pronunciation. */
export function PromptBubble({ text, language }: PromptBubbleProps) {
  return (
    <div className="flex items-end gap-3">
      <BrandLogo compact className="shrink-0 [&_svg]:size-16 sm:[&_svg]:size-20" />
      <div className="relative flex items-center gap-3 rounded-card border-2 border-line bg-surface px-4 py-3">
        {language && <AudioButton text={text} language={language} />}
        <p lang={language ?? undefined} className="text-xl font-bold text-ink">
          {text}
        </p>
        <span
          aria-hidden
          className="absolute top-1/2 -left-[9px] size-4 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-line bg-surface"
        />
      </div>
    </div>
  );
}
