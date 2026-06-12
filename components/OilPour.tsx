"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** True while the guest is actively pouring (recent taps). */
  active: boolean;
  /** CSS length (number = px). Make it long enough to overflow the tap area
   *  so the stream always reaches the bottom; the parent clips it. */
  height?: number | string;
  width?: number | string;
};

/** Design-space viewBox width. The SVG is stretched (preserveAspectRatio
 *  "none") to the CSS width, so the stream stays proportional at any size. */
const VB_W = 60;

/**
 * A liquid-looking oil pour. Instead of a stiff tapered rectangle, the stream
 * is an animated SVG path whose left/right edges are built each frame from:
 *   • a slow side-to-side SWAY of the whole column,
 *   • traveling BULGES that swell and pinch the width as they fall (the main
 *     "liquid / beads of oil" read),
 *   • finer RIPPLES on top.
 * A wavy centre highlight and a few traveling glints sell the flow. The path
 * is written imperatively in a requestAnimationFrame loop (no React re-render
 * per frame). The stream is intentionally over-long and relies on the parent's
 * overflow clipping to land at the bottom of the tap area on any screen.
 */
export function OilPour({ active, height = 1600, width = 26 }: Props) {
  const fillRef = useRef<SVGPathElement>(null);
  const glossRef = useRef<SVGPathElement>(null);
  const glintsRef = useRef<SVGGElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  const vbH = typeof height === "number" ? height : 1600;

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const cx = VB_W / 2;
    const steps = 48;
    const glints = glintsRef.current
      ? (Array.from(glintsRef.current.children) as SVGCircleElement[])
      : [];

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!activeRef.current) return; // skip work while hidden

      const t = (now - start) / 1000;
      const swayAt = (y: number) => Math.sin(t * 1.5 + y * 0.006) * 4.2;

      const leftCmds: string[] = [];
      const right: Array<[number, number]> = [];

      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        const y = f * vbH;
        const sway = swayAt(y);

        // Base half-width: a touch narrow at the spout, fuller as it falls.
        const halfBase = 13 + 4 * Math.sin(Math.min(1, f * 1.3) * (Math.PI / 2));
        // Traveling bulges — the main liquid effect (oil swelling & pinching).
        const bulge = Math.sin(y * 0.035 - t * 5.5) * 5.5;
        // Finer surface ripples.
        const ripple = Math.sin(y * 0.09 + t * 3.2) * 2.0;

        const half = Math.max(3, halfBase + bulge + ripple);
        const lx = cx + sway - half;
        const rx = cx + sway + half;
        leftCmds.push(`${i === 0 ? "M" : "L"} ${lx.toFixed(1)} ${y.toFixed(1)}`);
        right.push([rx, y]);
      }

      let d = leftCmds.join(" ");
      for (let i = right.length - 1; i >= 0; i--) {
        d += ` L ${right[i][0].toFixed(1)} ${right[i][1].toFixed(1)}`;
      }
      d += " Z";
      fillRef.current?.setAttribute("d", d);

      // Centre highlight follows the sway.
      let g = "";
      for (let i = 0; i <= steps; i++) {
        const y = (i / steps) * vbH;
        g += `${i === 0 ? "M" : "L"} ${(cx + swayAt(y)).toFixed(1)} ${y.toFixed(1)}`;
      }
      glossRef.current?.setAttribute("d", g);

      // Glints travel down the stream at different speeds.
      glints.forEach((el, idx) => {
        const speed = 420 + idx * 160;
        const span = vbH + 120;
        const yy = (((t * speed + idx * 537) % span) + span) % span - 60;
        const sway = swayAt(yy);
        el.setAttribute("cx", (cx + sway).toFixed(1));
        el.setAttribute("cy", yy.toFixed(1));
        el.setAttribute("opacity", yy < 0 || yy > vbH ? "0" : "0.6");
      });
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [vbH]);

  return (
    <div
      className="pointer-events-none"
      style={{
        width,
        height,
        transformOrigin: "top center",
        transform: `scaleY(${active ? 1 : 0})`,
        opacity: active ? 1 : 0,
        transition:
          "transform 280ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease-out",
        filter: "drop-shadow(0 0 4px rgba(243,181,60,0.55))",
      }}
      aria-hidden
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VB_W} ${vbH}`}
        preserveAspectRatio="none"
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          <linearGradient id="oilpour-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE7A0" />
            <stop offset="38%" stopColor="#F3B53C" />
            <stop offset="80%" stopColor="#C77410" />
            <stop offset="100%" stopColor="#7A3E04" />
          </linearGradient>
        </defs>

        <path ref={fillRef} fill="url(#oilpour-fill)" />
        <path
          ref={glossRef}
          fill="none"
          stroke="#FFF6D0"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.5"
        />
        <g ref={glintsRef} fill="#FFF6D0">
          <circle r="2.6" />
          <circle r="1.8" />
          <circle r="3.2" />
        </g>
      </svg>
    </div>
  );
}
