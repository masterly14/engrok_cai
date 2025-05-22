import { getMessagesByContact } from "@/actions/conversations";
import { useQuery } from "@tanstack/react-query";

export function useContactMessages(contactId: string | undefined) {
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ["messages", contactId],
    queryFn: () => {
      if (!contactId) throw new Error("Missing contactId");
      return getMessagesByContact(contactId);
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { messagesData, messagesLoading, messagesError };
} 