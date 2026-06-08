"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLaunchSocket } from "@/lib/socket";
import { CastrolLogo } from "@/components/CastrolLogo";
import { F6Logo } from "@/components/F6Logo";
import { OilBottle } from "@/components/OilBottle";
import { GoldBackdrop } from "@/components/GoldBackdrop";
import { Sparkles } from "@/components/Sparkles";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { TapIcon } from "@/components/TapIcon";

type Burst = { id: number; x: number; y: number };
type Drop = { id: number; jitter: number };

/** Position of the bottle's cap/spout art inside its PNG, as percentages of
 *  width/height. Measured directly from CAST-EDGE-opened.png:
 *    – the neck opening's left/right extent is x = 280–500 (centre ≈ 25%)
 *    – the top of the neck rim is at y ≈ 77/1944 ≈ 4%
 *  This is the anchor for *everything*: the bottle is pinned to the screen by
 *  this point so that the spout stays put regardless of tilt, and oil drops
 *  emerge from exactly the same screen pixel. */
const CAP_X_PCT = 25;
const CAP_Y_PCT = 4;

/** Pouring is a TWO-position dance, not a single static tilt:
 *  - POUR_BASE is the "ready" position the bottle settles into between taps.
 *  - POUR_STROKE is the extra tilt that fires for ~130 ms on every tap, then
 *    untilts back to POUR_BASE. Each tap = one tipping motion = one drop.
 *  Negative degrees rotate CCW (spout dips down-left). */
const POUR_BASE_DEG = -42;
const POUR_STROKE_DEG = -16;

/** Where, vertically, we want the cap to live inside the tap area. */
const CAP_TOP = 180;

/** Headline locked to a fixed height so the layout doesn't shift between
 *  "TAP THE BOTTLE…" (wraps to 2 lines) and "KEEP TAPPING THE BOTTLE…"
 *  (wraps to 3 lines), which would otherwise push the bottle/oil down. */
const HEADLINE_HEIGHT = 132;

