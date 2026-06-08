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

export type ServerToClient = {
  state: (s: LaunchState) => void;
  burst: (n: number) => void;
};

export type ClientToServer = {
  tap: () => void;
  "mc:start": () => void;
  "mc:reveal": () => void;
  "mc:reset": () => void;
};
