"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

import { Chest } from "@/components/illustrations";
import { useToast } from "@/components/ui";
import { useClaimChest } from "@/hooks/api/useEngagement";
import { friendlyError } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import type { UnitChest } from "@/types/api";

import type { PathPoint } from "./pathLayout";
import type { UnitArt } from "./unitArt";

interface ChestNodeProps {
  unitId: number;
  chest: UnitChest;
  point: PathPoint;
  /** The unit's own look; its locked-chest artwork replaces the drawing while the chest is shut. */
  art?: UnitArt;
}

/** Unit treasure chest at the end of the path: locked → available (tap to open) → claimed. */
export function ChestNode({ unitId, chest, point, art }: ChestNodeProps) {
  const claim = useClaimChest();
  const toast = useToast();
  const available = chest.status === "available";
  const reduceMotion = useReducedMotion();

  function open() {
    claim.mutate(unitId, {
      onSuccess: (result) => toast.show({ tone: "success", title: `+${result.gems_awarded} gems!`, description: "Treasure chest opened." }),
      onError: (error) => toast.show({ tone: "error", ...friendlyError(error) }),
    });
  }

  const label =
    chest.status === "claimed"
      ? "Treasure chest, opened"
      : available
        ? `Open treasure chest (+${chest.reward_gems} gems)`
        : "Treasure chest, locked — complete every skill in this unit";

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${point.x * 100}%`, top: point.y }}
    >
      {available ? (
        <motion.button
          type="button"
          onClick={open}
          disabled={claim.isPending}
          aria-label={label}
          className="focus-ring rounded-card"
          animate={reduceMotion ? undefined : { y: [0, -6, 0], rotate: [0, -3, 3, 0] }}
          // Wiggle, then rest — draws the eye without making the target hard to hit.
          transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 1.6 }}
          whileTap={{ scale: 0.9 }}
        >
          <Chest state="available" className="size-24 drop-shadow-[0_0_12px_var(--color-sun-400)]" />
        </motion.button>
      ) : (
        <motion.span
          role="img"
          aria-label={label}
          className={cn("block", chest.status === "claimed" && "opacity-70")}
          whileHover={{ y: -4, rotate: [0, -3, 3, 0] }}
          transition={{ duration: 0.35 }}
          // A freshly opened chest lands with a bounce.
          initial={chest.status === "claimed" ? { scale: 1.25 } : false}
          animate={{ scale: 1 }}
        >
          {art && chest.status === "locked" ? (
            <Image
              src={art.locked.chest.src}
              alt=""
              width={art.locked.chest.width}
              height={art.locked.chest.height}
              unoptimized
              draggable={false}
            />
          ) : (
            <Chest state={chest.status} className="size-20" />
          )}
        </motion.span>
      )}
    </div>
  );
}
