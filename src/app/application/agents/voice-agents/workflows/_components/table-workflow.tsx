"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  Calendar,
  WorkflowIcon,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useWorkflows } from "@/hooks/use-workflows";
import { createWorkflow } from "@/actions/workflow";

// Workflow type based on your Prisma schema
type Workflow = {
  id: string;
  name: string;
  vapiId?: string | null;
  tools?: any;
  workflowJson?: any;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

interface WorkflowTableProps {
  workflows: Workflow[];
  onWorkflowsChange?: (workflows: Workflow[]) => void;
}

export function WorkflowTable({
  workflows,
  onWorkflowsChange,
}: WorkflowTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const { deleteWorkflow, duplicateWorkflow } = useWorkflows();

  const handleCreateWorkflow = async () => {
    setIsLoading(true);
    try {
      // Creamos un nuevo flujo con datos mínimos por defecto
      const response = await createWorkflow({
        name: "Nuevo flujo",
        workflowJson: { nodes: [], edges: [] },
        tools: null,
      });

      if (response.status !== 200 || !response.workflow) {
        throw new Error("Error creando el flujo");
      }

      const newWorkflowId = response.workflow.id;

      toast.success("Redireccionando al creador de flujos...");

      // Redirigimos al constructor del flujo recién creado
      router.push(
        `/application/agents/voice-agents/workflows/${newWorkflowId}`,
      );
    } catch (error) {
      console.error("Failed to create workflow:", error);
      toast.error("Error al crear el flujo. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    setOperationLoading(workflowId);
    try {
      await deleteWorkflow.mutateAsync(workflowId);
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    } catch (error) {
      console.error("Failed to delete workflow:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDuplicateWorkflow = async (workflowId: string) => {
    setOperationLoading(workflowId);
    try {
      await duplicateWorkflow.mutateAsync(workflowId);
    } catch (error) {
      console.error("Failed to duplicate workflow:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleRowClick = (workflowId: string) => {
    if (operationLoading === workflowId) return; // Prevent navigation during operations
    router.push(`/application/agents/voice-agents/workflows/${workflowId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation();
    setWorkflowToDelete(workflowId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (workflowToDelete) {
      handleDeleteWorkflow(workflowToDelete);
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getNodeCount = (workflowJson: any) => {
    if (!workflowJson || !workflowJson.nodes) return 0;
    return workflowJson.nodes.length;
  };

  const getToolsCount = (tools: any) => {
    if (!tools) return 0;
    if (Array.isArray(tools)) return tools.length;
    if (typeof tools === "object") return Object.keys(tools).length;
    return 0;
  };

  return (
    <div className="flex flex-col p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <WorkflowIcon className="h-5 w-5" />
              Workflows ({workflows.length})
            </CardTitle>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {workflows.length !== 0 && (
                <Button
                  onClick={handleCreateWorkflow}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isLoading ? "Creating..." : "Create Workflow"}
                </Button>
              )}
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <WorkflowIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes flujos creados
              </h3>
              <p className="text-gray-500 mb-4">
                Comienza creando tu primer flujo
              </p>
              <Button
                onClick={handleCreateWorkflow}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isLoading ? "Creando..." : "Crear tu primer flujo"}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Nodes</TableHead>
                    <TableHead className="font-semibold">Tools</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold">Updated</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <motion.tr
                      key={workflow.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        operationLoading === workflow.id
                          ? "opacity-50 pointer-events-none"
                          : ""
                      }`}
                      onClick={() => handleRowClick(workflow.id)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {workflow.name}
                          </span>
                          <span className="text-sm text-gray-500 font-mono">
                            {workflow.id.slice(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={workflow.vapiId ? "default" : "secondary"}
                          className="font-medium"
                        >
                          {workflow.vapiId ? "Connected" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <WorkflowIcon className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {getNodeCount(workflow.workflowJson)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {getToolsCount(workflow.tools)}
                          </span>
                          {getToolsCount(workflow.tools) > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {getToolsCount(workflow.tools)} tools
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatDate(workflow.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatDate(workflow.updatedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                              disabled={operationLoading === workflow.id}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(workflow.id);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Workflow
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleCopyId(e, workflow.id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDuplicate(e, workflow.id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              {operationLoading === workflow.id
                                ? "Duplicating..."
                                : "Duplicate"}
                            </DropdownMenuItem>
                            {workflow.vapiId && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    `https://dashboard.vapi.ai/assistants/${workflow.vapiId}`,
                                    "_blank",
                                  );
                                }}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View in Vapi
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteClick(e, workflow.id)}
                              className="text-red-600 focus:text-red-600"
                              disabled={operationLoading === workflow.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {operationLoading === workflow.id
                                ? "Deleting..."
                                : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot
              be undone and will permanently remove the workflow and all its
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Workflow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
