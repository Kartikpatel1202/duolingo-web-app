import { Check, RotateCcw } from "lucide-react";

import type { ReviewItem } from "../../state/lessonMachine";

/** What was asked and the correct answers, flagging exercises that needed a retry. */
export function ReviewList({ items }: { items: ReviewItem[] }) {
  return (
    <section aria-labelledby="review-title" className="w-full space-y-3 text-left">
      <h2 id="review-title" className="text-heading font-extrabold text-ink">
        Lesson review
      </h2>
      <ol className="divide-y-2 divide-line rounded-card border-2 border-line">
        {items.map((item) => (
          <li key={item.exerciseId} className="flex items-start gap-3 p-3">
            {item.hadMistake ? (
              <RotateCcw className="mt-0.5 size-5 shrink-0 text-cherry-500" strokeWidth={3} aria-label="Needed a retry" />
            ) : (
              <Check className="mt-0.5 size-5 shrink-0 text-leaf-500" strokeWidth={3.5} aria-label="Right first time" />
            )}
            <div>
              <p className="text-sm font-bold text-muted">{item.prompt}</p>
              <p className="font-extrabold text-ink">{item.correctAnswer}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
