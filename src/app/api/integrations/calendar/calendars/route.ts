import { getGoogleCalendars } from "@/actions/integrations"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await getGoogleCalendars()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[CALENDARS_GET_ERROR]", error)
    return new NextResponse(error.message || "Internal Error", { status: 500 })
  }
} 