"use client";

import { motion, useReducedMotion, type TargetAndTransition } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { DuoMascot } from "@/components/illustrations";
import { cn } from "@/lib/cn";

import scenes from "./landingHeroScenes.json";

type Scene = (typeof scenes)[number];
type Layer = Scene["layers"][number];

/**
 * The hero plays one looping sequence built from two layered scenes (see
 * `scripts/split_hero_layers.py`):
 *
 *   phone ──► anticipate ──► pop ──► group ──► gather ──► phone …
 *
 *   phone       the phone with the icon on its screen; the icon stirs now and then
 *   anticipate  the icon squashes down and leans back (wind-up before the jump)
 *   pop         the icon leaps out of the screen, growing towards where the lead character
 *               stands; mid-flight it hands over to that character, who lands with an overshoot
 *               while the others burst out from the same spot and the phone drops away
 *   group       everyone has landed; each character idles on its own, with pauses between moves
 *   gather      the group is drawn back into the screen so the loop can start again
 */
type Phase = "phone" | "anticipate" | "pop" | "group" | "gather";

/** How long each phase lasts before the next one starts (ms). */
const PHASE_MS: Record<Phase, number> = { phone: 2600, anticipate: 360, pop: 950, group: 8500, gather: 520 };
const NEXT: Record<Phase, Phase> = { phone: "anticipate", anticipate: "pop", pop: "group", group: "gather", gather: "phone" };

const PHONE = scenes.find((scene) => scene.name === "phone");
const GROUP = scenes.find((scene) => scene.name === "friends");
/** In the phone scene the body is drawn first and the icon on its screen last. */
const PHONE_BODY = PHONE?.layers[0];
const ICON = PHONE?.layers.at(-1);
/** The group layer that the icon turns into (the lead character). */
const LEAD_INDEX = 1;

/** A springy overshoot for anything that lands. */
const LAND = { type: "spring", stiffness: 300, damping: 13, mass: 0.9 } as const;
/** Pulls back before releasing: used for the wind-up and for being drawn back in. */
const WIND_UP = [0.6, -0.4, 0.74, 0.05] as const;

/** A layer's centre in stage units: x in % of the stage width, y in % of that width from the middle. */
function centre(scene: Scene, layer: Layer) {
  const ratio = scene.height / scene.width;
  return { x: layer.left + layer.width / 2, y: ratio * (layer.top + layer.height / 2 - 50) };
}

/** The translate (in % of the layer's own size) that moves `layer` onto the point `to`. */
function offsetTo(scene: Scene, layer: Layer, to: { x: number; y: number }) {
  const from = centre(scene, layer);
  const ratio = scene.height / scene.width;
  return {
    x: `${((to.x - from.x) / layer.width) * 100}%`,
    y: `${((to.y - from.y) / (ratio * layer.height)) * 100}%`,
  };
}

function frame(layer: Layer) {
  return { left: `${layer.left}%`, top: `${layer.top}%`, width: `${layer.width}%`, height: `${layer.height}%` };
}

function Picture({ layer }: { layer: Layer }) {
  return <Image src={layer.src} alt="" fill unoptimized priority sizes="320px" className="object-fill" />;
}

/** Positions a scene in the middle of the stage at its own proportions. */
function SceneBox({ scene, children }: { scene: Scene; children: React.ReactNode }) {
  return (
    <div
      className="absolute top-1/2 left-0 w-full -translate-y-1/2"
      style={{ aspectRatio: `${scene.width} / ${scene.height}` }}
    >
      {children}
    </div>
  );
}

/**
 * Idle behaviour for one group character. Each move is short and followed by a pause of a
 * different length per character, so they shift, breathe and tilt at different moments instead of
 * bobbing in unison. The lead character also gives a small hop now and then.
 */
function idle(index: number, lead: boolean): TargetAndTransition {
  const direction = index % 2 === 0 ? 1 : -1;
  return {
    scaleY: [1, 1.022, 1],
    rotate: [0, 2.2 * direction, 0],
    x: [0, 1.6 * direction, 0],
    y: lead ? [0, -9, 0] : [0, -2.5, 0],
    transition: {
      scaleY: { duration: 2.2, repeat: Infinity, repeatDelay: 0.9 + index * 0.35, ease: "easeInOut" },
      rotate: { duration: 1.1, repeat: Infinity, repeatDelay: 2.4 + index * 0.7, ease: "easeInOut", delay: 0.6 + index * 0.4 },
      x: { duration: 1.4, repeat: Infinity, repeatDelay: 3.1 + index * 0.5, ease: "easeInOut", delay: 1.2 + index * 0.3 },
      y: lead
        ? { duration: 0.55, repeat: Infinity, repeatDelay: 3.4, ease: [0.3, 1.5, 0.6, 1], delay: 1.8 }
        : { duration: 1.8, repeat: Infinity, repeatDelay: 2 + index * 0.6, ease: "easeInOut", delay: index * 0.5 },
    },
  };
}

const AT_REST: TargetAndTransition = { scaleY: 1, rotate: 0, x: 0, y: 0, transition: { duration: 0.2 } };

