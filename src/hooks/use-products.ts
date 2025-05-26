import { getAgentProducts, createAgentProducts } from "@/actions/producs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useAgentProducts(agentId: string | undefined) {
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["agent-products", agentId],
    queryFn: () => {
      if (!agentId) throw new Error("Missing agentId");
      return getAgentProducts(agentId);
    },
    enabled: !!agentId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { productsData, productsLoading, productsError };
}

export function useCreateAgentProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, products }: { agentId: string; products: any[] }) => {
      const response = await createAgentProducts(agentId, products);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`${data.length} producto(s) guardado(s) correctamente`);
      // Invalidar las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["agent-products", variables.agentId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", variables.agentId] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al guardar los productos");
    }
  });
} 