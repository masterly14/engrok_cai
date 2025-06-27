import { NextResponse } from "next/server";

// Base de datos falsa para simular usuarios
const mockUsers: Record<string, any> = {
  "123": {
    id: "123",
    name: "Juan Pérez",
    email: "juan.perez@example.com",
    lastOrderId: "ORD-98765",
    metadata: {
      address: "Calle Falsa 123",
    },
    status: "active",
    level: "gold",
  },
  "456": {
    id: "456",
    name: "Ana Gómez",
    email: "ana.gomez@example.com",
    lastOrderId: "ORD-12345",
    status: "active",
    level: "silver",
  },
  "789": {
    id: "789",
    name: "Carlos Sánchez",
    email: "carlos.sanchez@example.com",
    lastOrderId: null,
    metadata: {
      address: "Calle Falsa 123",
    },
    status: "inactive",
    level: "bronze",
  },
};

/**
 * Endpoint de prueba para el nodo ApiRequest.
 * Simula una API que devuelve datos de un usuario.
 *
 * USO:
 * - Envía un POST request a /api/test-whatsapp
 * - Body: { "userId": "123" }
 * - Para simular un error, usa userId: "error"
 * - Para simular un no encontrado, usa userId: "not-found"
 */
export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "El campo 'userId' es requerido en el body." },
        { status: 400 }
      );
    }

    // Simular un caso de error del servidor
    if (userId === "error") {
      return NextResponse.json(
        {
          success: false,
          message: "Error simulado: No se pudo procesar la solicitud.",
          errorCode: "E-5001",
        },
        { status: 500 }
      );
    }

    // Simular un caso de usuario no encontrado
    if (userId === "not-found") {
      return NextResponse.json(
        {
          success: false,
          message: `Usuario con ID '${userId}' no encontrado.`,
          errorCode: "E-4004",
        },
        { status: 404 }
      );
    }

    const user = mockUsers[userId];

    if (!user) {
      return NextResponse.json(
        { message: `Usuario con ID '${userId}' no encontrado.` },
        { status: 404 }
      );
    }

    // Devolver los datos del usuario si se encuentra
    return NextResponse.json(
      {
        success: true,
        data: user,
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
