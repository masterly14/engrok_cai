import { getPublicPlans } from "@/actions/lemon-squeezy";
import { NextResponse } from "next/server";

export async function GET() {
  const plans = await getPublicPlans();
  console.log(plans);
  return NextResponse.json(plans);
} 