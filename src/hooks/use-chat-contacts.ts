import { useQuery } from "@tanstack/react-query";
import { getChatContacts } from "@/actions/chat-contacts";

export const useChatContacts = () => {
  const {
    data: contacts,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["chatContacts"],
    queryFn: getChatContacts,
  });

  return { contacts, isLoading, isError, error, refetch };
}; 