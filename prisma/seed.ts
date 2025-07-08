import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lista de herramientas a crear/actualizar
const tools = [
  {
    name: "createLead",
    description:
      "Crea un nuevo lead en el CRM cuando se obtiene información de contacto del usuario.",
    provider: "hubspot", // Asumiendo que createLead es para HubSpot
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nombre completo del lead.",
        },
        email: {
          type: "string",
          description: "Correo electrónico del lead.",
        },
        phone: {
          type: "string",
          description: "Número de teléfono del lead.",
        },
      },
      required: ["name", "email"],
    },
  },
  {
    name: "getAvailability",
    description:
      "Consulta la disponibilidad en el calendario para agendar una cita o demostración.",
    provider: "google-calendar",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description:
            "La fecha para la cual se quiere consultar la disponibilidad, en formato YYYY-MM-DD.",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "createEvent",
    description:
      "Agenda un nuevo evento, cita o demostración en el calendario.",
    provider: "google-calendar",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "El título o nombre del evento.",
        },
        startTime: {
          type: "string",
          description:
            "Fecha y hora de inicio del evento en formato ISO 8601 (ej: 2024-07-08T10:00:00-05:00).",
        },
        endTime: {
          type: "string",
          description:
            "Fecha y hora de fin del evento en formato ISO 8601 (ej: 2024-07-08T11:00:00-05:00).",
        },
        attendeeEmail: {
          type: "string",
          description: "El correo electrónico del invitado al evento.",
        },
      },
      required: ["title", "startTime", "endTime", "attendeeEmail"],
    },
  },
];

async function main() {
  console.log(`Start seeding ...`);
  for (const tool of tools) {
    const existingTool = await prisma.tool.findUnique({
      where: { name: tool.name },
    });

    if (existingTool) {
      // Si existe, la actualizamos con el nuevo provider y descripción
      const updatedTool = await prisma.tool.update({
        where: { name: tool.name },
        data: {
          description: tool.description,
          provider: tool.provider,
          parameters: tool.parameters as any, // Cast to any to avoid type issues with JSON
        },
      });
      console.log(`Updated tool: ${updatedTool.name}`);
    } else {
      // Si no existe, la creamos
      const newTool = await prisma.tool.create({
        data: {
          ...tool,
          parameters: tool.parameters as any, // Cast to any to avoid type issues with JSON
        },
      });
      console.log(`Created new tool: ${newTool.name}`);
    }
  }
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
