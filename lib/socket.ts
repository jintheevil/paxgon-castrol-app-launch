"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { LaunchState } from "@/types/state";

const INITIAL: LaunchState = {
  phase: "idle",
  progress: 0,
  totalTaps: 0,
  guests: 0,
};

let socketSingleton: Socket | null = null;

function getSocket(): Socket {
  if (socketSingleton) return socketSingleton;
  socketSingleton = io({
    transports: ["websocket", "polling"],
    autoConnect: true,
  });
  return socketSingleton;
}

export function useLaunchSocket() {
  const [state, setState] = useState<LaunchState>(INITIAL);
  const [connected, setConnected] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onState = (s: LaunchState) => setState(s);
    const onBurst = (n: number) => setBurstCount((c) => c + n);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("state", onState);
    socket.on("burst", onBurst);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("state", onState);
      socket.off("burst", onBurst);
    };
  }, []);

  return {
    state,
    connected,
    burstCount,
    tap: () => socketRef.current?.emit("tap"),
    mcStart: () => socketRef.current?.emit("mc:start"),
    mcReveal: () => socketRef.current?.emit("mc:reveal"),
    mcReset: () => socketRef.current?.emit("mc:reset"),
  };
}
