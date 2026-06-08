"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Stream length in pixels. */
  height?: number;
  /** Stream thickness in pixels. */
  width?: number;
  className?: string;
};

/**
 * A continuously flowing oil stream — a wavy, gold-gradient ribbon that
 * undulates to suggest motion. Pair with an animated droplet/splash if
 * a fancier landing is needed; for the launch activation this single
 * column reads clearly as "oil pouring".
 */
export function OilStream({ height = 240, width = 28, className = "" }: Props) {
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const W = width;
  const H = height;
  const steps = 24;

  // Build the wavy left and right edges of the stream
  const left: Array<[number, number]> = [];
  const right: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * H;
    // Stream gradually thickens as it falls, then thins out again
    const taper = 1 + 0.45 * Math.sin((i / steps) * Math.PI);
    // Horizontal wobble — speed scales with depth so it drips faster lower down
    const wobble = Math.sin(y * 0.06 + t * 5) * 2.2 + Math.sin(y * 0.12 - t * 3) * 1.2;
    const half = (W / 2) * taper * 0.55;
    left.push([W / 2 + wobble - half, y]);
    right.push([W / 2 + wobble + half, y]);
  }

  const d = [
    `M ${left[0][0].toFixed(2)} ${left[0][1].toFixed(2)}`,
    ...left.slice(1).map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`),
    ...right
      .slice()
      .reverse()
      .map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`),
    "Z",
  ].join(" ");

  // A few falling drops below the stream for extra life
  const dropCount = 4;
  const drops = Array.from({ length: dropCount }).map((_, i) => {
    const period = 0.7 + i * 0.13;
    const phase = (t / period + i * 0.31) % 1;
    const dy = phase * (H * 0.4);
    const dx = Math.sin(phase * Math.PI * 2 + i) * 4;
    const opacity = 1 - phase;
    const r = 2 + (i % 2);
    return { cx: W / 2 + dx, cy: H + dy, r, opacity };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H * 1.4}`}
      width={W}
      height={H * 1.4}
      className={`overflow-visible ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="oil-stream-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE9A8" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#F3B53C" />
          <stop offset="80%" stopColor="#C77410" />
          <stop offset="100%" stopColor="#7A3E04" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="oil-stream-highlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF6D0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFF6D0" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Glow halo */}
      <path
        d={d}
        fill="url(#oil-stream-fill)"
        opacity="0.5"
        style={{ filter: "blur(6px)" }}
      />
      {/* Main stream */}
      <path d={d} fill="url(#oil-stream-fill)" />
      {/* Specular highlight running down the middle */}
      <path
        d={`M ${W / 2} 0 L ${W / 2} ${H}`}
        stroke="url(#oil-stream-highlight)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Drops continuing past the bottom of the stream */}
      {drops.map((dr, i) => (
        <circle
          key={i}
          cx={dr.cx}
          cy={dr.cy}
          r={dr.r}
          fill="url(#oil-stream-fill)"
          opacity={dr.opacity}
        />
      ))}
    </svg>
  );
}
