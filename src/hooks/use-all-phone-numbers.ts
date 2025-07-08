import { getAllPhoneNumbers } from "@/actions/vapi/numbers";
import { useQuery } from "@tanstack/react-query";

export function useAllPhoneNumbers() {
  const {
    data: phoneData,
    isLoading: phoneLoading,
    error: phoneError,
  } = useQuery({
    queryKey: ["phone-numbers"],
    queryFn: async () => {
      const response = await getAllPhoneNumbers();
      return response;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { phoneData, phoneLoading, phoneError };
}
