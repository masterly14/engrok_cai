import { getAllChatAgents, createChatAgent, updateChatAgent, deleteChatAgent } from "@/actions/chat-agents";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useAllChatAgents() {
  const {
    data: chatAgentsData,
    isLoading: chatAgentsLoading,
    error: chatAgentsError,
    isFetching: chatAgentsFetching,
  } = useQuery({
    queryKey: ["chat-agents"],
    queryFn: async () => {
      const response = await getAllChatAgents();
      return response;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { chatAgentsData, chatAgentsLoading, chatAgentsError, chatAgentsFetching };
}

export function useCreateChatAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const response = await createChatAgent(values);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-agents"] });
    },
  });
}

export function useUpdateChatAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const response = await updateChatAgent(id, values);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-agents"] });
    },
  });
}

export function useDeleteChatAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteChatAgent(id);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-agents"] });
    },
  });
}
