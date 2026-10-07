"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { pluralize } from "@/lib/format";

import { StatPopover } from "./StatPopover";

interface GemsMenuProps {
  /** The gems figure itself (icon + count), drawn by the stats bar. */
  children: ReactNode;
  className: string;
  gems: number;
}

/** The gems pill as a button that opens a small card beneath it: the balance and a link to the shop. */
export function GemsMenu({ children, className, gems }: GemsMenuProps) {
  return (
    <StatPopover
      className={className}
      label="Your gems"
      width={320}
      card={(close) => (
        <div className="flex items-center gap-5 p-5">
          {/* Artwork cut from the reference (open chest full of gems). */}
          <Image src="/brand/path/gem-chest.png" alt="" width={72} height={84} unoptimized className="shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-title font-black text-ink">Gems</h2>
            <p className="mt-1 font-semibold text-ink-soft">You have {pluralize(gems, "gem")}</p>
            <div className="mt-3 text-right">
              <Link
                href="/shop"
                onClick={close}
                className="focus-ring rounded-tile px-1 text-[13px] font-black tracking-wide text-sky-500 uppercase hover:text-sky-600"
              >
                Go to shop
              </Link>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </StatPopover>
  );
}
