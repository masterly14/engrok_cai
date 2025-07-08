"use server";

import { NextResponse } from "next/server";
import { Nango } from "@nangohq/node";
import axios from "axios";

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! });

// This function calculates available 1-hour slots between 9 AM and 5 PM UTC for a given date.
function calculateAvailability(
  busySlots: { start: string; end: string }[],
  date: string,
) {
  const availableSlots: { start: string }[] = [];
  // We'll work in UTC to avoid timezone issues.
  const dayStart = new Date(`${date}T09:00:00.000Z`);
  const dayEnd = new Date(`${date}T17:00:00.000Z`);
  let currentSlotStart = new Date(dayStart);

  busySlots.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  for (const busySlot of busySlots) {
    const busyStart = new Date(busySlot.start);
    const busyEnd = new Date(busySlot.end);

    if (currentSlotStart < busyStart) {
      let slot = new Date(currentSlotStart);
      // Add slots until we hit the busy period
      while (slot < busyStart && slot < dayEnd) {
        availableSlots.push({ start: slot.toISOString() });
        slot.setHours(slot.getHours() + 1);
      }
    }
    // Move our cursor to the end of the busy slot
    if (busyEnd > currentSlotStart) {
      currentSlotStart = busyEnd;
    }
  }

  // Fill in the rest of the day after the last busy slot
  if (currentSlotStart < dayEnd) {
    let slot = new Date(currentSlotStart);
    while (slot < dayEnd) {
      availableSlots.push({ start: slot.toISOString() });
      slot.setHours(slot.getHours() + 1);
    }
  }

  return availableSlots;
}

async function getPrimaryCalendarId(accessToken: string): Promise<string> {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const primaryCalendar = response.data.items.find((cal: any) => cal.primary);
    return primaryCalendar?.id || "primary";
  } catch (error) {
    console.error("Error fetching primary calendar ID:", error);
    return "primary";
  }
}

export async function POST(req: Request) {
  try {
    const {
      connectionId,
      date,
      calendarId: providedCalendarId,
    } = await req.json();

    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 },
      );
    }

    // Retrieve a fresh access token (Nango auto-refreshes internally)
    const token: string = (await nango.getToken(
      "google-calendar",
      connectionId,
    )) as unknown as string;

    const calendarId =
      providedCalendarId || (await getPrimaryCalendarId(token));
    const today = new Date(date || new Date());

    // Set time to beginning of the day in UTC for comparison
    today.setUTCHours(0, 0, 0, 0);
    const timeMin = today.toISOString();

    // Set time to end of the day
    const timeMaxDate = new Date(today);
    timeMaxDate.setUTCHours(23, 59, 59, 999);
    const timeMax = timeMaxDate.toISOString();

    const response = await axios.get(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: "startTime",
        },
      },
    );

    const events = response.data.items || [];
    const busySlots = events.map((event: any) => ({
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
    }));

    const dayStr = timeMin.split("T")[0];
    const availability = calculateAvailability(busySlots, dayStr);

    return NextResponse.json({ availability });
  } catch (error: any) {
    console.error(
      "Error getting vapi availability:",
      error.response?.data || error.message,
    );
    return NextResponse.json(
      { error: "Failed to get availability for vapi" },
      { status: 500 },
    );
  }
}
