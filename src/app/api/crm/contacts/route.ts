import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils";

/**
 * POST /api/crm/contacts
 * 
 * Crea o actualiza un Lead (contacto) en el CRM propio de la aplicación.
 * El cuerpo debe ser un JSON con, al menos, el teléfono del contacto.
 *
 * Ejemplo de payload enviado desde el nodo CRM del Flow Builder:
 * ```json
 * {
 *   "name": "Juan Perez",
 *   "phone": "+573001112233",
 *   "email": "juan@example.com",
 *   "company": "Acme Inc.",
 *   "notes": "Cedula: 123456",
 *   "stage": "qualified",
 *   "tag": "584e05d3-c2d0-4631-ac62-a6392e4f661f"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener accessToken de query params
    const token = request.nextUrl.searchParams.get("accessToken");
    if (!token) {
      return NextResponse.json({ error: "Falta accessToken" }, { status: 401 });
    }

    // Buscar el accessToken para identificar al usuario
    const tokenRecord = await db.accessToken.findFirst({
      where: {
        accessToken: token,
        name: "crm-whatsapp-integration",
      },
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const userId = tokenRecord.userId;

    const body = await request.json();

    // Validación básica
    if (!body || !body.phone) {
      return NextResponse.json({ error: "El campo 'phone' es obligatorio" }, { status: 400 });
    }

    const {
      name = "Nuevo lead",
      phone,
      email = "",
      company = "",
      notes = "",
      stage = "new",
      tag,
    } = body;

    // Si ya existe un lead con ese teléfono, lo actualizamos; si no, lo creamos.
    const existingLead = await db.lead.findFirst({
      where: { phone },
    });

    const leadData = {
      name,
      phone,
      email,
      company,
      notes,
      stageId: stage,
      // El modelo Lead tiene un array de strings para tags.
      tags: tag ? [tag] : [],
      lastContact: new Date().toISOString(),
      userId,
    } as const;

    const lead = existingLead
      ? await db.lead.update({ where: { id: existingLead.id }, data: leadData })
      : await db.lead.create({ data: leadData });

    return NextResponse.json({ status: "success", lead });
  } catch (error: any) {
    console.error("[CRM] Error creando contacto:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 },
    );
  }
}
