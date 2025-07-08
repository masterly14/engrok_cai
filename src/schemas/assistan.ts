import { z } from "zod";

const AssistantformSchema = z.object({
  first_message: z.string().min(2, {
    message: "Por favor escribe el saludo inicial del agente..",
  }),

  system_prompt: z.string().min(40, {
    message: "Por favor escribe el prompt del agente.",
  }),

  file: z.instanceof(File, {
    message: "Por favor selecciona un archivo.",
  }),
});
