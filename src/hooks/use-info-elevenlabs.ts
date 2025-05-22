import { getAllCalls } from "@/actions/elevenlabs";
import { useQuery } from "@tanstack/react-query";


export function useInfoElevenlabs(userId: string) {
  const {
    data: statisticalData,
    isLoading: statisticalLoading,
    error: statisticalError,
  } = useQuery({
    queryKey: ["statisticalKey"],
    queryFn: async () => {
      const response = await getAllCalls(userId);
      return response;
    },
    refetchInterval: 600000,
    staleTime: 600000,
  });
  return { statisticalData, statisticalError, statisticalLoading };
}
