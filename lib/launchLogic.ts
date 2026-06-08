import type { LaunchState, Phase } from "@/types/state";

/** Progress is capped here until the MC fires the reveal. */
export const HOLD_AT = 99;

/**
 * Aggregate taps required to advance the collective meter by 1%.
 *
 * Tunable WITHOUT a code change via the NEXT_PUBLIC_TAPS_PER_PERCENT env var
 * (computeState now runs client-side, so it must be a NEXT_PUBLIC_ var to be
 * inlined into the bundle). Keep it tiny while testing with a few people and
 * scale it up for the real crowd:
 *
 *   taps-to-99%  = TAPS_PER_PERCENT * 99
 *   target       ≈ (people) * (taps/sec each ~4) * (desired seconds to fill)
 *
 * e.g. 600 people, ~45s of effort → ~108,000 taps → TAPS_PER_PERCENT ≈ 1100.
 * Default below (0.5 → ~50 taps to fill) is for low-headcount testing.
 */
export const TAPS_PER_PERCENT =
  Number(process.env.NEXT_PUBLIC_TAPS_PER_PERCENT) || 0.5;

/** How long the 99 → 100 "break through" animates after reveal. */
export const REVEAL_DURATION_MS = 1400;

/**
 * The raw, persisted launch state. `phase` here is only ever one of
 * idle | standby | tapping | revealed — "holding" is *derived* (see
 * computeState) once tapping progress reaches HOLD_AT, so it never needs
 * to be written to the store.
 */
export type RawState = {
  phase: Phase;
  taps: number;
  revealAt: number | null;
};

/**
 * Pure projection of the raw state into what clients render. Mirrors the
 * old in-memory LaunchStore.progressNow() so behaviour is unchanged after
 * the migration off websockets.
 */
export function computeState(
  raw: RawState,
  guests: number,
  now: number = Date.now()
): LaunchState {
  const { phase, taps, revealAt } = raw;

  if (phase === "idle" || phase === "standby") {
    return { phase, progress: 0, totalTaps: taps, guests };
  }

  if (phase === "revealed") {
    const progress =
      revealAt == null
        ? 100
        : Math.min(
            100,
            HOLD_AT +
              Math.min(1, (now - revealAt) / REVEAL_DURATION_MS) *
                (100 - HOLD_AT)
          );
    return { phase, progress, totalTaps: taps, guests };
  }

  // tapping (or its derived "holding" tail)
  const progress = Math.min(HOLD_AT, taps / TAPS_PER_PERCENT);
  const effectivePhase: Phase = progress >= HOLD_AT ? "holding" : "tapping";
  return { phase: effectivePhase, progress, totalTaps: taps, guests };
}
