export type Phase =
  | "idle"
  | "standby"
  | "tapping"
  | "holding"
  | "revealed";

export type LaunchState = {
  phase: Phase;
  progress: number;
  totalTaps: number;
  guests: number;
};
