"use client";

import Image from "next/image";

type Props = {
  /** Show the cap-off / pouring artwork instead of the upright closed bottle. */
  poured?: boolean;
  className?: string;
};

/**
 * Pure asset wrapper — just swaps the closed/opened PNG. All rotation
 * (tilt, shake) and positioning is handled by the caller so the cap
 * can be aligned to a specific point on screen.
 */
export function OilBottle({ poured = false, className = "" }: Props) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src={poured ? "/assets/CAST-EDGE-opened.png" : "/assets/CAST-EDGE-closed.png"}
        alt="Castrol EDGE bottle"
        width={1552}
        height={1944}
        priority
        className="h-full w-auto select-none object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]"
        draggable={false}
      />
    </div>
  );
}
