import { getAccessToken } from "@/actions/nango";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("connectionId");
    let timeMin = searchParams.get("timeMin");
    let timeMax = searchParams.get("timeMax");
    const calendarId = searchParams.get("calendarId") || "primary";

    console.log("Parámetros recibidos:", { connectionId, timeMin, timeMax, calendarId });

    // Validar parámetros
    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }
    
    if (!timeMin || !timeMax) {
        timeMin = new Date().toISOString();
        timeMax = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
    }

    // Validar formato de fechas
    if (isNaN(Date.parse(timeMin)) || isNaN(Date.parse(timeMax))) {
      return NextResponse.json(
        { error: "Invalid timeMin or timeMax format" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken(connectionId);
    console.log("Access Token:", accessToken);

    const freeBusyRequest = {
      timeMin: timeMin,
      timeMax: timeMax,
      timeZone: "UTC",
      items: [{ id: calendarId }],
    };

    console.log("FreeBusy Request:", freeBusyRequest);

    const response = await axios.post(
      "https://www.googleapis.com/calendar/v3/freeBusy",
      freeBusyRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Respuesta de FreeBusy:", response.data);
    const calendars = response.data.calendars;

    return NextResponse.json(calendars);
  } catch (error: any) {
    console.error("Error al obtener los períodos disponibles:", error.response?.data || error);
    return NextResponse.json(
      {
        error: "Error al obtener los períodos disponibles",
        details: error.response?.data?.error || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("connectionId");
    const calendarId = searchParams.get("calendarId") || "primary";

    // Validar parámetros
    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Obtener el cuerpo de la petición
    const eventData = await request.json();

    // Validar datos del evento
    if (!eventData.summary || !eventData.start || !eventData.end) {
      return NextResponse.json(
        { error: "Event summary, start and end times are required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken(connectionId);
    console.log("Access Token:", accessToken);

    // Crear el evento en Google Calendar
    const response = await axios.post(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      eventData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Evento creado:", response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error al crear el evento:", error.response?.data || error);
    return NextResponse.json(
      {
        error: "Error al crear el evento",
        details: error.response?.data?.error || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}