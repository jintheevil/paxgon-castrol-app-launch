import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Receives a *batch* of taps from one client. The client accumulates taps
 * locally and flushes the count every ~250ms, so many fast taps become one
 * atomic INCRBY rather than a request per tap.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ count: 1 }));
  const raw = Number(body?.count);
  const count = Number.isFinite(raw) ? Math.max(1, Math.min(1000, raw)) : 1;

  await getStore().addTaps(count);
  return NextResponse.json({ ok: true });
}
