import { getAllWorkflows } from "@/actions/workflow";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useWorkflows() {
  const queryClient = useQueryClient();

  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    error: workflowsError,
  } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const response = await getAllWorkflows();
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (workflowId: string) => {
      // Aquí iría la llamada a la API para eliminar el workflow
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return workflowId;
    },
    onSuccess: (workflowId) => {
      queryClient.setQueryData(["workflows"], (old: any) => {
        return old.filter((w: any) => w.id !== workflowId);
      });
      toast.success("Flujo eliminado correctamente");
    },
    onError: () => {
      toast.error("Error al eliminar el flujo");
    },
  });

  const duplicateWorkflow = useMutation({
    mutationFn: async (workflowId: string) => {
      // Aquí iría la llamada a la API para duplicar el workflow
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return workflowId;
    },
    onSuccess: (workflowId) => {
      queryClient.setQueryData(["workflows"], (old: any) => {
        const workflowToDuplicate = old.find((w: any) => w.id === workflowId);
        if (!workflowToDuplicate) return old;

        const duplicatedWorkflow = {
          ...workflowToDuplicate,
          id: `${workflowId}-copy-${Date.now()}`,
          name: `${workflowToDuplicate.name} (Copy)`,
          vapiId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return [duplicatedWorkflow, ...old];
      });
      toast.success("Flujo duplicado correctamente");
    },
    onError: () => {
      toast.error("Error al duplicar el flujo");
    },
  });

  return {
    workflows: workflowsData || [],
    workflowsLoading,
    workflowsError,
    deleteWorkflow,
    duplicateWorkflow,
  };
}
