"use client";

import { LoadingSpinner } from "@/components/loading-spinner";
import { ChatWorkflowTable } from "./_components/table-workflows";
import { useChatWorkflows as useChatWorkflowsHook } from "@/hooks/use-chat-workflows";

const Page = () => {
  const { workflows, workflowsLoading, workflowsError } =
    useChatWorkflowsHook();

  if (workflowsLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (workflowsError) {
    return <div className="p-4 text-red-600">Error al cargar los flujos</div>;
  }

  if (!workflows || !Array.isArray(workflows)) {
    return (
      <div className="p-4 text-red-600">Error: Invalid workflows data</div>
    );
  }

  return <ChatWorkflowTable workflows={workflows} />;
};

export default Page;
