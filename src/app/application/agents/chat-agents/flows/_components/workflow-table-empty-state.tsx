"use client";
import { Button } from "@/components/ui/button";
import { WorkflowIcon, Plus } from "lucide-react";

interface WorkflowTableEmptyStateProps {
  onCreateWorkflow: () => void;
  isLoading: boolean;
}

export function WorkflowTableEmptyState({
  onCreateWorkflow,
  isLoading,
}: WorkflowTableEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <WorkflowIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No tienes flujos de chat creados
      </h3>
      <p className="text-gray-500 mb-4">
        Comienza creando tu primer flujo de chat
      </p>
      <Button
        onClick={onCreateWorkflow}
        disabled={isLoading}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        {isLoading ? "Creando..." : "Crear tu primer flujo"}
      </Button>
    </div>
  );
}
