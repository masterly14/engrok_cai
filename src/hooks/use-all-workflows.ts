import { useQuery } from "@tanstack/react-query";
import { getAllWorkflows } from "@/actions/workflow";

export const useAllWorkflows = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["all-workflows"],
    queryFn: async () => {
      try {
        const workflows = await getAllWorkflows();
        return workflows;
      } catch (error) {
        console.error("Error fetching workflows:", error);
        throw error;
      }
    },
  });

  return { workflowsData: data, workflowsLoading: isLoading, workflowsError: error };
}; 