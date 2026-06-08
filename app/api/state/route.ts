import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { computeState } from "@/lib/launchLogic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Authoritative state for all clients. Polled by /stage, /, and /mc.
 * An optional `cid` query param doubles as a presence heartbeat so we
 * don't need a separate endpoint or extra round-trip.
 */
export async function GET(req: NextRequest) {
  const store = getStore();
  const cid = req.nextUrl.searchParams.get("cid");
  if (cid) await store.heartbeat(cid);

  const [raw, guests] = await Promise.all([store.read(), store.guests()]);
  const state = computeState(raw, guests);

  return NextResponse.json(state, {
    headers: { "Cache-Control": "no-store" },
  });
}
