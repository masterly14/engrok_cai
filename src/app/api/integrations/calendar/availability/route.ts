import { NextResponse } from "next/server"
import { getIntegrationAccessToken } from "@/actions/integrations"

async function getAvailability(
  accessToken: string,
  calendarId: string,
  daysToCheck: number,
  startTime: string,
  endTime: string,
  eventDurationMinutes: number
) {
  const timeMin = new Date()
  timeMin.setHours(0, 0, 0, 0) // Start of today
  const timeMax = new Date(timeMin)
  timeMax.setDate(timeMin.getDate() + daysToCheck)

  const freeBusyResponse = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    }),
  })

  if (!freeBusyResponse.ok) {
    const error = await freeBusyResponse.json()
    console.error("Google Calendar API Error:", error)
    throw new Error(`Google Calendar API error: ${error.error?.message || "Failed to fetch free/busy data"}`)
  }

  const freeBusyData = await freeBusyResponse.json()
  const busySlots = freeBusyData.calendars[calendarId]?.busy || []

  // --- Availability Calculation Logic ---
  const availableSlots = []
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  for (let i = 0; i < daysToCheck; i++) {
    const day = new Date(timeMin)
    day.setDate(day.getDate() + i)

    const dayStart = new Date(day)
    dayStart.setHours(startHour, startMinute, 0, 0)

    const dayEnd = new Date(day)
    dayEnd.setHours(endHour, endMinute, 0, 0)

    let cursor = new Date(dayStart)

    while (cursor.getTime() < dayEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + eventDurationMinutes * 60 * 1000)

      if (slotEnd.getTime() > dayEnd.getTime()) {
        break // Slot extends beyond working hours
      }

      const isBusy = busySlots.some(
        (busy: { start: string; end: string }) =>
          new Date(busy.start).getTime() < slotEnd.getTime() && new Date(busy.end).getTime() > cursor.getTime()
      )

      if (!isBusy) {
        availableSlots.push({
          start: cursor.toISOString(),
          end: slotEnd.toISOString(),
        })
      }
      cursor.setMinutes(cursor.getMinutes() + 15) // Check every 15 minutes for a new slot start
    }
  }

  return availableSlots
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      connectionId,
      calendarId = "primary",
      daysToCheck = 15,
      startTime = "09:00",
      endTime = "17:00",
      eventDurationMinutes = 30, // Default to 30 min slots
    } = body

    if (!connectionId) {
      return new NextResponse("Connection ID is required", { status: 400 })
    }

    const accessToken = await getIntegrationAccessToken(connectionId, "google-calendar")

    const availableSlots = await getAvailability(
      accessToken,
      calendarId,
      daysToCheck,
      startTime,
      endTime,
      eventDurationMinutes
    )

    return NextResponse.json({ availability: availableSlots })
  } catch (error: any) {
    console.error("[AVAILABILITY_POST_ERROR]", error)
    return new NextResponse(error.message || "Internal Server Error", { status: 500 })
  }
} 