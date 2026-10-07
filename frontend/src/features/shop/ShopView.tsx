"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { Badge, Button, ErrorState, Skeleton, useToast } from "@/components/ui";
import { GemIcon } from "@/features/stats";
import { usePurchase, useShop } from "@/hooks/api/useEngagement";
import { friendlyError } from "@/lib/api/errors";
import { BRAND } from "@/lib/brand";
import { newIdempotencyKey } from "@/lib/ids";
import type { ShopItem, ShopItemId } from "@/types/api";

/**
 * Item artwork: the supplied pictures in `public/brand/shop` (used as they are, not redrawn).
 * `tile` pictures come with their own coloured background, so they fill the icon box.
 */
interface ShopArt {
  src: string;
  width: number;
  height: number;
  tile?: boolean;
}

const ART = "/brand/shop";

const ITEM_ART: Record<ShopItemId, ShopArt> = {
  streak_freeze: { src: `${ART}/streak-freeze.png`, width: 49, height: 72 },
  heart_refill: { src: `${ART}/heart-refill.png`, width: 62, height: 55 },
};

const SUPER_ART: ShopArt = { src: `${ART}/super.png`, width: 65, height: 54 };

/** Preview-only items (shown, clearly labelled, but not sold). */
const PREVIEWS: { title: string; description: string; art: ShopArt }[] = [
  {
    title: "XP Boost",
    description: "Double XP for 15 minutes",
    art: { src: `${ART}/xp-boost.png`, width: 102, height: 110, tile: true },
  },
  {
    title: "Timer Boost",
    description: "Extra time in Legendary challenges",
    art: { src: `${ART}/timer-boost.png`, width: 115, height: 90, tile: true },
  },
  {
    title: "Daily Chest",
    description: "A free surprise every day",
    art: { src: `${ART}/daily-chest.png`, width: 186, height: 143 },
  },
];

/** An item's picture in a fixed 56px box, so rows line up whatever the artwork's shape. */
function ShopIcon({ art }: { art: ShopArt }) {
  return (
    <span aria-hidden className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-tile">
      <Image
        src={art.src}
        alt=""
        width={art.width}
        height={art.height}
        unoptimized
        className={art.tile ? "size-full object-cover" : "max-h-full max-w-full object-contain"}
      />
    </span>
  );
}

/** Gem shop: real purchases for streak freezes and heart refills; previews are labelled. */
export function ShopView() {
  const { data, error, refetch, isFetching } = useShop();
  const purchase = usePurchase();
  const toast = useToast();

  if (error) return <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />;

  function buy(item: ShopItem) {
    purchase.mutate({ itemId: item.id, purchaseId: newIdempotencyKey() }, {
      onSuccess: () => toast.show({ tone: "success", title: `${item.name} purchased!` }),
      onError: (purchaseError) => toast.show({ tone: "error", ...friendlyError(purchaseError) }),
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-title font-black text-ink">Shop</h1>
        <span className="flex items-center gap-1.5 text-heading font-black text-sky-500" aria-label={`${data?.gems ?? 0} gems`}>
          <GemIcon className="size-7" /> {data ? data.gems : <Skeleton className="h-6 w-12" />}
        </span>
      </header>

      <section className="relative overflow-hidden rounded-panel bg-[linear-gradient(120deg,var(--color-grape-600),var(--color-sky-600))] p-5 text-white">
        <div className="relative z-10 max-w-[65%] space-y-3">
          {/* The same supplied badge and mascot as the Super card in the right rail. */}
          <Image src="/brand/path/super-badge.png" alt="Super" width={78} height={21} unoptimized />
          <p className="text-heading font-black">Unlimited hearts, no interruptions</p>
          <Button variant="ghost" size="sm" disabled>
            Coming soon
          </Button>
        </div>
        <Image
          src="/brand/path/super-duo.png"
          alt=""
          aria-hidden
          width={134}
          height={120}
          unoptimized
          className="absolute top-1/2 right-4 -translate-y-1/2"
        />
      </section>

      <Section title="Power-ups">
        {data ? (
          data.items.map((item) => (
            <ItemRow key={item.id} item={item} onBuy={() => buy(item)} busy={purchase.isPending && purchase.variables?.itemId === item.id} />
          ))
        ) : (
          <Skeleton className="h-40 w-full" />
        )}
      </Section>

      <Section title="Subscriptions">
        <PreviewRow art={SUPER_ART} title={`Super ${BRAND.name}`} description="Unlimited hearts and more" />
      </Section>

      <Section title="Special offers">
        {PREVIEWS.map((preview) => (
          <PreviewRow key={preview.title} art={preview.art} title={preview.title} description={preview.description} />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `shop-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-heading font-extrabold text-ink">
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function ItemRow({ item, onBuy, busy }: { item: ShopItem; onBuy: () => void; busy: boolean }) {
  return (
    <div className="flex items-center gap-4 rounded-card border-2 border-line p-4" data-shop-item={item.id}>
      <ShopIcon art={ITEM_ART[item.id]} />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-ink">{item.name}</p>
        <p className="text-sm font-semibold text-muted">{item.description}</p>
        {item.owned !== null && (
          <p className="text-sm font-extrabold text-sky-600">
            {item.owned} / {item.max_owned} equipped
          </p>
        )}
        {!item.available && item.unavailable_reason && (
          <p className="text-sm font-extrabold text-muted">{item.unavailable_reason}</p>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onBuy}
        loading={busy}
        disabled={!item.available}
        aria-label={`Buy ${item.name} for ${item.price_gems} gems`}
        title={item.unavailable_reason ?? undefined}
        className="shrink-0"
      >
        <span className="flex items-center gap-1">
          <GemIcon className="size-4" /> {item.price_gems}
        </span>
      </Button>
    </div>
  );
}

function PreviewRow({ art, title, description }: { art: ShopArt; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 rounded-card border-2 border-dashed border-line p-4 opacity-80">
      <ShopIcon art={art} />
      <div className="flex-1">
        <p className="font-extrabold text-ink">{title}</p>
        <p className="text-sm font-semibold text-muted">{description}</p>
      </div>
      <Badge>Coming soon</Badge>
    </div>
  );
}
