import { NextResponse } from "next/server";
import { syncPlansFromLemon } from "@/actions/plan-sync";

export async function GET() {
  try {
    await syncPlansFromLemon();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("sync plans error", e);
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
