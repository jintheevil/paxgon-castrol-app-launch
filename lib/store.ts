import { Redis } from "@upstash/redis";
import type { Phase } from "@/types/state";
import type { RawState } from "./launchLogic";

/** A guest is "present" if seen within this window. */
const PRESENCE_TTL_MS = 10_000;

/**
 * Storage abstraction for the launch activation. Two interchangeable
 * backends implement it:
 *   - MemoryStore: process-local, used for `next dev` (single process) when
 *     no Upstash credentials are configured.
 *   - RedisStore: Upstash Redis over REST, used in production / on Vercel
 *     where serverless functions share no memory.
 *
 * Note: stored phase is only ever idle | standby | tapping | revealed.
 * "holding" is derived in computeState, never persisted.
 */
export interface LaunchStore {
  read(): Promise<RawState>;
  /** Add taps to the collective meter (no-op unless we're tapping). */
  addTaps(n: number): Promise<void>;
  /** MC: begin the activation (resets taps). */
  start(): Promise<void>;
  /** MC: break through 99 → 100 and reveal F6. */
  reveal(): Promise<void>;
  /** MC: back to the standby / QR screen. */
  reset(): Promise<void>;
  /** Record a client as present (folded into state polling). */
  heartbeat(cid: string): Promise<void>;
  /** Number of clients seen within the presence window. */
  guests(): Promise<number>;
}

/* ------------------------------- Memory ------------------------------- */

class MemoryStore implements LaunchStore {
  private phase: Phase = "standby";
  private taps = 0;
  private revealAt: number | null = null;
  private presence = new Map<string, number>();

  async read(): Promise<RawState> {
    return { phase: this.phase, taps: this.taps, revealAt: this.revealAt };
  }

  async addTaps(n: number): Promise<void> {
    if (this.phase === "tapping") this.taps += n;
  }

  async start(): Promise<void> {
    this.phase = "tapping";
    this.taps = 0;
    this.revealAt = null;
  }

  async reveal(): Promise<void> {
    if (this.phase === "tapping") {
      this.phase = "revealed";
      this.revealAt = Date.now();
    }
  }

  async reset(): Promise<void> {
    this.phase = "standby";
    this.taps = 0;
    this.revealAt = null;
  }

  async heartbeat(cid: string): Promise<void> {
    this.presence.set(cid, Date.now());
  }

  async guests(): Promise<number> {
    const cutoff = Date.now() - PRESENCE_TTL_MS;
    for (const [k, v] of this.presence) {
      if (v < cutoff) this.presence.delete(k);
    }
    return this.presence.size;
  }
}

/* -------------------------------- Redis ------------------------------- */

const K = {
  phase: "wsms:phase",
  taps: "wsms:taps",
  revealAt: "wsms:revealAt",
  presence: "wsms:presence",
};

class RedisStore implements LaunchStore {
  constructor(private r: Redis) {}

  async read(): Promise<RawState> {
    const [phase, taps, revealAt] = await this.r.mget<
      [Phase | null, number | null, number | null]
    >(K.phase, K.taps, K.revealAt);
    return {
      phase: phase ?? "standby",
      taps: Number(taps ?? 0),
      revealAt: revealAt != null ? Number(revealAt) : null,
    };
  }

  async addTaps(n: number): Promise<void> {
    const phase = await this.r.get<Phase>(K.phase);
    if (phase === "tapping") await this.r.incrby(K.taps, n);
  }

  async start(): Promise<void> {
    await this.r.mset({ [K.phase]: "tapping", [K.taps]: 0 });
    await this.r.del(K.revealAt);
  }

  async reveal(): Promise<void> {
    const phase = await this.r.get<Phase>(K.phase);
    if (phase === "tapping") {
      await this.r.mset({ [K.phase]: "revealed", [K.revealAt]: Date.now() });
    }
  }

  async reset(): Promise<void> {
    await this.r.mset({ [K.phase]: "standby", [K.taps]: 0 });
    await this.r.del(K.revealAt);
  }

  async heartbeat(cid: string): Promise<void> {
    const now = Date.now();
    await this.r.zadd(K.presence, { score: now, member: cid });
    await this.r.zremrangebyscore(K.presence, 0, now - PRESENCE_TTL_MS);
  }

  async guests(): Promise<number> {
    const now = Date.now();
    await this.r.zremrangebyscore(K.presence, 0, now - PRESENCE_TTL_MS);
    return this.r.zcard(K.presence);
  }
}

/* ----------------------------- Selection ------------------------------ */

let store: LaunchStore | null = null;

export function getStore(): LaunchStore {
  if (store) return store;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    store = new RedisStore(new Redis({ url, token }));
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[wsms] No UPSTASH_REDIS_REST_URL/TOKEN set — falling back to in-memory store. " +
          "State will NOT be shared across serverless instances. Configure Upstash for production."
      );
    }
    store = new MemoryStore();
  }

  return store;
}
