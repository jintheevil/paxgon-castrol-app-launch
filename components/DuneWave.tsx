"use client";

import { useEffect, useState } from "react";

type Props = {
  /** 0–100 — how high the wave sits on the screen */
  progress: number;
};

/**
 * Stylised oil/dune wave rising from the bottom of its container.
 * The wave is rendered as two overlapping animated SVG paths
 * (a darker back wave + a brighter front wave) so it feels alive
 * even when progress is static. The container should be position: relative.
 */
export function DuneWave({ progress }: Props) {
  // animation phase for the wave undulation
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const heightPct = Math.max(0, Math.min(100, progress));

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 transition-[height] duration-500 ease-out"
      style={{ height: `${heightPct}%` }}
    >
      <svg
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="dune-back" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#C56B12" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#7A3E04" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="dune-front" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFB347" />
            <stop offset="60%" stopColor="#E6841A" />
            <stop offset="100%" stopColor="#A8500A" />
          </linearGradient>
          <linearGradient id="dune-glow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFD27A" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFD27A" stopOpacity="0" />
          </linearGradient>
          <filter id="wave-blur"><feGaussianBlur stdDeviation="2" /></filter>
        </defs>

        {/* back wave (slower, larger amplitude) */}
        <path
          d={wavePath(120, 60, t * 0.6, 0)}
          fill="url(#dune-back)"
        />

        {/* front wave (faster, brighter) */}
        <path
          d={wavePath(80, 40, t * 1.2, 1.4)}
          fill="url(#dune-front)"
        />

        {/* crest glow */}
        <path
          d={wavePath(60, 30, t * 1.2, 1.4)}
          fill="url(#dune-glow)"
          opacity="0.6"
          filter="url(#wave-blur)"
        />
      </svg>
    </div>
  );
}

/**
 * Build a closed svg path representing a sine wave across the top of a
 * 1200x600 viewbox, then flooding down to the bottom.
 *
 * amp – peak-to-trough amplitude in viewbox units
 * baseY – Y position of the wave's resting line
 * phase – animated phase offset
 * speed – horizontal traversal multiplier
 */
function wavePath(amp: number, baseY: number, phase: number, speed: number): string {
  const W = 1200;
  const H = 600;
  const points: string[] = [];
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const k = (i / steps) * Math.PI * 2 * 1.8 + phase * 2 + speed * x * 0.003;
    const y = baseY + Math.sin(k) * amp * 0.5 + Math.sin(k * 0.5) * amp * 0.25;
    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  points.push(`L ${W} ${H}`);
  points.push(`L 0 ${H}`);
  points.push("Z");
  return points.join(" ");
}
