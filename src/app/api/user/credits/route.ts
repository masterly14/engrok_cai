import { getUserCredits } from "@/actions/user";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const credits = await getUserCredits();
    return NextResponse.json(credits);
  } catch (error) {
    console.error("Error getting user credits:", error);
    return NextResponse.json(
      { error: "Failed to get user credits" },
      { status: 500 }
    );
  }
}
