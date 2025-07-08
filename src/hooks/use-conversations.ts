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
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (data) => ({
      ...data,
      data: data.data?.map((conv) => ({
        id: conv.id,
        contact: conv.contact,
        phoneNumber: conv.phoneNumber,
        lastMessage: conv.lastMessage,
        unread: conv.unread,
        timestamp: conv.timestamp,
      })),
    }),
  });

  return { conversationsData, conversationsLoading, conversationsError };
}
