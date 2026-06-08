import type { LaunchState, Phase } from "../types/state";

const HOLD_AT = 99;
const TAPS_PER_PERCENT = 4;
const REVEAL_DURATION_MS = 1400;

export class LaunchStore {
  private phase: Phase = "idle";
  private taps = 0;
  private guests = 0;
  private revealAt: number | null = null;

  snapshot(): LaunchState {
    return {
      phase: this.phase,
      progress: this.progressNow(),
      totalTaps: this.taps,
      guests: this.guests,
    };
  }

  private progressNow(): number {
    if (this.phase === "idle" || this.phase === "standby") return 0;
    if (this.phase === "revealed") {
      if (this.revealAt == null) return 100;
      const elapsed = Date.now() - this.revealAt;
      const t = Math.min(1, elapsed / REVEAL_DURATION_MS);
      return Math.min(100, HOLD_AT + t * (100 - HOLD_AT));
    }
    const fromTaps = this.taps / TAPS_PER_PERCENT;
    return Math.min(HOLD_AT, fromTaps);
  }

  addGuest(): void {
    this.guests += 1;
  }

  removeGuest(): void {
    this.guests = Math.max(0, this.guests - 1);
  }

  tap(): { phaseChanged: boolean; progress: number } {
    if (this.phase !== "tapping" && this.phase !== "holding") {
      return { phaseChanged: false, progress: this.progressNow() };
    }
    this.taps += 1;
    const prevPhase = this.phase;
    const p = this.progressNow();
    if (p >= HOLD_AT && this.phase === "tapping") {
      this.phase = "holding";
    }
    return { phaseChanged: this.phase !== prevPhase, progress: p };
  }

  mcStart(): boolean {
    if (this.phase !== "idle" && this.phase !== "standby" && this.phase !== "revealed") {
      return false;
    }
    this.phase = "tapping";
    this.taps = 0;
    this.revealAt = null;
    return true;
  }

  mcStandby(): boolean {
    if (this.phase === "revealed" || this.phase === "tapping" || this.phase === "holding") {
      return false;
    }
    this.phase = "standby";
    return true;
  }

  mcReveal(): boolean {
    if (this.phase !== "tapping" && this.phase !== "holding") return false;
    this.phase = "revealed";
    this.revealAt = Date.now();
    return true;
  }

  mcReset(): void {
    this.phase = "idle";
    this.taps = 0;
    this.revealAt = null;
  }
}
