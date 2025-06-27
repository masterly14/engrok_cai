import { getMessageTemplates } from "@/actions/whatsapp/templates";
import { useQuery } from "@tanstack/react-query";

export function useMessageTemplates(agentId: string | undefined) {
  const {
    data: templatesData,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ["messageTemplates", agentId],
    queryFn: async () => {
      if (!agentId) throw new Error("Missing agentId");
      return getMessageTemplates(agentId);
    },
    enabled: !!agentId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30,   // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { templatesData, templatesLoading, templatesError, refetchTemplates };
} 