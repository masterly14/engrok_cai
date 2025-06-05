import { getAllSquads } from "@/actions/squads";
import { useQuery } from "@tanstack/react-query";

export function useAllSquads() {
  const {
    data: squadData,
    isLoading: squadLoading,
    error: squadError,
  } = useQuery({
    queryKey: ["squads"],
    queryFn: async () => {
      const response = await getAllSquads();
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { squadData, squadLoading, squadError };
} 