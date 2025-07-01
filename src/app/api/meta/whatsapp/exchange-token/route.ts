import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, wabaId, phoneNumberId } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'El código de autorización es inválido o no fue proporcionado.' }, { status: 400 });
    }
    
    let finalWabaId: string | undefined = wabaId;
    let finalPhoneNumberId: string | undefined = phoneNumberId;

    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
        throw new Error("Las variables de entorno de Meta no están configuradas en el servidor.");
    }
    
    // Construye la URL para intercambiar el código por un token
    const tokenUrl = new URL('https://graph.facebook.com/v20.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', appId);
    tokenUrl.searchParams.append('client_secret', appSecret);
    tokenUrl.searchParams.append('code', code);
    
    // Realiza la petición servidor a servidor
    const response = await fetch(tokenUrl.toString());
    const data = await response.json();

    if (data.error) {
      console.error('Error desde la API de Grafo de Facebook:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const accessToken = data.access_token;
    console.log("Access Token recibido:", accessToken);

    /* ------------------------------------------------------------------ */
    /* 1) Determinar el usuario autenticado                               */
    /* ------------------------------------------------------------------ */
    let userId: string;
    try {
      // Utilizamos la lógica de onboarding ya existente para garantizar que
      // el usuario está en la base de datos y obtener su ID interno.
      const { data: user } = await (await import("@/actions/user")).onBoardUser();
      userId = user.id;
    } catch (err) {
      console.error("No se pudo determinar el usuario Clerk en el callback:", err);
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    /* ------------------------------------------------------------------ */
    /* 2) Obtener información del número de teléfono                      */
    /* ------------------------------------------------------------------ */
    let phoneNumber: string | null = null;

    /* Si no tenemos WABA o PhoneNumberId intentamos descubrirlos */
    if (!finalWabaId || !finalPhoneNumberId) {
      try {
        /* 2.A - Obtener el WABA más reciente mediante /debug_token   */
        const systemUserToken = process.env.META_SYSTEM_USER_TOKEN;
        if (!systemUserToken) throw new Error("META_SYSTEM_USER_TOKEN no definido");

        const debugRes = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${accessToken}`,
          { headers: { Authorization: `Bearer ${systemUserToken}` } });
        const debugJson = await debugRes.json();
        // console.log("DEBUG TOKEN:", JSON.stringify(debugJson, null, 2));

        const granular = debugJson.data?.granular_scopes?.find((s: any) => s.scope === 'whatsapp_business_management');
        if (granular?.target_ids?.length) {
          finalWabaId = finalWabaId || granular.target_ids[0];
        }

        /* 2.B - Con el WABA, obtener sus números */
        if (finalWabaId) {
          const phoneResp = await fetch(`https://graph.facebook.com/v20.0/${finalWabaId}/phone_numbers?fields=id,display_phone_number&access_token=${accessToken}`);
          const phoneJson = await phoneResp.json();
          if (phoneJson?.data?.length) {
            finalPhoneNumberId = finalPhoneNumberId || phoneJson.data[0].id;
            // También rellenamos phoneNumber si aún no lo hicimos
            phoneNumber = phoneNumber || phoneJson.data[0].display_phone_number;
          }
        }
      } catch (err) {
        console.warn("No se pudo derivar WABA o phoneNumberId automáticamente", err);
      }
    }

    if (!finalPhoneNumberId || !finalWabaId) {
      return NextResponse.json({ error: "No se pudo determinar WABA o phoneNumberId" }, { status: 400 });
    }

    try {
      const phoneRes = await fetch(`https://graph.facebook.com/v20.0/${finalPhoneNumberId}?fields=display_phone_number&access_token=${accessToken}`);
      const phoneJson = await phoneRes.json();
      phoneNumber = phoneJson.display_phone_number || null;
    } catch (err) {
      console.warn("No se pudo obtener el número de teléfono. Continuando igualmente.");
    }

    /* ------------------------------------------------------------------ */
    /* 3) Upsert del ChatAgent                                            */
    /* ------------------------------------------------------------------ */
    try {
      const { db } = await import("@/utils");

      const name = phoneNumber ? `Línea ${phoneNumber}` : `WhatsApp Line ${finalPhoneNumberId!.slice(-4)}`;

      const agent = await db.chatAgent.upsert({
        where: { whatsappPhoneNumberId: finalPhoneNumberId! },
        update: {
          whatsappAccessToken: accessToken,
          whatsappBusinessAccountId: finalWabaId!,
          whatsappPhoneNumber: phoneNumber ?? undefined,
          isActive: true,
          userId, // asegura pertenencia
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

      return NextResponse.json({ success: true, chatAgentId: agent.id, phoneNumber: phoneNumber ?? undefined });
    } catch (err: any) {
      console.error("Error guardando ChatAgent:", err);
      return NextResponse.json({ error: "No se pudo guardar la línea de WhatsApp." }, { status: 500 });
    }

  } catch (error) {
    console.error('Error interno en el endpoint exchange-token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}