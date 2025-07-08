"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { WorkflowIcon, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useWorkflows } from "@/hooks/use-workflows";
import { createChatWorkflow } from "@/actions/chat-agents";
import { DeleteWorkflowDialog } from "./delete-workflow-dialog";
import { CreateWorkflowDialog } from "./create-workflow-dialog";
import { WorkflowTableEmptyState } from "./workflow-table-empty-state";
import { WorkflowTableRow } from "./workflow-table-row";

// Chat Workflow type
export type ChatWorkflow = {
  id: string;
  name: string;
  tools?: any;
  workflowJson?: any;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
};

interface ChatWorkflowTableProps {
  workflows: ChatWorkflow[];
  onWorkflowsChange?: (workflows: ChatWorkflow[]) => void;
}

export function ChatWorkflowTable({
  workflows,
  onWorkflowsChange,
}: ChatWorkflowTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const { deleteWorkflow, duplicateWorkflow } = useWorkflows();

  const handleCreateWorkflowClick = () => {
    setTemplateModalOpen(true);
  };

  const createBlankWorkflow = async () => {
    setIsLoading(true);
    try {
      const response = await createChatWorkflow({
        name: "Nuevo Flujo sin título",
        workflowJson: { nodes: [], edges: [] },
      });
      if (response.status !== 200 || !response.workflow) {
        toast.error("No se pudo crear el flujo de trabajo.");
        throw new Error("Failed to create workflow");
      }
      router.push(
        `/application/agents/chat-agents/flows/${response.workflow.id}`,
      );
    } catch (e) {
      toast.error("Error creando el flujo");
    } finally {
      setIsLoading(false);
      setTemplateModalOpen(false);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    setOperationLoading(workflowId);
    try {
      await deleteWorkflow.mutateAsync(workflowId);
      toast.success("Flujo de trabajo eliminado correctamente.");
    } catch (error) {
      toast.error("No se pudo eliminar el flujo de trabajo.");
      console.error("Failed to delete chat workflow:", error);
    } finally {
      setOperationLoading(null);
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const handleDuplicateWorkflow = async (workflowId: string) => {
    setOperationLoading(workflowId);
    try {
      await duplicateWorkflow.mutateAsync(workflowId);
      toast.success("Flujo de trabajo duplicado correctamente.");
    } catch (error) {
      toast.error("No se pudo duplicar el flujo de trabajo.");
      console.error("Failed to duplicate workflow:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleRowClick = (workflowId: string) => {
    if (operationLoading === workflowId) return;
    router.push(`/application/agents/chat-agents/flows/${workflowId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation();
    setWorkflowToDelete(workflowId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (workflowToDelete) {
      handleDeleteWorkflow(workflowToDelete);
    }
  };

  const handleDuplicate = (e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation();
    handleDuplicateWorkflow(workflowId);
  };

  const handleCopyId = (e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(workflowId);
    toast.success("ID del flujo copiado al portapapeles.");
  };

  return (
    <div className="flex flex-col p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <WorkflowIcon className="h-5 w-5" /> Flujos de Chat (
              {workflows.length})
            </CardTitle>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {workflows.length !== 0 && (
                <Button
                  onClick={handleCreateWorkflowClick}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isLoading ? "Creando..." : "Crear Flujo"}
                </Button>
              )}
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <WorkflowTableEmptyState
              onCreateWorkflow={handleCreateWorkflowClick}
              isLoading={isLoading}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Nodos</TableHead>
                    <TableHead className="font-semibold">
                      Herramientas
                    </TableHead>
                    <TableHead className="font-semibold">Creado</TableHead>
                    <TableHead className="font-semibold">Actualizado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <WorkflowTableRow
                      key={workflow.id}
                      workflow={workflow}
                      operationLoading={operationLoading}
                      onRowClick={handleRowClick}
                      onDeleteClick={handleDeleteClick}
                      onDuplicate={handleDuplicate}
                      onCopyId={handleCopyId}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteWorkflowDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={!!operationLoading}
      />

      <CreateWorkflowDialog
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    </div>
  );
}
