import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

/**
 * Endpoint para simular la llegada de un mensaje de WhatsApp y testear flujos.
 * Recibe un número de teléfono y un texto, y llama al webhook de WhatsApp
 * de la propia aplicación para iniciar el flujo de conversación.
 */
export async function POST(req: NextRequest) {
  try {
    const { from, text, phone_number_id } = await req.json();

    if (!from || !text) {
      return NextResponse.json(
        { message: "Los campos 'from' y 'text' son requeridos." },
        { status: 400 }
      );
    }

    // Construir un payload simulado de webhook de WhatsApp
    const webhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WHATSAPP_BUSINESS_ACCOUNT_ID", // Puede ser un valor de prueba
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "DISPLAY_PHONE_NUMBER",
                  phone_number_id: phone_number_id || "TEST_PHONE_ID",
                },
                contacts: [
                  {
                    profile: {
                      name: "Test User",
                    },
                    wa_id: from,
                  },
                ],
                messages: [
                  {
                    from: from,
                    id: `wamid.test_${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: {
                      body: text,
                    },
                    type: "text",
                  },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    };

    // Obtener la URL base de la aplicación para poder llamar al webhook interno
    const baseUrl = req.nextUrl.origin;
    const webhookUrl = `${baseUrl}/api/meta/whatsapp/webhook`;

    // Llamar al propio webhook de la aplicación para simular el evento
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Aquí podrías añadir alguna cabecera de seguridad si tu webhook la requiere
        // Por ejemplo, un token secreto para verificar que la llamada es legítima.
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorBody = await webhookResponse.text();
      console.error(
        "[API /test-whatsapp] Error al llamar al webhook:",
        webhookResponse.status,
        errorBody
      );
      return NextResponse.json(
        {
          success: false,
          message: `Error al procesar el webhook: ${webhookResponse.statusText}`,
          details: errorBody,
        },
        { status: webhookResponse.status }
      );
    }

    revalidatePath("/application/agents/chat-agents/conversations");

    return NextResponse.json(
      {
        success: true,
        message: "Mensaje de prueba procesado y enviado al webhook.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /test-whatsapp] Error procesando la petición:", error);
    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
