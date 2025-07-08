"use server";

import { db } from "@/utils";

/**
 * Obtiene todas las definiciones de herramientas disponibles en la plataforma.
 * @returns Una lista de todas las herramientas de la base de datos.
 */
export async function getAllTools() {
  try {
    const tools = await db.tool.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return tools;
  } catch (error) {
    console.error("Error fetching tools:", error);
    // En una app real, podrías querer manejar este error de forma más explícita
    return [];
  }
}
