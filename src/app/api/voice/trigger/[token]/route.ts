import { db } from "@/utils"; // Ajusta la ruta a tu configuración de DB
import { NextRequest, NextResponse } from "next/server";

// Helper para obtener de forma segura un valor anidado de un objeto.
// Por ejemplo, para obtener 'user.profile.phone' del objeto { user: { profile: { phone: '123' } } }
const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Token no proporcionado en la URL." },
      { status: 400 },
    );
  }

  try {
    // 1. Validar el token y obtener la configuración del trigger y su workflow asociado.
    const trigger = await db.voiceWorkflowTrigger.findUnique({
      where: { token },
      include: {
        workflow: true, // Incluimos el workflow para obtener su vapiWorkflowId
      },
    });

    // Si el trigger no existe o el workflow asociado no tiene un ID de Vapi, la llamada no puede continuar.
    if (!trigger || !trigger.workflow.vapiWorkflowId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Trigger no válido o el workflow asociado no está sincronizado con Vapi.",
        },
        { status: 404 },
      );
    }

    // 2. Obtener el cuerpo (payload) de la petición entrante.
    const body = await request.json();

    // 3. Usar el 'mapping' del trigger para extraer dinámicamente el número de teléfono.
    const mapping = trigger.mapping as {
      phone: string;
      vars?: Record<string, string>;
    };
    const phoneNumberToCall = getNestedValue(body, mapping.phone);

    if (!phoneNumberToCall) {
      console.error(
        `Trigger ${trigger.id}: No se encontró el teléfono en el payload usando el mapping '${mapping.phone}'. Payload recibido:`,
        JSON.stringify(body),
      );
      return NextResponse.json(
        {
          success: false,
          error: `No se pudo encontrar el número de teléfono en el payload usando el mapping: '${mapping.phone}'.`,
        },
        { status: 400 },
      );
    }

    // 4. Buscar el número de teléfono asociado a este workflow.
    const phoneNumberFrom = await db.phoneNumber.findFirst({
      where: {
        workflowId: trigger.workflow.id,
        userId: trigger.userId, // Añadimos seguridad extra
      },
    });

    if (!phoneNumberFrom) {
      return NextResponse.json(
        {
          error:
            "No hay un número de teléfono de origen asignado a este workflow.",
        },
        { status: 400 },
      );
    }

    // 5. Extraer variables adicionales para personalizar la llamada
    const variables: Record<string, any> = {};
    if (mapping.vars) {
      for (const key in mapping.vars) {
        const value = getNestedValue(body, mapping.vars[key]);
        if (value !== undefined) {
          variables[key] = value;
        }
      }
    }

    // 6. Construir y ejecutar la llamada a la API de Vapi.
    const vapiResponse = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      },
      body: JSON.stringify({
        phoneNumberId: phoneNumberFrom.vapiId, // Usamos el ID del número en Vapi
        assistant: {
          firstMessage: `Hola ${variables["name"] || ""}, te llamamos de Engrok.`,
          metadata: {
            ...variables,
          },
        },
      }),
    });

    if (!vapiResponse.ok) {
      const errorData = await vapiResponse.json();
      console.error(
        `Trigger ${trigger.id}: Error al llamar a la API de Vapi:`,
        errorData,
      );
      return NextResponse.json(
        {
          success: false,
          error: "Error al iniciar la llamada a través de Vapi.",
          details: errorData,
        },
        { status: 502 }, // 502 Bad Gateway es apropiado aquí.
      );
    }

    const callData = await vapiResponse.json();

    // 7. Devolver una respuesta exitosa.
    return NextResponse.json(
      {
        success: true,
        message: "Llamada iniciada con éxito.",
        callId: callData.id,
      },
      { status: 201 }, // 201 Created es el código de estado correcto.
    );
  } catch (error: any) {
    console.error(
      `Trigger con token ${token}: Error fatal en el webhook.`,
      error,
    );
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload de la petición no es un JSON válido.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
