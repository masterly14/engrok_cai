import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createAssistantAction, updateAssistantAction } from "@/actions/vapi/assistant";
import { Agent } from "@prisma/client";
import { publishAgent as publishAgentAction } from "@/actions/agents";

// Tipo para crear un agente. No necesita vapiId ni toolIds.
export interface CreateAgentInput {
  name: string;
  firstMessage: string;
  prompt: string;
  backgroundSound?: string;
  voiceId?: string;
  knowledgeBaseId?: string | null;
}

// Tipo para publicar/actualizar. Requiere vapiId y la lista de toolIds.
export interface PublishAgentInput extends CreateAgentInput {
  vapiId: string;
  toolIds: string[];
}

/**
 * Hook para CREAR un nuevo agente.
 * Se comunica con la acción que crea el asistente en Vapi
 * y luego (implícitamente) en nuestra BD.
 */
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentData: CreateAgentInput) => {
      const formData = new FormData();
      formData.append("name", agentData.name);
      formData.append("firstMessage", agentData.firstMessage);
      formData.append("prompt", agentData.prompt);
      formData.append("backgroundSound", agentData.backgroundSound || "");
      formData.append("voiceId", agentData.voiceId || "");
      if (agentData.knowledgeBaseId) {
        formData.append("knowledgeBaseId", agentData.knowledgeBaseId);
      }
      
      const newAssistant = await createAssistantAction(formData);
      
      return newAssistant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agente creado con éxito");
    },
    onError: (error) => {
      toast.error(`Error al crear el agente: ${error.message}`);
    },
  });
}

/**
 * Hook para PUBLICAR (actualizar) un agente existente.
 * Llama a nuestra propia server action `publishAgentAction` que se encarga de todo.
 */
export function usePublishAgent() {
  const queryClient = useQueryClient();
  return useMutation<Agent, Error, PublishAgentInput>({
    mutationFn: (agentData) => publishAgentAction(agentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (error) => {
      toast.error(`Error al publicar el agente: ${error.message}`);
    },
  });
}