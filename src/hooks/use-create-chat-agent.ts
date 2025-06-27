import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createChatAgent, updateChatAgent, deleteChatAgent } from "@/actions/chat-agents"
import { type ChatAgentFormData } from "@/context/chat-agent-context"

export const useCreateChatAgent = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: ChatAgentFormData) => createChatAgent(data),
        onSuccess: () => {
            toast.success("Agente de chat creado correctamente")
            queryClient.invalidateQueries({ queryKey: ["chat-agents"] })
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })
}

export const useUpdateChatAgent = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ agentId, data }: { agentId: string; data: ChatAgentFormData }) =>
            updateChatAgent(agentId, data),
        onSuccess: () => {
            toast.success("Agente de chat actualizado correctamente")
            queryClient.invalidateQueries({ queryKey: ["chat-agents"] })
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })
}

export const useDeleteChatAgent = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (agentId: string) => deleteChatAgent(agentId),
        onSuccess: () => {
            toast.success("Agente de chat eliminado correctamente")
            queryClient.invalidateQueries({ queryKey: ["chat-agents"] })
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })
} 