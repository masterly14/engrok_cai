import { getUserFiles } from "@/actions/vapi/files";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { saveFileInDatabase } from "@/actions/vapi/files";

export function useFiles(enabled: boolean = true) {
  const {
    data,
    isLoading: filesLoading,
    error: filesError,
    isFetching: filesFetching,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const response = await getUserFiles();
      return response;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    filesData: data?.data || [],
    filesLoading,
    filesFetching,
    filesError,
    refetchFiles,
  };
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileData: {
      id: string;
      name: string;
      bucket: string;
      url: string;
      mimeType: string;
    }) => {
      const response = await saveFileInDatabase(fileData);
      if (response.status === 500) {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch files query
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
