"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLaunchSocket } from "@/lib/socket";
import { CastrolLogo } from "@/components/CastrolLogo";
import { F6Logo } from "@/components/F6Logo";
import { OilBottle } from "@/components/OilBottle";
import { OilPour } from "@/components/OilPour";
import { GoldBackdrop } from "@/components/GoldBackdrop";
import { Sparkles } from "@/components/Sparkles";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { TapIcon } from "@/components/TapIcon";

type Burst = { id: number; x: number; y: number };

/** Position of the bottle's cap/spout art inside its PNG, as percentages of
 *  width/height. Measured directly from CAST-EDGE-opened.png:
 *    – the neck opening's left/right extent is x = 280–500 (centre ≈ 25%)
 *    – the top of the neck rim is at y ≈ 77/1944 ≈ 4%
 *  This is the anchor for *everything*: the bottle is pinned to the screen by
 *  this point so that the spout stays put regardless of tilt, and the oil
 *  stream pours from exactly the same screen pixel. */
const CAP_X_PCT = 25;
const CAP_Y_PCT = 4;

/** Bottle tilt is tied to the pour:
 *  - upright (0°) before the first tap,
 *  - POUR_BASE while the session is active but the guest has paused,
 *  - POUR_DEEP while actively pouring (recent taps) — tips further so the
 *    oil visibly streams out.
 *  Negative degrees rotate CCW (spout dips down-left). */
const POUR_BASE_DEG = -40;
const POUR_DEEP_DEG = -58;

/** How long the pour keeps flowing after the last tap before it tapers off. */
const POUR_DECAY_MS = 450;

/** Responsive sizing — everything scales with the viewport height (dvh) and
 *  is clamped to sane bounds, so the bottle keeps the SAME proportion of the
 *  screen on every phone instead of looking huge on small devices and tiny on
 *  large ones. `clamp(min, preferred, max)`. */
const BOTTLE_H = "clamp(180px, 32dvh, 320px)";
/** Vertical position of the spout inside the tap area (scales with the screen
 *  so the whole composition stays proportional). */
const CAP_TOP = "clamp(96px, 18dvh, 190px)";
/** Pour stream length: intentionally longer than any screen — the tap area
 *  has overflow-hidden, so the stream is clipped to land exactly at the
 *  bottom of the tap area uniformly on every device. */
const POUR_LEN = 1600;
/** Stream thickness, also scaled so it stays proportional to the bottle. */
const POUR_WIDTH = "clamp(32px, 6dvh, 48px)";

/** Headline height scales (and is clamped) so swapping copy never shifts the
 *  bottle, while not eating too much of a small screen. */
const HEADLINE_HEIGHT = "clamp(96px, 16dvh, 132px)";

export default function MobilePage() {
  const { state, tap } = useLaunchSocket();
  /** Once the guest taps for the first time in a tapping session, lock to the
   *  opened/pouring bottle and switch the headline copy. Reset on phase exit. */
  const [hasPoured, setHasPoured] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  /** pouring = true while taps are recent (within POUR_DECAY_MS of the last
   *  one). It drives both the oil stream and the bottle's deeper tilt, so the
   *  pour flows while the guest taps and tapers off when they pause. */
  const [pouring, setPouring] = useState(false);
  const pourTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstId = useRef(0);

  const isStandby = state.phase === "idle" || state.phase === "standby";
  const isTapping = state.phase === "tapping" || state.phase === "holding";
  const isRevealed = state.phase === "revealed";

  useEffect(() => {
    if (!isTapping) {
      setHasPoured(false);
      setPouring(false);
    }
  }, [isTapping]);

  useEffect(
    () => () => {
      if (pourTimerRef.current) clearTimeout(pourTimerRef.current);
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

    // Keep the pour flowing: rapid taps keep extending the timer so the
    // stream stays on; when tapping stops it tapers off after POUR_DECAY_MS.
    setPouring(true);
    if (pourTimerRef.current) clearTimeout(pourTimerRef.current);
    pourTimerRef.current = setTimeout(() => setPouring(false), POUR_DECAY_MS);

    if (navigator.vibrate) navigator.vibrate(15);
  };

  const tiltDeg = !hasPoured ? 0 : pouring ? POUR_DEEP_DEG : POUR_BASE_DEG;

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
             *  the bottle / oil pour down. */}
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

            <div className="relative mt-2 flex w-full flex-1 justify-center">
              <button
                onPointerDown={onTap}
                aria-label="Tap to pour"
                /* No h-full: the parent is a flex container, so align-items:
                 * stretch fills the height reliably. A percentage height here
                 * collapses to 0 against a flex-grown parent. */
                className="relative w-full max-w-sm outline-none"
              >
                {/* Bottle anchor.
                 *
                 * The cap art sits at (CAP_X_PCT, CAP_Y_PCT) of the bottle PNG.
                 * We want that exact point to live at screen position
                 *   left: 50%, top: CAP_TOP
                 * and to STAY THERE when the bottle tilts, so the oil stream
                 * pours from a fixed screen point.
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
                    left: "35%",
                    top: CAP_TOP,
                    height: BOTTLE_H,
                    transformOrigin: `${CAP_X_PCT}% ${CAP_Y_PCT}%`,
                    transform: `translate(-${CAP_X_PCT}%, -${CAP_Y_PCT}%) rotate(${tiltDeg}deg)`,
                    /* Snappy once pouring (deep ↔ base as taps come and go);
                     * a longer ease the first time it tips up from upright. */
                    transition: hasPoured
                      ? "transform 220ms ease-out"
                      : "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <OilBottle poured={hasPoured} className="h-full z-10" />

                  {/* Continuous oil pour. It lives INSIDE the bottle's
                   *  (rotated) frame, anchored to the spout lip (~19%, 7% of
                   *  the bottle art), so it's always glued to the spout. It's
                   *  then counter-rotated by -tiltDeg, cancelling the bottle's
                   *  rotation so the stream always falls vertically (gravity)
                   *  no matter how far the bottle is tipped. */}
                  <div
                    className="pointer-events-none absolute"
                    style={{ left: "23%", top: "11%" }}
                  >
                    <div
                      style={{
                        transformOrigin: "top center",
                        transform: `translateX(-50%) rotate(${-tiltDeg}deg)`,
                        transition: hasPoured
                          ? "transform 220ms ease-out"
                          : "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    >
                      <OilPour active={pouring} height={POUR_LEN} width={POUR_WIDTH} />
                    </div>
                  </div>
                </div>

                {/* Landing glow pinned to the bottom of the tap area — gives a
                 *  consistent "oil pooling at the bottom" effect on every
                 *  screen, since the stream itself is clipped here. */}
                {/*<div*/}
                {/*  className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"*/}
                {/*  style={{*/}
                {/*    width: "clamp(90px, 45dvw, 220px)",*/}
                {/*    height: 64,*/}
                {/*    background:*/}
                {/*      "radial-gradient(ellipse at bottom, rgba(243,181,60,0.5), transparent 70%)",*/}
                {/*    opacity: pouring ? 1 : 0,*/}
                {/*    transition: "opacity 250ms ease-out",*/}
                {/*  }}*/}
                {/*/>*/}

                {/*{bursts.map((b) => (*/}
                {/*  <span*/}
                {/*    key={b.id}*/}
                {/*    className="pointer-events-none absolute h-12 w-12 !-z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/60 animate-burst"*/}
                {/*    style={{ left: b.x, top: b.y }}*/}
                {/*  />*/}
                {/*))}*/}

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
