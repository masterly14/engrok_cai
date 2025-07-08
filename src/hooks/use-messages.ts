import { getMessagesByContact } from "@/actions/conversations";
import { useInfiniteQuery } from "@tanstack/react-query";

const MESSAGES_PER_PAGE = 50;

type MessageResponse = Awaited<ReturnType<typeof getMessagesByContact>>;

export function useContactMessages(contactId: string | undefined) {
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["messages", contactId],
    queryFn: async ({ pageParam = 1 }: { pageParam: number }) => {
      if (!contactId) throw new Error("Missing contactId");
      return getMessagesByContact(contactId, {
        page: pageParam,
        limit: MESSAGES_PER_PAGE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: MessageResponse) => {
      if (!lastPage.data || lastPage.data.length < MESSAGES_PER_PAGE)
        return undefined;
      return lastPage.nextPage;
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Concatenamos todas las páginas en orden correcto
  // Las páginas más recientes van al final del array
  const allMessages =
    (messagesData as any)?.pages?.flatMap((page: any) =>
      page.status === 200 ? page.data : [],
    ) ?? [];

  return {
    messagesData: { data: allMessages },
    messagesLoading,
    messagesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
