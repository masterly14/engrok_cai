import { getWidgetAgents } from "@/actions/agents";
import { useQuery } from "@tanstack/react-query";

export function useWidgetAgents() {
    const {
      data: agentsData,
      isLoading: agentsLoading,
      error: agentsError,
    } = useQuery({
      queryKey: ["agents"],
      queryFn: async () => {
        const response = await getWidgetAgents();
        return response;
      },
      staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    });
  
    return { agentsData, agentsLoading, agentsError };
  }