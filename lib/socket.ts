"use client";

import { useEffect, useRef, useState } from "react";
import {
  ref,
  onValue,
  set,
  update,
  remove,
  increment,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";
import { db } from "@/lib/firebase";
import { computeState, type RawState } from "@/lib/launchLogic";
import type { LaunchState } from "@/types/state";

const INITIAL: LaunchState = {
  phase: "idle",
  progress: 0,
  totalTaps: 0,
  guests: 0,
};

/** Default state when /launch hasn't been written yet. */
const DEFAULT_RAW: RawState = { phase: "standby", taps: 0, revealAt: null };

/** How often batched taps are flushed to RTDB as one atomic increment. */
const FLUSH_MS = 300;
/** Local recompute cadence — drives the smooth 99→100 reveal and the
 *  holding derivation between RTDB pushes (RTDB only fires on data change). */
const TICK_MS = 80;

/**
 * Stable per-tab id for presence (guest count). sessionStorage so a refresh
 * reuses it instead of inflating the count.
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

function sameState(a: LaunchState, b: LaunchState): boolean {
  return (
    a.phase === b.phase &&
    a.progress === b.progress &&
    a.totalTaps === b.totalTaps &&
    a.guests === b.guests
  );
}

/**
 * Same public API as the old Socket.IO hook (name + return shape) so the page
 * components are unchanged — now backed by Firebase Realtime Database, which
 * is itself a managed WebSocket service: one broadcast fans out to every
 * client, no polling, scales comfortably to hundreds of concurrent phones.
 */
export function useLaunchSocket() {
  const [state, setState] = useState<LaunchState>(INITIAL);
  const [connected, setConnected] = useState(false);

  const rawRef = useRef<RawState>(DEFAULT_RAW);
  const guestsRef = useRef(0);
  const pendingTaps = useRef(0);
  const lastRef = useRef<LaunchState>(INITIAL);

  useEffect(() => {
    const cid = getClientId();

    // 1. Authoritative launch state — pushed on every change.
    const launchRef = ref(db, "launch");
    const offLaunch = onValue(launchRef, (snap) => {
      const v = snap.val() as Partial<RawState> | null;
      rawRef.current = {
        phase: v?.phase ?? "standby",
        taps: typeof v?.taps === "number" ? v.taps : 0,
        revealAt: typeof v?.revealAt === "number" ? v.revealAt : null,
      };
    });

    // 2. Presence — register self on connect, auto-remove on disconnect.
    const meRef = ref(db, `presence/${cid}`);
    const connRef = ref(db, ".info/connected");
    const offConn = onValue(connRef, (snap) => {
      const isConnected = snap.val() === true;
      setConnected(isConnected);
      if (isConnected) {
        onDisconnect(meRef).remove();
        set(meRef, true).catch(() => {});
      }
    });
    const presenceRef = ref(db, "presence");
    const offPresence = onValue(presenceRef, (snap) => {
      guestsRef.current = snap.size;
    });

    // 3. Local ticker: recompute the displayed state from the latest raw
    //    snapshot + current time (smooth reveal animation + holding state).
    const tick = setInterval(() => {
      const next = computeState(rawRef.current, guestsRef.current);
      if (!sameState(next, lastRef.current)) {
        lastRef.current = next;
        setState(next);
      }
    }, TICK_MS);

    // 4. Flush batched taps as a single atomic server-side increment.
    const flush = setInterval(() => {
      const n = pendingTaps.current;
      if (n <= 0) return;
      pendingTaps.current = 0;
      update(launchRef, { taps: increment(n) }).catch(() => {
        pendingTaps.current += n; // re-queue on failure
      });
    }, FLUSH_MS);

    return () => {
      offLaunch();
      offConn();
      offPresence();
      clearInterval(tick);
      clearInterval(flush);
      remove(meRef).catch(() => {});
    };
  }, []);

  const launchRef = () => ref(db, "launch");

  return {
    state,
    connected,
    burstCount: 0,
    tap: () => {
      pendingTaps.current += 1;
    },
    mcStart: () =>
      set(launchRef(), { phase: "tapping", taps: 0, revealAt: null }).catch(
        () => {}
      ),
    mcReveal: () =>
      update(launchRef(), {
        phase: "revealed",
        revealAt: serverTimestamp(),
      }).catch(() => {}),
    mcReset: () =>
      set(launchRef(), { phase: "standby", taps: 0, revealAt: null }).catch(
        () => {}
      ),
  };
}
