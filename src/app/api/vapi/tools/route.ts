"use server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/utils" // prisma client helper
// Importamos directamente la lógica de los endpoints internos para evitar latencia de red
import { POST as availabilityFn } from "../../integrations/calendar/availability/route"
import { POST as createEventFn } from "../../integrations/calendar/events/route"

// Tipos mínimos extraídos de la documentación de Vapi
type VapiToolCall = {
  id: string // toolCallId que debemos devolver
  name: string
  arguments: Record<string, any> | string // a veces viene como string JSON
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Identificar el assistant (vapiId) para resolver el agente
    const assistantId: string | undefined = body?.assistant?.id
    if (!assistantId) {
      return NextResponse.json({ error: "assistantId missing in payload" }, { status: 400 })
    }

    // 2. Buscar el agente y el usuario propietario
    const agent = await db.agent.findFirst({
      where: { vapiId: assistantId },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // 3. Obtener la integración de Google Calendar para ese usuario
    const integration = await db.integration.findFirst({
      where: {
        userId: agent.userId,
        provider: "GOOGLE_CALENDAR",
      },
      select: { id: true },
    })

    if (!integration) {
      return NextResponse.json({ error: "No Google Calendar integration configured for this user" }, { status: 400 })
    }

    const connectionId = integration.id

    // 4. Procesar cada llamada de herramienta
    const toolCalls: VapiToolCall[] = body?.message?.toolCallList || []
    if (toolCalls.length === 0) {
      return NextResponse.json({ error: "No tool calls provided" }, { status: 400 })
    }

    const results = await Promise.all(
      toolCalls.map(async (call) => {
        const { id: toolCallId, name, arguments: rawArgs } = call
        // A veces Vapi envía arguments como string JSON
        const args: Record<string, any> = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs || {}

        let result: string

        // Helper para simular una Request interna y reusar la lógica existente sin hop de red
        const makeInternalRequest = (payload: Record<string, any>) =>
          new Request(req.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ connectionId, ...payload }),
          })

        try {
          if (name === "getAvailability") {
            const apiRes = await availabilityFn(makeInternalRequest(args))
            const data = await apiRes.json()
            if (!apiRes.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data))

            // Devuelve los primeros 5 slots legibles
            const list = (data.availability || []).slice(0, 5) as { start: string }[]
            result =
              list.length > 0
                ? `Horarios disponibles: ${list
                    .map((s) => new Date(s.start).toISOString())
                    .join(", ")}`
                : "No hay disponibilidad en los próximos días."
          } else if (name === "createEvent") {
            const apiRes = await createEventFn(makeInternalRequest(args))
            const data = await apiRes.json()
            if (!apiRes.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data))

            result = `Evento '${data.event?.summary || "sin título"}' creado correctamente.`
          } else {
            result = `Tool '${name}' no soportada.`
          }
        } catch (err: any) {
          console.error("Tool processing error", err)
          result = `Error ejecutando ${name}: ${err.message || err}`
        }

        return {
          toolCallId,
          result,
        }
      })
    )

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error("[TOOL_HANDLER_ERROR]", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
} 