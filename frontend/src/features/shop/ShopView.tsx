"use client";

import { Clock3, Gift, Heart, Infinity as InfinityIcon, Snowflake, Sparkles, Zap, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { DuoMascot } from "@/components/illustrations";
import { Badge, Button, ErrorState, Skeleton, useToast } from "@/components/ui";
import { GemIcon } from "@/features/stats";
import { usePurchase, useShop } from "@/hooks/api/useEngagement";
import { friendlyError } from "@/lib/api/errors";
import { BRAND } from "@/lib/brand";
import { newIdempotencyKey } from "@/lib/ids";
import type { ShopItem, ShopItemId } from "@/types/api";

const ITEM_ICONS: Record<ShopItemId, { icon: LucideIcon; className: string }> = {
  streak_freeze: { icon: Snowflake, className: "bg-sky-100 text-sky-500" },
  heart_refill: { icon: Heart, className: "bg-cherry-50 text-cherry-500" },
};

/** Preview-only items (shown, clearly labelled, but not sold). */
const PREVIEWS: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "XP Boost", description: "Double XP for 15 minutes", icon: Zap },
  { title: "Timer Boost", description: "Extra time in Legendary challenges", icon: Clock3 },
  { title: "Daily Chest", description: "A free surprise every day", icon: Gift },
];

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
          <Badge tone="grape" icon={<Sparkles className="size-3.5" />}>
            Super
          </Badge>
          <p className="text-heading font-black">Unlimited hearts, no interruptions</p>
          <Button variant="ghost" size="sm" disabled>
            Coming soon
          </Button>
        </div>
        <DuoMascot state="celebrating" className="absolute -right-2 -bottom-4 size-36" />
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
        <PreviewRow icon={InfinityIcon} title={`Super ${BRAND.name}`} description="Unlimited hearts and more" />
      </Section>

      <Section title="Special offers">
        {PREVIEWS.map((preview) => (
          <PreviewRow key={preview.title} icon={preview.icon} title={preview.title} description={preview.description} />
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
  const visual = ITEM_ICONS[item.id];
  const Icon = visual.icon;
  return (
    <div className="flex items-center gap-4 rounded-card border-2 border-line p-4" data-shop-item={item.id}>
      <span className={`flex size-14 shrink-0 items-center justify-center rounded-tile ${visual.className}`} aria-hidden>
        <Icon className="size-8" strokeWidth={2.4} />
      </span>
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

function PreviewRow({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 rounded-card border-2 border-dashed border-line p-4 opacity-80">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-tile bg-mist text-muted" aria-hidden>
        <Icon className="size-8" strokeWidth={2.4} />
      </span>
      <div className="flex-1">
        <p className="font-extrabold text-ink">{title}</p>
        <p className="text-sm font-semibold text-muted">{description}</p>
      </div>
      <Badge>Coming soon</Badge>
    </div>
  );
}
