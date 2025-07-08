"use server";

import { db } from "@/utils";
import { onBoardUser } from "./user";
import { Lead } from "@/lib/data";

export const getAllLeads = async () => {
  const user = await onBoardUser();

  const leads = await db.lead.findMany({
    where: {
      userId: user?.data.id,
    },
  });

  const stages = await db.stage.findMany({
    where: {
      userId: user?.data.id,
    },
  });

  const tags = await db.tag.findMany({
    where: {
      userId: user?.data.id,
    },
  });

  console.log("Data del server", { leads, stages, tags });

  return {
    leads,
    stages,
    tags,
  };
};

function sanitizeString(str: string | null | undefined): string {
  if (str === null || str === undefined) {
    return "";
  }
  // Eliminar caracteres nulos (0x00) y otros caracteres no válidos para UTF-8
  return str.replace(/\u0000/g, "");
}

// Función para sanitizar un objeto Lead completo
function sanitizeLead(lead: Lead): Lead {
  return {
    ...lead,
    id: sanitizeString(lead.id),
    name: sanitizeString(lead.name),
    company: sanitizeString(lead.company),
    email: sanitizeString(lead.email),
    phone: sanitizeString(lead.phone),
    status: sanitizeString(lead.status),
    notes: sanitizeString(lead.notes),
    // No sanitizamos lastContact porque es una fecha
    // No sanitizamos value porque es un número
    // No sanitizamos tags porque es un array
  };
}

export const CreateUpdateLead = async (newLead: Lead, leadId?: string) => {
  const user = await onBoardUser();
  if (!user?.data.id) {
    throw new Error("Not user");
  }

  // Sanitizar el objeto lead completo
  const sanitizedLead = sanitizeLead(newLead);

  // Imprimir para depuración
  console.log("Sanitized lead:", JSON.stringify(sanitizedLead, null, 2));

  if (leadId) {
    // UPDATE
    return await db.lead.update({
      where: { id: leadId },
      data: {
        ...sanitizedLead,
        userId: user.data.id,
        stageId: sanitizedLead.status || undefined,
      },
    });
  } else {
    console.log("Creating new lead:", JSON.stringify(sanitizedLead, null, 2));
    try {
      return await db.lead.create({
        data: {
          ...sanitizedLead,
          userId: user.data.id,
          stageId: sanitizedLead.status || "new",
        },
      });
    } catch (error) {
      console.error("Error creating lead with detailed info:", error);
      // Intentar identificar qué campo está causando el problema
      console.error(
        "Lead data that caused the error:",
        Object.entries(sanitizedLead).map(([key, value]) => {
          return `${key}: ${typeof value} - ${JSON.stringify(value)}`;
        }),
      );
      throw error;
    }
  }
};

export const deleteLead = async (id: string) => {
  const user = await onBoardUser();
  if (!user?.data.id) {
    throw new Error("Not user");
  }

  return await db.lead.delete({
    where: {
      id: id,
    },
  });
};

export const deleteTag = async (id: string) => {
  const user = await onBoardUser();
  if (!user?.data.id) {
    throw new Error("Not user");
  }

  return await db.tag.delete({
    where: {
      id: id,
    },
  });
};

export const createTag = async (data: any) => {
  const user = await onBoardUser();
  if (!user?.data.id) {
    throw new Error("Not user");
  }

  return await db.tag.create({
    data: {
      ...data,
      userId: user.data.id,
    },
  });
};

export const createStage = async (data: any) => {
  const user = await onBoardUser();
  if (!user?.data.id) {
    throw new Error("Not user");
  }

  return await db.stage.create({
    data: {
      ...data,
      userId: user.data.id,
    },
  });
};
export const deleteStage = async (id: string) => {
  const user = await onBoardUser();
  if (!user?.data.id) {
    throw new Error("Not user");
  }

  return await db.stage.delete({
    where: {
      id_userId: {
        id,
        userId: user.data.id,
      },
    },
  });
};
