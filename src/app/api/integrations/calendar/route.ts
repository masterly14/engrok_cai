import { getAccessToken } from "@/actions/nango";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let connectionId = searchParams.get("connectionId");
    const userIdParam = searchParams.get("userId");
    let rangeDays = Number(searchParams.get("rangeDays"));
    const calendarId = searchParams.get("calendarId") || "primary";

    console.log("Parámetros recibidos:", { connectionId, rangeDays, calendarId });

    // Validar parámetros, permitir userId como alternativa
    if (!connectionId) {
      if (userIdParam) {
        try {
          // Buscar la conexión en la base de datos
          const conn = await db.connection.findFirst({
            where: {
              userId: userIdParam,
              providerConfigKey: "google-calendar",
            },
          });
          if (!conn) {
            return NextResponse.json(
              { error: "No se encontró una conexión para el usuario proporcionado" },
              { status: 404 }
            );
          }
          connectionId = conn.connectionId;
        } catch (e) {
          console.error("Error al buscar la conexión:", e);
          return NextResponse.json(
            { error: "Error interno buscando la conexión" },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Connection ID or userId is required" },
          { status: 400 }
        );
      }
    }
    
    if (!rangeDays) {
        rangeDays = 15;
    }

    // Validar formato de fechas
    if (isNaN(rangeDays)) {
      return NextResponse.json(
        { error: "Invalid rangeDays format" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken(connectionId!);
    console.log("Access Token:", accessToken);

    const freeBusyRequest = {
      timeMin: new Date().toISOString(),
      timeMax: new Date(new Date().setDate(new Date().getDate() + rangeDays)).toISOString(),
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

    // -------------------------------------------------------------
    // Calcular períodos de disponibilidad a partir de la respuesta
    // -------------------------------------------------------------
    // Helper para transformar los períodos ocupados en períodos libres entre
    // `timeMin` y `timeMax` (que usamos para la petición freeBusy)
    const calculateAvailability = (
      busy: { start: string; end: string }[],
      timeMin: string,
      timeMax: string
    ) => {
      // Ordenar los períodos ocupados por fecha de inicio
      const sortedBusy = [...busy].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );

      const free: { start: string; end: string }[] = [];
      let cursor = new Date(timeMin);
      const endBound = new Date(timeMax);

      for (const period of sortedBusy) {
        const busyStart = new Date(period.start);
        const busyEnd = new Date(period.end);

        // Si hay hueco entre el cursor y el inicio del período ocupado, añadimos como libre
        if (busyStart.getTime() > cursor.getTime()) {
          free.push({ start: cursor.toISOString(), end: busyStart.toISOString() });
        }

        // Avanzar el cursor al final del período ocupado si estamos detrás
        if (busyEnd.getTime() > cursor.getTime()) {
          cursor = busyEnd;
        }
      }

      // Si al final queda tiempo libre entre el cursor y el límite superior, añadirlo
      if (cursor.getTime() < endBound.getTime()) {
        free.push({ start: cursor.toISOString(), end: endBound.toISOString() });
      }

      return free;
    };

    // Añadimos la clave "available" a cada calendario con sus huecos libres
    Object.keys(calendars).forEach((id) => {
      const busyPeriods = calendars[id].busy || [];
      calendars[id].available = calculateAvailability(
        busyPeriods,
        freeBusyRequest.timeMin,
        freeBusyRequest.timeMax
      );
    });

    // Devolverá tanto los períodos ocupados como los libres
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
    const { summary, description, start, duration } = eventData;

    // Validar datos del evento
    if (!summary || !start || duration === undefined) {
      return NextResponse.json(
        {
          error: "Event summary, start time and duration are required",
        },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid start date format" },
        { status: 400 }
      );
    }

    const durationInMs = Number(duration) * 60 * 1000;
    if (isNaN(durationInMs)) {
      return NextResponse.json(
        { error: "Invalid duration format. Must be a number of minutes." },
        { status: 400 }
      );
    }

    const endDate = new Date(startDate.getTime() + durationInMs);

    const accessToken = await getAccessToken(connectionId!);
    console.log("Access Token:", accessToken);

    const finalEventData = {
      summary,
      description,
      start: {
        dateTime: startDate.toISOString(),
      },
      end: {
        dateTime: endDate.toISOString(),
      },
    };

    // Crear el evento en Google Calendar
    const response = await axios.post(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      finalEventData,
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