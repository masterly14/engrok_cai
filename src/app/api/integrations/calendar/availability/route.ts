import { NextResponse } from "next/server";
import { getIntegrationAccessToken } from "@/actions/integrations";

async function getAvailability(
  accessToken: string,
  calendarId: string,
  daysToCheck: number,
  startTime: string,
  endTime: string,
  eventDurationMinutes: number,
) {
  // Forcing Bogota timezone as requested.
  const timeZone = "America/Bogota";
  const timeZoneOffset = "-05:00"; // Bogota is UTC-5 and doesn't have DST.

  // Use Intl.DateTimeFormat to reliably get the current date in the target timezone.
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const { year, month, day } = dtf
    .formatToParts(new Date())
    .reduce(
      (acc, part) => ({ ...acc, [part.type]: part.value }),
      {} as Record<string, string>,
    );

  const todayInTimeZone = `${year}-${month}-${day}`;

  // Create timeMin at the beginning of today in the target timezone.
  const timeMin = new Date(`${todayInTimeZone}T00:00:00.000${timeZoneOffset}`);
  const timeMax = new Date(timeMin);
  timeMax.setDate(timeMin.getDate() + daysToCheck);

  const freeBusyResponse = await fetch(
    "https://www.googleapis.com/calendar/v3/freeBusy",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: calendarId }],
        timeZone: timeZone, // Inform Google API about the timezone context.
      }),
    },
  );

  if (!freeBusyResponse.ok) {
    const error = await freeBusyResponse.json();
    console.error("Google Calendar API Error:", error);
    throw new Error(
      `Google Calendar API error: ${error.error?.message || "Failed to fetch free/busy data"}`,
    );
  }

  const freeBusyData = await freeBusyResponse.json();
  const busySlots = freeBusyData.calendars[calendarId]?.busy || [];

  // --- Availability Calculation Logic ---
  const availableSlots = [];

  for (let i = 0; i < daysToCheck; i++) {
    const dayToProcess = new Date(timeMin);
    dayToProcess.setDate(dayToProcess.getDate() + i);

    // Construct the start and end of the working day in the target timezone.
    // We get the date parts again to handle day transitions correctly.
    const currentDayParts = dtf
      .formatToParts(dayToProcess)
      .reduce(
        (acc, part) => ({ ...acc, [part.type]: part.value }),
        {} as Record<string, string>,
      );
    const dayString = `${currentDayParts.year}-${currentDayParts.month}-${currentDayParts.day}`;

    const dayStart = new Date(`${dayString}T${startTime}:00${timeZoneOffset}`);
    const dayEnd = new Date(`${dayString}T${endTime}:00${timeZoneOffset}`);

    let cursor = new Date(dayStart);

    while (cursor.getTime() < dayEnd.getTime()) {
      const slotEnd = new Date(
        cursor.getTime() + eventDurationMinutes * 60 * 1000,
      );

      if (slotEnd.getTime() > dayEnd.getTime()) {
        break; // Slot extends beyond working hours
      }

      const isBusy = busySlots.some(
        (busy: { start: string; end: string }) =>
          new Date(busy.start).getTime() < slotEnd.getTime() &&
          new Date(busy.end).getTime() > cursor.getTime(),
      );

      if (!isBusy) {
        availableSlots.push({
          start: cursor.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
      cursor = new Date(cursor.getTime() + 15 * 60 * 1000); // Check every 15 minutes for a new slot start
    }
  }

  return availableSlots;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      connectionId,
      calendarId = body.calendarId || "primary",
      daysToCheck = 15,
      startTime = body.startTime || "09:00",
      endTime = body.endTime || "17:00",
      eventDurationMinutes = body.eventDurationMinutes || 60, // Default to 30 min slots
    } = body;

    if (!connectionId) {
      return new NextResponse("Connection ID is required", { status: 400 });
    }

    const accessToken = await getIntegrationAccessToken(connectionId);

    const availableSlots = await getAvailability(
      accessToken,
      calendarId,
      daysToCheck,
      startTime,
      endTime,
      eventDurationMinutes,
    );

    return NextResponse.json({ availability: availableSlots });
  } catch (error: any) {
    console.error("[AVAILABILITY_POST_ERROR]", error);
    if (error.response) {
      console.error("[AVAILABILITY_POST_ERROR] Data:", error.response.data);
    }
    return new NextResponse(error.message || "Internal Server Error", {
      status: 500,
    });
  }
}
