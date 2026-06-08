import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Action = "start" | "reveal" | "reset";

/** MC control panel actions. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body?.action as Action | undefined;
  const store = getStore();

  switch (action) {
    case "start":
      await store.start();
      break;
    case "reveal":
      await store.reveal();
      break;
    case "reset":
      await store.reset();
      break;
    default:
      return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
