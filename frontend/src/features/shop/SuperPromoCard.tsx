import Image from "next/image";

import { ButtonLink, Card } from "@/components/ui";

/** Right-rail teaser for the (mock) subscription; it leads to the shop, where it is labelled. */
export function SuperPromoCard() {
  return (
    <Card as="section" aria-labelledby="super-promo-title" className="relative overflow-hidden">
      {/* Badge and mascot are artwork cut from the reference (`public/brand/path`). */}
      <Image src="/brand/path/super-badge.png" alt="Super" width={78} height={21} unoptimized />
      <div className="mt-3 max-w-[62%] space-y-1.5">
        <h2 id="super-promo-title" className="text-[17px] font-extrabold text-ink-soft">
          Try Super for free
        </h2>
        <p className="text-sm font-semibold text-muted">No ads, personalized practice, and unlimited Legendary!</p>
      </div>
      <Image
        src="/brand/path/super-duo.png"
        alt=""
        aria-hidden
        width={112}
        height={101}
        unoptimized
        className="absolute top-3 right-3"
      />
      <ButtonLink href="/shop" variant="super" fullWidth className="mt-4">
        Try 1 week free
      </ButtonLink>
    </Card>
  );
}
