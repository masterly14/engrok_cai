import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createAgentMessageTemplate, getAgentMessageTemplates, getMessageTemplateById } from "@/actions/message-template";

export function useAgentMessageTemplates(agentId: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["agent-message-templates", agentId],
    queryFn: () => {
      if (!agentId) throw new Error("Missing agentId");
      return getAgentMessageTemplates(agentId);
    },
    enabled: !!agentId,
  });

  return { templates: data, templatesLoading: isLoading, templatesError: error };
}

export function useCreateAgentMessageTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await createAgentMessageTemplate(data);
      return response.data;
    },
    onSuccess: (data, vars) => {
      toast.success("Plantilla creada correctamente");
      queryClient.invalidateQueries({
        queryKey: ["agent-message-templates", vars.agentId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error creando la plantilla");
    },
  });
}

export function useMessageTemplateById(templateId: string | undefined) {
  return useQuery({
    queryKey: ["message-template", templateId],
    queryFn: () => {
      if (!templateId) throw new Error("Missing templateId")
      return getMessageTemplateById(templateId)
    },
    enabled: !!templateId,
  })
} 