import type { LaunchState, Phase } from "@/types/state";

/** Progress is capped here until the MC fires the reveal. */
export const HOLD_AT = 99;
/** Aggregate taps required to advance the collective meter by 1%. */
export const TAPS_PER_PERCENT = 4;
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
