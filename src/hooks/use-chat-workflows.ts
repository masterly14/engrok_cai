import { getAllChatWorkflows } from "@/actions/chat-agents";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useChatWorkflows() {
  const queryClient = useQueryClient();

  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    error: workflowsError,
  } = useQuery({
    queryKey: ["chatWorkflows"],
    queryFn: async () => {
      const response = await getAllChatWorkflows();
      return response;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Placeholder delete and duplicate until proper API implemented
  const deleteWorkflow = useMutation({
    mutationFn: async (workflowId: string) => {
      await new Promise((res) => setTimeout(res, 1000));
      return workflowId;
    },
    onSuccess: (workflowId) => {
      queryClient.setQueryData(["chatWorkflows"], (old: any) =>
        old.filter((w: any) => w.id !== workflowId)
      );
      toast.success("Flujo eliminado correctamente");
    },
    onError: () => toast.error("Error al eliminar el flujo"),
  });

  const duplicateWorkflow = useMutation({
    mutationFn: async (workflowId: string) => {
      await new Promise((res) => setTimeout(res, 1000));
      return workflowId;
    },
    onSuccess: (workflowId) => {
      queryClient.setQueryData(["chatWorkflows"], (old: any) => {
        const wf = old.find((w: any) => w.id === workflowId);
        if (!wf) return old;
        const dup = {
          ...wf,
          id: `${workflowId}-copy-${Date.now()}`,
          name: `${wf.name} (Copy)`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return [dup, ...old];
      });
      toast.success("Flujo duplicado correctamente");
    },
    onError: () => toast.error("Error al duplicar el flujo"),
  });

  return {
    workflows: workflowsData || [],
    workflowsLoading,
    workflowsError,
    deleteWorkflow,
    duplicateWorkflow,
  };
} 