export default function MobilePage() {
  const { state, tap } = useLaunchSocket();
  /** Once the guest taps for the first time in a tapping session, lock to the
   *  opened/pouring bottle and switch the headline copy. Reset on phase exit. */
  const [hasPoured, setHasPoured] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [splash, setSplash] = useState(0);
  /** stroking = true for ~130 ms after each tap. While true the bottle adds
   *  POUR_STROKE_DEG of extra tilt; transitioning off returns it to POUR_BASE
   *  (the "untilt"). Rapid taps keep restarting the timer so the bottle
   *  oscillates around the stroke position; stopping settles it back to base. */
  const [stroking, setStroking] = useState(false);
  const strokeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstId = useRef(0);
  const dropId = useRef(0);

  const isStandby = state.phase === "idle" || state.phase === "standby";
  const isTapping = state.phase === "tapping" || state.phase === "holding";
  const isRevealed = state.phase === "revealed";

  useEffect(() => {
    if (!isTapping) {
      setHasPoured(false);
      setDrops([]);
      setStroking(false);
    }
  }, [isTapping]);

  useEffect(
    () => () => {
      if (strokeTimerRef.current) clearTimeout(strokeTimerRef.current);
    },
    []
  );

  const onTap = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isTapping) return;
    tap();
    if (!hasPoured) setHasPoured(true);

    // Tap-position burst (yellow halo where the finger landed)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bId = ++burstId.current;
    setBursts((prev) => [...prev.slice(-10), { id: bId, x, y }]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== bId)), 700);

    // One oil drop per tap — falls from the spout. A small horizontal jitter
    // keeps consecutive drops from overlaying perfectly.
    const dId = ++dropId.current;
    const jitter = (Math.random() - 0.5) * 6;
    setDrops((prev) => [...prev, { id: dId, jitter }]);
    setTimeout(() => setDrops((prev) => prev.filter((d) => d.id !== dId)), 950);

    // Splash ring at the spout for instant feedback on the tap
    setSplash((s) => s + 1);

    // Trigger the pour stroke: bottle tilts further for a moment then
    // untilts back to POUR_BASE. Rapid taps keep extending the timer so
    // the bottle stays near the stroke position; stopping settles it back.
    setStroking(true);
    if (strokeTimerRef.current) clearTimeout(strokeTimerRef.current);
    strokeTimerRef.current = setTimeout(() => setStroking(false), 130);

    if (navigator.vibrate) navigator.vibrate(15);
  };

  const tiltDeg = hasPoured ? POUR_BASE_DEG + (stroking ? POUR_STROKE_DEG : 0) : 0;

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-black px-6 py-8">
      {isRevealed ? <Sparkles /> : <GoldBackdrop />}

      <header className="z-10 flex w-full flex-col items-center gap-2">
        <CastrolLogo className="h-12" />
      </header>

      <AnimatePresence mode="wait">
        {isStandby && (
          <motion.section
            key="standby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 flex flex-1 flex-col items-center justify-center gap-12 pb-16 text-center"
          >
            <h1 className="text-5xl font-light tracking-wide text-white">
              WSMS
              <span className="mt-2 block text-3xl font-light text-gold-200">Launch</span>
            </h1>
            <LoadingSpinner className="h-20 w-20" />
            <p className="max-w-xs text-lg leading-relaxed text-gold-100/80">
              The launch will begin shortly.
              <br />
              Please standby…
            </p>
          </motion.section>
        )}

        {isTapping && (
          <motion.section
            key="tapping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 mt-6 flex flex-1 flex-col items-center gap-4 text-center"
          >
            <p className="text-sm uppercase tracking-[0.4em] text-gold-300">WSMS Launch</p>

            {/* Fixed-height headline container so swapping copy doesn't push
             *  the bottle / oil drops down. */}
            <div
              className="flex w-full items-center justify-center"
              style={{ height: HEADLINE_HEIGHT }}
            >
              <AnimatePresence mode="wait">
                <motion.h1
                  key={hasPoured ? "keep" : "tap"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="max-w-xs text-3xl font-extrabold uppercase leading-tight tracking-wide text-white"
                >
                  {hasPoured
                    ? "Keep tapping the bottle to pour the oil"
                    : "Tap the bottle to pour the oil"}
                </motion.h1>
              </AnimatePresence>
            </div>

            <div className="relative mt-2 w-full flex-1">
              <button
                onPointerDown={onTap}
                aria-label="Tap to pour"
                className="relative mx-auto block h-full w-full max-w-sm outline-none"
              >
                {/* Bottle anchor.
                 *
                 * The cap art sits at (CAP_X_PCT, CAP_Y_PCT) of the bottle PNG.
                 * We want that exact point to live at screen position
                 *   left: 50%, top: CAP_TOP
                 * and to STAY THERE when the bottle tilts, so the oil drop
                 * can be drawn from a fixed screen point.
                 *
                 * Transform-string order matters here. CSS evaluates the list
                 * right-to-left, AND each transform composes in matrix space,
                 * so the *outermost* (leftmost) operation is applied last in
                 * the same coordinate system as the original layout.
                 *
                 *   ✗ `rotate(θ) translate(-25%, -4%)`
                 *     – translate first, then rotate around the cap.
                 *     – The translate vector itself gets rotated by θ, so the
                 *       cap drifts off the anchor whenever θ ≠ 0.
                 *
                 *   ✓ `translate(-25%, -4%) rotate(θ)`
                 *     – rotate first around the cap (cap stays put), then
                 *       translate by (-25%, -4%) in unrotated screen space.
                 *     – The cap lands exactly at (left, top) for any θ.
                 */}
                <div
                  className="absolute z-10"
                  style={{
                    left: "50%",
                    top: CAP_TOP,
                    transformOrigin: `${CAP_X_PCT}% ${CAP_Y_PCT}%`,
                    transform: `translate(-${CAP_X_PCT}%, -${CAP_Y_PCT}%) rotate(${tiltDeg}deg)`,
                    /* Two transition speeds: long ease when first engaging the
                     * pour (0° → base), snappy when stroking per tap. */
                    transition: hasPoured
                      ? "transform 140ms ease-out"
                      : "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <OilBottle poured={hasPoured} className="h-[240px]" />
                </div>

                {/* Oil drops — one per tap, falling from the cap point straight
                 *  down. They share the same anchor as the cap so they emerge
                 *  exactly from the spout. */}
                <div
                  className="pointer-events-none absolute z-0"
                  style={{ left: "50%", top: CAP_TOP }}
                >
                  {drops.map((d) => (
                    <span
                      key={d.id}
                      className="absolute block h-5 w-4 animate-oil-drop rounded-[55%] bg-gradient-to-b from-[#FFE9A8] via-[#E6841A] to-[#7A3E04] shadow-[0_0_8px_rgba(243,181,60,0.7)]"
                      style={{ left: d.jitter, top: 0 }}
                    />
                  ))}
                  {/* Splash ring — re-keyed on every tap to restart the
                   *  animation. */}
                  <span
                    key={splash}
                    className="pointer-events-none absolute block h-8 w-8 animate-oil-splash rounded-full bg-amber-300/70"
                    style={{ left: 0, top: 0 }}
                  />
                </div>

                {bursts.map((b) => (
                  <span
                    key={b.id}
                    className="pointer-events-none absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/60 animate-burst"
                    style={{ left: b.x, top: b.y }}
                  />
                ))}

                {!hasPoured && (
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
                    <TapIcon className="h-10 w-10 animate-pulse-slow" />
                    <span className="text-xs uppercase tracking-[0.3em] text-gold-200">Tap the bottle</span>
                  </div>
                )}
              </button>
            </div>

            <div className="z-10 w-full max-w-sm">
              <div className="flex items-baseline justify-between text-gold-100">
                <span className="text-xs uppercase tracking-[0.3em]">Collective</span>
                <span className="font-mono text-2xl font-bold">
                  {state.progress.toFixed(0)}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/70 ring-1 ring-gold-700/40">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-gold-400 via-amber-400 to-gold-200"
                  animate={{ width: `${state.progress}%` }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                />
              </div>
            </div>
          </motion.section>
        )}

        {isRevealed && (
          <motion.section
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 flex flex-1 flex-col items-center justify-center gap-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 100 }}
              className="relative z-10"
            >
              <F6Logo className="h-56 w-56" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="z-10 flex flex-col gap-2"
            >
              <p className="text-2xl font-semibold text-white drop-shadow">Introducing WSMS</p>
              <p className="text-sm text-white/90">(Workshop Management System)</p>
              <p className="text-sm text-white/90">developed by F6</p>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="z-10 mt-6 max-w-xs text-base font-semibold text-white drop-shadow"
            >
              Thank You For Your Participation
            </motion.p>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
