import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createAssistantAction, updateAssistantAction } from "@/actions/vapi/assistant";

type CreateAgentInput = {
  name: string;
  firstMessage: string;
  prompt: string;
  backgroundSound?: string;
  voiceId?: string;
  knowledgeBaseId?: string | null;
  vapiId?: string;
};

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAgentInput) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("firstMessage", data.firstMessage);
      formData.append("prompt", data.prompt);
      formData.append("backgroundSound", data.backgroundSound || "");
      formData.append("voiceId", data.voiceId || "");
      if (data.knowledgeBaseId) {
        formData.append("knowledgeBaseId", data.knowledgeBaseId);
      }

      const response = await createAssistantAction(formData);
      if (response.status !== 201 && response.status !== 200) {
        throw new Error(response.message || "Error al crear el agente");
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Agente creado correctamente");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear el agente");
    },
  });
} 

export function usePublishAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAgentInput) => {
      if (!data.vapiId) {
        throw new Error("vapiId es requerido para actualizar el agente");
      }
      
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("firstMessage", data.firstMessage);
      formData.append("prompt", data.prompt);
      formData.append("backgroundSound", data.backgroundSound || "");
      formData.append("voiceId", data.voiceId || "");
      if (data.knowledgeBaseId) {
        formData.append("knowledgeBaseId", data.knowledgeBaseId);
      }
      const response = await updateAssistantAction(formData, data.vapiId);
      if (response.status !== 201 && response.status !== 200) {
        throw new Error(response.message || "Error al actualizar el agente");
      }
      return response;
    },
    onSuccess: () => {
      toast.success("Agente actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar el agente");
    },
  });
}