import { deleteAgents } from "@/actions/agents";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      vapiId,
    }: {
      agentId: string;
      vapiId: string;
    }) => {
      return await deleteAgents(agentId, vapiId);
    },
    onSuccess: () => {
      // Invalidate and refetch agents query
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agente eliminado correctamente");
    },
    onError: (error) => {
      console.error("Error deleting agent:", error);
      toast.error("Error al eliminar el agente");
    },
  });
}
