"use client";

type Props = {
  /** True while the guest is actively pouring (recent taps). */
  active: boolean;
  /** CSS length (number = px). Make it long enough to overflow the tap area
   *  so the stream always reaches the bottom; the parent clips it. */
  height?: number | string;
  width?: number | string;
};

/** Tapered stream shape — narrow at the spout, widening as it falls. */
const STREAM_CLIP = "polygon(40% 0, 60% 0, 70% 100%, 30% 100%)";

/**
 * A continuous "pour" of oil flowing from the bottle's spout. Pure CSS:
 * a repeating gradient scrolls downward (the flow), inside a tapered clip,
 * with a soft glow and a centre gloss highlight.
 *
 * It grows from the spout when `active` and retracts/fades when the guest
 * pauses, so the pour responds to tapping instead of running forever. The
 * stream is intentionally over-long and relies on the parent's overflow
 * clipping to land exactly at the bottom of the tap area on any screen size.
 */
export function OilPour({ active, height = 300, width = 32 }: Props) {
  return (
    <div
      className="pointer-events-none relative -z-10"
      style={{
        width,
        height,
        transformOrigin: "top center",
        transform: `scaleY(${active ? 1 : 0})`,
        opacity: active ? 1 : 0,
        transition:
          "transform 280ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease-out",
      }}
      aria-hidden
    >
      {/* soft glow behind the stream */}
      <div
        className="absolute inset-0 blur-[5px] -z-10"
        style={{
          clipPath: STREAM_CLIP,
          background: "linear-gradient(180deg,#FFE9A8,#E6841A 55%,#7A3E04)",
          opacity: 0.55,
        }}
      />
      {/* flowing body — the repeating gradient scrolls down via animate-oil-flow */}
      <div
        className="absolute inset-0 animate-oil-flow -z-10"
        style={{
          clipPath: STREAM_CLIP,
          backgroundImage:
            "repeating-linear-gradient(180deg,#FFE7A0 0px,#F3B53C 9px,#B96A10 18px,#F3B53C 27px,#FFEFB0 36px)",
        }}
      />
      {/* centre gloss highlight */}
      <div
        className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white/55 -z-10"
        style={{ clipPath: STREAM_CLIP }}
      />
    </div>
  );
}
