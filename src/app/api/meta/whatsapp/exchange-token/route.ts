import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, wabaId, phoneNumberId } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        {
          error:
            "El código de autorización es inválido o no fue proporcionado.",
        },
        { status: 400 },
      );
    }

    let finalWabaId: string | undefined = wabaId;
    let finalPhoneNumberId: string | undefined = phoneNumberId;

    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error(
        "Las variables de entorno de Meta no están configuradas en el servidor.",
      );
    }

    const tokenUrl = new URL(
      "https://graph.facebook.com/v20.0/oauth/access_token",
    );
    tokenUrl.searchParams.append("client_id", appId);
    tokenUrl.searchParams.append("client_secret", appSecret);
    tokenUrl.searchParams.append("code", code);

    const response = await fetch(tokenUrl.toString());
    const data = await response.json();

    if (data.error) {
      console.error("Error desde la API de Grafo de Facebook:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const accessToken = data.access_token;
    console.log("Access Token recibido:", accessToken);

    let userId: string;
    try {
      const { data: user } = await (
        await import("@/actions/user")
      ).onBoardUser();
      userId = user.id;
    } catch (err) {
      console.error(
        "No se pudo determinar el usuario Clerk en el callback:",
        err,
      );
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let phoneNumber: string | null = null;

    if (!finalWabaId || !finalPhoneNumberId) {
      try {
        const systemUserToken = process.env.META_SYSTEM_USER_TOKEN;
        if (!systemUserToken)
          throw new Error("META_SYSTEM_USER_TOKEN no definido");

        const debugRes = await fetch(
          `https://graph.facebook.com/v20.0/debug_token?input_token=${accessToken}`,
          { headers: { Authorization: `Bearer ${systemUserToken}` } },
        );
        const debugJson = await debugRes.json();

        const granular = debugJson.data?.granular_scopes?.find(
          (s: any) => s.scope === "whatsapp_business_management",
        );
        if (granular?.target_ids?.length) {
          finalWabaId = finalWabaId || granular.target_ids[0];
        }

        if (finalWabaId) {
          const phoneResp = await fetch(
            `https://graph.facebook.com/v20.0/${finalWabaId}/phone_numbers?fields=id,display_phone_number&access_token=${accessToken}`,
          );
          const phoneJson = await phoneResp.json();
          if (phoneJson?.data?.length) {
            finalPhoneNumberId = finalPhoneNumberId || phoneJson.data[0].id;
            phoneNumber = phoneNumber || phoneJson.data[0].display_phone_number;
          }
        }
      } catch (err) {
        console.warn(
          "No se pudo derivar WABA o phoneNumberId automáticamente",
          err,
        );
      }
    }

    if (!finalPhoneNumberId || !finalWabaId) {
      return NextResponse.json(
        { error: "No se pudo determinar WABA o phoneNumberId" },
        { status: 400 },
      );
    }

    // ---- Registrar el número de teléfono para la API de Cloud con reintentos ----
    let registrationSuccess = false;
    let lastError: any = null;
    const maxRetries = 5; // 1 intento inicial + 4 reintentos

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Intentando registrar el número de teléfono ID: ${finalPhoneNumberId} (Intento ${attempt}/${maxRetries})`,
        );

        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const registerUrl = `https://graph.facebook.com/v20.0/${finalPhoneNumberId}/register`;

        const registerResponse = await fetch(registerUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            pin: pin,
          }),
        });

        const registerData = await registerResponse.json();

        if (registerResponse.ok && registerData.success) {
          console.log("¡Número de teléfono registrado con éxito!");
          registrationSuccess = true;
          break; // Salir del bucle si es exitoso
        } else {
          lastError = registerData;
          console.error(
            `Intento ${attempt} fallido al registrar el número de teléfono:`,
            lastError,
          );
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s, 16s
            console.log(
              `Esperando ${delay / 1000}s antes del siguiente reintento...`,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      } catch (err) {
        lastError = err;
        console.error(
          `Excepción en el intento ${attempt} de registrar el número:`,
          err,
        );
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(
            `Esperando ${delay / 1000}s antes del siguiente reintento...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (!registrationSuccess) {
      console.error(
        "Todos los intentos de registrar el número de teléfono fallaron. Último error:",
        lastError,
      );
      // No lanzamos un error fatal, pero lo registramos. El flujo puede continuar para guardar los datos.
    }
    // ----------------------------------------------------------------

    // ---- Suscribir explícitamente el WABA a los webhooks de la App ----
    try {
      console.log(
        `Suscribiendo el WABA ${finalWabaId} a los webhooks de la aplicación...`,
      );
      const subscribeUrl = `https://graph.facebook.com/v20.0/${finalWabaId}/subscribed_apps`;
      const subscribeResponse = await fetch(subscribeUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscribed_fields: ["messages"],
        }),
      });

      const subscribeData = await subscribeResponse.json();

      if (subscribeResponse.ok && subscribeData.success) {
        console.log("Suscripción al webhook forzada con éxito para el WABA.");
      } else {
        // Este error no es necesariamente fatal (puede que ya estuviera suscrito), pero es importante registrarlo.
        console.warn(
          "No se pudo forzar la suscripción al webhook (puede que ya estuviera activa). Respuesta:",
          subscribeData,
        );
      }
    } catch (err) {
      console.error(
        "Excepción al intentar forzar la suscripción al webhook:",
        err,
      );
    }
    // --------------------------------------------------------------------

    try {
      const phoneRes = await fetch(
        `https://graph.facebook.com/v20.0/${finalPhoneNumberId}?fields=display_phone_number&access_token=${accessToken}`,
      );
      const phoneJson = await phoneRes.json();
      phoneNumber = phoneJson.display_phone_number || null;
    } catch (err) {
      console.warn(
        "No se pudo obtener el número de teléfono. Continuando igualmente.",
      );
    }

    try {
      const { db } = await import("@/utils");

      const name = phoneNumber
        ? `Línea ${phoneNumber}`
        : `WhatsApp Line ${finalPhoneNumberId!.slice(-4)}`;

      const agent = await db.chatAgent.upsert({
        where: { whatsappPhoneNumberId: finalPhoneNumberId! },
        update: {
          whatsappAccessToken: accessToken,
          whatsappBusinessAccountId: finalWabaId!,
          whatsappPhoneNumber: phoneNumber ?? undefined,
          isActive: true,
          userId,
        },
        create: {
          name,
          isActive: true,
          userId,
          whatsappAccessToken: accessToken,
          whatsappBusinessAccountId: finalWabaId!,
          whatsappPhoneNumberId: finalPhoneNumberId!,
          whatsappPhoneNumber: phoneNumber ?? "",
        },
      });

      return NextResponse.json({
        success: true,
        chatAgentId: agent.id,
        phoneNumber: phoneNumber ?? undefined,
      });
    } catch (err: any) {
      console.error("Error guardando ChatAgent:", err);
      return NextResponse.json(
        { error: "No se pudo guardar la línea de WhatsApp." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error interno en el endpoint exchange-token:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
