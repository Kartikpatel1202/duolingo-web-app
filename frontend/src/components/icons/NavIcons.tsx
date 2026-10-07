import Image from "next/image";

import { cn } from "@/lib/cn";

/**
 * Full-colour navigation icons. The artwork is cut from the reference screenshots
 * (`public/brand/path/nav-*.png`, stored at 2x), not redrawn; each is shown at the size it has in
 * the reference. They stay colourful in the dark theme too (they sit on transparent backgrounds).
 */
export interface NavIconProps {
  className?: string;
}

interface ArtProps extends NavIconProps {
  file: string;
  /** Size of the artwork on screen, in CSS px. */
  width: number;
  height: number;
}

/** A fixed 36px square so every icon takes the same room, with the artwork centred in it. */
function Art({ className, file, width, height }: ArtProps) {
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center", className ?? "size-9")}>
      <Image src={`/brand/path/nav-${file}.png`} alt="" width={width} height={height} unoptimized draggable={false} />
    </span>
  );
}

export function LearnNavIcon({ className }: NavIconProps) {
  return <Art className={className} file="learn" width={32} height={28} />;
}

export function LeaderboardNavIcon({ className }: NavIconProps) {
  return <Art className={className} file="leaderboard" width={24} height={27} />;
}

export function QuestsNavIcon({ className }: NavIconProps) {
  return <Art className={className} file="quests" width={32} height={28} />;
}

export function ShopNavIcon({ className }: NavIconProps) {
  return <Art className={className} file="shop" width={29} height={27} />;
}

export function ProfileNavIcon({ className }: NavIconProps) {
  return <Art className={className} file="profile" width={34} height={34} />;
}

export function MoreNavIcon({ className }: NavIconProps) {
  return <Art className={className} file="more" width={32} height={31} />;
}
