import { getAgentConversations } from "@/actions/conversations";
import { useQuery } from "@tanstack/react-query";

export function useAgentConversations(agentId: string | undefined) {
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useQuery({
    queryKey: ["conversations", agentId],
    queryFn: () => {
      if (!agentId) throw new Error("Missing agentId");
      return getAgentConversations(agentId);
    },
    enabled: !!agentId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { conversationsData, conversationsLoading, conversationsError };
} 