/** Landing-page hero: one continuous, looping character sequence (see the phases above). */
export function LandingHero({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("phone");

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setTimeout(() => setPhase(NEXT[phase]), PHASE_MS[phase]);
    return () => window.clearTimeout(timer);
  }, [phase, reduceMotion]);

  const lead = GROUP?.layers[LEAD_INDEX];
  if (!PHONE || !GROUP || !PHONE_BODY || !ICON || !lead) {
    return <DuoMascot state="idle" animated className={className} />;
  }

  // Reduced motion: the finished group, still.
  if (reduceMotion) {
    return (
      <div aria-hidden className={cn("relative", className)}>
        <SceneBox scene={GROUP}>
          {GROUP.layers.map((layer) => (
            <div key={layer.src} className="absolute" style={frame(layer)}>
              <Picture layer={layer} />
            </div>
          ))}
        </SceneBox>
      </div>
    );
  }

  const out = phase === "pop" || phase === "group"; // the characters are out of the phone
  const iconSpot = centre(PHONE, ICON);
  const leadSpot = centre(GROUP, lead);
  const leap = offsetTo(PHONE, ICON, leadSpot);

  const phoneBody: TargetAndTransition = out
    ? // The phone drops back and away as the characters burst out of it.
      { opacity: 0, scale: 0.78, y: "9%", rotate: 4, transition: { duration: 0.34, ease: "easeIn", delay: 0.08 } }
    : phase === "anticipate"
      ? { opacity: 1, scale: 0.97, y: "1.5%", rotate: -1.5, transition: { duration: PHASE_MS.anticipate / 1000, ease: "easeOut" } }
      : phase === "gather"
        ? { opacity: 0, scale: 0.78, y: "9%", rotate: 4, transition: { duration: 0 } }
        : { opacity: 1, scale: 1, y: "0%", rotate: 0, transition: { ...LAND, opacity: { duration: 0.18 } } };

  const icon: TargetAndTransition = out
    ? // Leap: fly towards the lead character's spot while growing, then hand over to them.
      {
        x: leap.x,
        y: leap.y,
        scale: 1.9,
        rotate: 8,
        opacity: [1, 1, 0],
        transition: { duration: 0.4, ease: [0.2, 0.9, 0.3, 1.25], opacity: { duration: 0.4, times: [0, 0.5, 1] } },
      }
    : phase === "anticipate"
      ? // Wind-up: squash down and lean back before the jump.
        { x: "0%", y: "7%", scale: 0.8, rotate: -9, opacity: 1, transition: { duration: PHASE_MS.anticipate / 1000, ease: WIND_UP } }
      : phase === "gather"
        ? { x: "0%", y: "0%", scale: 0.3, rotate: 0, opacity: 0, transition: { duration: 0 } }
        : { x: "0%", y: "0%", scale: 1, rotate: 0, opacity: 1, transition: { ...LAND, opacity: { duration: 0.15 } } };

  return (
    <div aria-hidden className={cn("relative", className)}>
      <SceneBox scene={PHONE}>
        <motion.div className="absolute" style={frame(PHONE_BODY)} initial={false} animate={phoneBody}>
          <Picture layer={PHONE_BODY} />
        </motion.div>
        <motion.div className="absolute z-10" style={frame(ICON)} initial={false} animate={icon}>
          {/* While waiting in the phone, the icon stirs: a small swell and tilt, then stillness. */}
          <motion.div
            className="relative size-full"
            animate={
              phase === "phone"
                ? { scale: [1, 1.06, 1], rotate: [0, -4, 0], transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.9, delay: 0.7, ease: "easeInOut" } }
                : { scale: 1, rotate: 0, transition: { duration: 0.1 } }
            }
          >
            <Picture layer={ICON} />
          </motion.div>
        </motion.div>
      </SceneBox>

      <SceneBox scene={GROUP}>
        {GROUP.layers.map((layer, index) => {
          const isLead = index === LEAD_INDEX;
          // Everyone starts (and ends) inside the phone, at the icon's spot.
          const inside = offsetTo(GROUP, layer, iconSpot);
          const delay = isLead ? 0.14 : 0.24 + index * 0.06;
          const placement: TargetAndTransition = out
            ? { x: "0%", y: "0%", scale: 1, opacity: 1, transition: { ...LAND, delay, opacity: { duration: 0.12, delay } } }
            : phase === "gather"
              ? {
                  ...inside,
                  scale: 0.15,
                  opacity: 0,
                  transition: { duration: 0.42, ease: WIND_UP, delay: index * 0.03, opacity: { duration: 0.2, delay: 0.24 + index * 0.03 } },
                }
              : { ...inside, scale: 0.15, opacity: 0, transition: { duration: 0 } };
          return (
            // Outer element: where the character is in the sequence. Inner elements: its own
            // idle movement and its hover reaction, so the three never interrupt one another.
            <motion.div
              key={layer.src}
              className={cn("absolute", isLead && "z-10")}
              style={frame(layer)}
              initial={false}
              animate={placement}
            >
              <motion.div className="size-full" animate={phase === "group" ? idle(index, isLead) : AT_REST}>
                <motion.div
                  className="relative size-full"
                  whileHover={{ scale: 1.08, rotate: index % 2 === 0 ? -5 : 5 }}
                  transition={{ type: "spring", stiffness: 320, damping: 11 }}
                >
                  <Picture layer={layer} />
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })}
      </SceneBox>
    </div>
  );
}
