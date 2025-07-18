import { NextResponse } from "next/server";
import { getIntegrationAccessToken } from "@/actions/integrations";

async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  title: string,
  description: string | undefined,
  startTime: string,
  durationMinutes: number,
  attendees: string[],
) {
  const eventStartTime = new Date(startTime);
  const eventEndTime = new Date(
    eventStartTime.getTime() + durationMinutes * 60 * 1000,
  );

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
  };

  console.log(
    "Creating Google Calendar event with payload:",
    JSON.stringify(event, null, 2),
  );

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google Calendar API Error on event creation:", errorData);
    throw new Error(
      `Google Calendar API error: ${errorData.error?.message || "Failed to create event"}`,
    );
  }

  const responseData = await response.json();
  console.log("Successfully created Google Calendar event:", responseData);
  return responseData;
}

export async function POST(request: Request) {
  try {
    console.log("Received request to create calendar event");
    const body = await request.json();
    console.log("Request body:", body);
    const {
      connectionId,
      calendarId = "primary",
      title,
      description,
      startTime, // ISO string
      duration, // minutes
      attendeesVar, // comma-separated emails or variables
    } = body;

    console.log("Extracted parameters:", {
      connectionId,
      calendarId,
      title,
      description,
      startTime,
      duration,
      attendeesVar,
    });

    if (!connectionId || !title || !startTime || !duration) {
      console.error("Missing required fields");
      return new NextResponse(
        "Missing required fields: connectionId, title, startTime, duration",
        { status: 400 },
      );
    }

    const accessToken = await getIntegrationAccessToken(connectionId);
    console.log("Retrieved access token");

    // Parse attendees string into an array of emails
    const attendees = attendeesVar
      ? attendeesVar.split(",").map((s: string) => s.trim())
      : [];
    console.log("Parsed attendees:", attendees);

    console.log("Calling createCalendarEvent function");
    const createdEvent = await createCalendarEvent(
      accessToken,
      calendarId,
      title,
      description,
      startTime,
      parseInt(duration, 10),
      attendees,
    );

    console.log("Event creation successful, sending response.");
    return NextResponse.json({ event: createdEvent });
  } catch (error: any) {
    console.error("[CREATE_EVENT_POST_ERROR]", error);
    return new NextResponse(error.message || "Internal Server Error", {
      status: 500,
    });
  }
}
