import { NextResponse } from "next/server";
import { PlanService } from "@/services/plan-service";

// This route will be triggered by Vercel Cron e.g. "0 0 1 * *"
export async function GET() {
  try {
    await PlanService.runMonthlyReset();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Cron reset credits error", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
} 