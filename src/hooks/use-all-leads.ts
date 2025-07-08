// hooks/use-all-leads.ts
import { getAllLeads } from "@/actions/crm";
import { useQuery } from "@tanstack/react-query";

export function useAllLeads(enabled: boolean = false) {
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const response = await getAllLeads();
      return response;
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60, // 1 hora
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    leadsData: data?.leads || [],
    stagesData: data?.stages || [],
    tagsData: data?.tags || [],
    leadsLoading: isLoading,
    leadsFetching: isFetching,
    leadsError: error,
  };
}
