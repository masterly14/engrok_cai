"use client"

import { WorkflowTable } from "./_components/table-workflow";
import { useWorkflows } from "@/hooks/use-workflows";

const Page = () => {
  const { workflows } = useWorkflows();
  const workflowsData = Array.isArray(workflows) ? workflows : [];

  return (
    <WorkflowTable 
      workflows={workflowsData} 
      onWorkflowsChange={(updatedWorkflows) => {
        console.log("Workflows updated:", updatedWorkflows);
      }}
    />
  );
};

export default Page;
