"use client";

import { getUserAssets } from "@/actions/chat-agents";
import { useQuery } from "@tanstack/react-query";

export function useAssets(enabled: boolean = true, type?: string) {
  const {
    data,
    isLoading: assetsLoading,
    error: assetsError,
    isFetching: assetsFetching,
    refetch: refetchAssets,
  } = useQuery({
    queryKey: ["assets", type ?? "all"],
    queryFn: async () => {
      const response = await getUserAssets(type);
      return response;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    assetsData: data?.data || [],
    assetsLoading,
    assetsFetching,
    assetsError,
    refetchAssets,
  };
}
