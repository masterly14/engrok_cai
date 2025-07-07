"use server"

import { NextResponse } from "next/server"
import { Nango } from "@nangohq/node"
import axios from "axios"

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! })

async function getPrimaryCalendarId(accessToken: string): Promise<string> {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    const primaryCalendar = response.data.items.find((cal: any) => cal.primary)
    return primaryCalendar?.id || "primary"
  } catch (error) {
    console.error("Error fetching primary calendar ID:", error)
    return "primary"
  }
}

export async function POST(req: Request) {
  try {
    const {
      connectionId,
      title,
      startTime,
      endTime,
      attendeeEmail,
      calendarId: providedCalendarId,
    } = await req.json()

    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      )
    }
    if (!title || !startTime || !endTime || !attendeeEmail) {
      return NextResponse.json(
        { error: "Missing required event details" },
        { status: 400 }
      )
    }

    // Retrieve a fresh access token (Nango auto-refreshes internally)
    const token: string = await nango.getToken("google-calendar", connectionId) as unknown as string

    const calendarId =
      providedCalendarId || (await getPrimaryCalendarId(token))

    const event = {
      summary: title,
      start: {
        dateTime: startTime,
        timeZone: "America/Bogota", // This could be made dynamic later
      },
      end: {
        dateTime: endTime,
        timeZone: "America/Bogota",
      },
      attendees: [{ email: attendeeEmail }],
    }

    const response = await axios.post(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      event,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )

    return NextResponse.json({ event: response.data })
  } catch (error: any) {
    console.error(
      "Error creating event for vapi:",
      error.response?.data || error.message
    )
    return NextResponse.json(
      { error: "Failed to create event for vapi" },
      { status: 500 }
    )
  }
} 