// hooks/use-all-leads.ts
import { getAllLeads } from "@/actions/crm";
import { useQuery } from "@tanstack/react-query";

export function useAllLeads() {
  const {
    data,
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const response = await getAllLeads();
      return response;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });
  
  return { 
    leadsData: data?.leads || [], 
    stagesData: data?.stages || [], 
    tagsData: data?.tags || [],
    leadsLoading: isLoading,
    leadsFetching: isFetching, 
    leadsError: error 
  };
}