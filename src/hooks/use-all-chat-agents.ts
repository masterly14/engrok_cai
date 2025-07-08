import {
  createChatAgent,
  updateChatAgent,
  deleteChatAgent,
} from "@/actions/chat-agents";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatAgents } from "@/actions/chat-agents";

export const useAllChatAgents = () => {
  return useQuery({
    queryKey: ["chat-agents"],
    queryFn: async () => getChatAgents(),
  });
};

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
