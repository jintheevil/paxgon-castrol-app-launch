"use client";

import { useEffect, useRef, useState } from "react";
import type { LaunchState } from "@/types/state";

const INITIAL: LaunchState = {
  phase: "idle",
  progress: 0,
  totalTaps: 0,
  guests: 0,
};

/** How often each client pulls authoritative state. */
const POLL_MS = 300;
/** How often batched taps are flushed to the server. */
const FLUSH_MS = 250;

/**
 * Stable per-tab client id, used for presence (guest count). Kept in
 * sessionStorage so a refresh doesn't inflate the count with a new id.
 */
function getClientId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = sessionStorage.getItem("wsms_cid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("wsms_cid", id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

/**
 * Drop-in replacement for the old Socket.IO hook. Same name, same return
 * shape — so the page components don't change — but backed by HTTP polling
 * + batched POSTs, which deploy natively to Vercel (no persistent sockets).
 */
export function useLaunchSocket() {
  const [state, setState] = useState<LaunchState>(INITIAL);
  const [connected, setConnected] = useState(false);

  const pendingTaps = useRef(0);
  const cidRef = useRef("");

  useEffect(() => {
    cidRef.current = getClientId();
    let alive = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/state?cid=${cidRef.current}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const s: LaunchState = await res.json();
        if (alive) {
          setState(s);
          setConnected(true);
        }
      } catch {
        if (alive) setConnected(false);
      }
    };

    const flush = async () => {
      const n = pendingTaps.current;
      if (n <= 0) return;
      pendingTaps.current = 0;
      try {
        await fetch("/api/tap", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ count: n }),
        });
      } catch {
        // Re-queue on failure so taps aren't lost.
        pendingTaps.current += n;
      }
    };

    poll();
    const pollId = setInterval(poll, POLL_MS);
    const flushId = setInterval(flush, FLUSH_MS);

    return () => {
      alive = false;
      clearInterval(pollId);
      clearInterval(flushId);
    };
  }, []);

  const mc = (action: "start" | "reveal" | "reset") =>
    fetch("/api/mc", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => {});

  return {
    state,
    connected,
    burstCount: 0,
    tap: () => {
      pendingTaps.current += 1;
    },
    mcStart: () => mc("start"),
    mcReveal: () => mc("reveal"),
    mcReset: () => mc("reset"),
  };
}
