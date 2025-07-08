import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import React, { ReactNode } from "react";

type Props = {
  children: ReactNode;
  Querykey: string;
  Queryfn: () => void;
};

const DehydratePage = async ({ children, Querykey, Queryfn }: Props) => {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: [Querykey],
      queryFn: Queryfn,
    }),
  ]);

  const dehydratedState = dehydrate(queryClient);
  return (
    <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
  );
};

export default DehydratePage;
