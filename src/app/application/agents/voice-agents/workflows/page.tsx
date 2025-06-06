"use client"

import { WorkflowTable } from "./_components/table-workflow";
import { useWorkflows } from "@/hooks/use-workflows";

const Page = () => {
  const { workflows, workflowsLoading, workflowsError, deleteWorkflow, duplicateWorkflow } = useWorkflows();
  const workflowsData = "error" in workflows ? [] : workflows;
  
  return (
    <WorkflowTable 
      workflows={workflowsData} 
      onWorkflowsChange={(updatedWorkflows) => {
        // Esta función se puede usar para manejar cambios en los workflows si es necesario
        console.log("Workflows updated:", updatedWorkflows);
      }}
    />
  );
};

export default Page;
