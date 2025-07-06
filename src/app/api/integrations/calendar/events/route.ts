import { NextResponse } from "next/server"
import { getIntegrationAccessToken } from "@/actions/integrations"

async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  title: string,
  description: string | undefined,
  startTime: string,
  durationMinutes: number,
  attendees: string[]
) {
  const eventStartTime = new Date(startTime)
  const eventEndTime = new Date(eventStartTime.getTime() + durationMinutes * 60 * 1000)

  const event = {
    summary: title,
    description: description,
    start: {
      dateTime: eventStartTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use server's timezone
    },
    end: {
      dateTime: eventEndTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: attendees.map((email) => ({ email: email.trim() })),
    reminders: {
      useDefault: true,
    },
  }

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Google Calendar API Error on event creation:", errorData)
    throw new Error(`Google Calendar API error: ${errorData.error?.message || "Failed to create event"}`)
  }

  return await response.json()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      connectionId,
      calendarId = "primary",
      title,
      description,
      startTime, // ISO string
      duration, // minutes
      attendeesVar, // comma-separated emails or variables
    } = body

    if (!connectionId || !title || !startTime || !duration) {
      return new NextResponse("Missing required fields: connectionId, title, startTime, duration", { status: 400 })
    }

    const accessToken = await getIntegrationAccessToken(connectionId)

    // Parse attendees string into an array of emails
    const attendees = attendeesVar ? attendeesVar.split(",").map((s: string) => s.trim()) : []

    const createdEvent = await createCalendarEvent(
      accessToken,
      calendarId,
      title,
      description,
      startTime,
      parseInt(duration, 10),
      attendees
    )

    return NextResponse.json({ event: createdEvent })
  } catch (error: any) {
    console.error("[CREATE_EVENT_POST_ERROR]", error)
    return new NextResponse(error.message || "Internal Server Error", { status: 500 })
  }
} 