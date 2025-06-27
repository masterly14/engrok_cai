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
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Temporal: reuse generic hook while chat actions are added
import { useWorkflows } from "@/hooks/use-workflows";
import { createChatWorkflow } from "@/actions/chat-agents";

// Chat Workflow type
type ChatWorkflow = {
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

// ---- Plantillas predefinidas ----
type TemplateDef = {
  id: string;
  name: string;
  description: string;
  getJson: () => any;
};

const TEMPLATES: TemplateDef[] = [
  {
    id: "destinos",
    name: "Guía de Destinos Turísticos",
    description: "Menú con ciudades y sub-menús de lugares destacados.",
    getJson: () => ({
      nodes: [
        {
          id: "c_inicio",
          data: {
            name: "Destinos",
            botResponse:
              "¡Hola! ¿Sobre qué ciudad quieres información turística?",
            responseType: "text",
            userResponse: "DESTINOS",
            interactiveButtons: [
              { id: "PARIS", type: "reply", title: "París" },
              { id: "TOKYO", type: "reply", title: "Tokio" },
              { id: "NEWYORK", type: "reply", title: "Nueva York" },
            ],
          },
          type: "conversation",
          width: 320,
          height: 380,
          dragging: false,
          position: { x: -1280, y: -20 },
          selected: false,
          positionAbsolute: { x: -1280, y: -20 },
        },
        {
          id: "c_paris",
          data: {
            name: "Menú París",
            botResponse: "París 🇫🇷\nElige lo que quieres ver:",
            interactiveButtons: [
              { id: "PAR_MUSEO", type: "reply", title: "Museos" },
              { id: "PAR_GASTRO", type: "reply", title: "Gastronomía" },
            ],
          },
          type: "conversation",
          width: 320,
          height: 332,
          dragging: false,
          position: { x: -340, y: -560 },
          selected: false,
          positionAbsolute: { x: -340, y: -560 },
        },
        {
          id: "c_par_museo",
          data: {
            name: "Museos París",
            botResponse:
              "• Museo del Louvre 🖼️\n• Musée d'Orsay 🎨\n• Centro Pompidou 🏛️",
            fileOrImageUrl: "https://example.com/louvre.jpg",
            fileResourceType: "image",
          },
          type: "conversation",
          width: 320,
          height: 290,
          dragging: false,
          position: { x: 940, y: -640 },
          selected: false,
          positionAbsolute: { x: 940, y: -640 },
        },
        {
          id: "c_par_gastro",
          data: {
            name: "Gastronomía París",
            botResponse: "• Croissant 🥐\n• Macarons 🍬\n• Quesos franceses 🧀",
          },
          type: "conversation",
          width: 320,
          height: 258,
          dragging: false,
          position: { x: 940, y: -260 },
          selected: false,
          positionAbsolute: { x: 940, y: -260 },
        },
        {
          id: "c_tokyo",
          data: {
            name: "Menú Tokio",
            botResponse: "Tokio 🇯🇵\nSelecciona:",
            interactiveButtons: [
              { id: "TOK_TEMPL", type: "reply", title: "Templos" },
              { id: "TOK_FOOD", type: "reply", title: "Comida" },
            ],
          },
          type: "conversation",
          width: 320,
          height: 332,
          dragging: false,
          position: { x: -460, y: 100 },
          selected: false,
          positionAbsolute: { x: -460, y: 100 },
        },
        {
          id: "c_tok_templ",
          data: {
            name: "Templos Tokio",
            botResponse: "• Sensō-ji ⛩️\n• Meiji-jinja 🏯\n• Zojo-ji 🏮",
          },
          type: "conversation",
          width: 320,
          height: 258,
          dragging: false,
          position: { x: 160, y: -60 },
          selected: false,
          positionAbsolute: { x: 160, y: -60 },
        },
        {
          id: "c_tok_food",
          data: {
            name: "Comida Tokio",
            botResponse: "• Sushi 🍣\n• Ramen 🍜\n• Takoyaki 🐙",
          },
          type: "conversation",
          width: 320,
          height: 258,
          dragging: false,
          position: { x: 160, y: 320 },
          selected: false,
          positionAbsolute: { x: 160, y: 320 },
        },
        {
          id: "c_ny",
          data: {
            name: "Menú NY",
            botResponse: "Nueva York 🇺🇸\nElige:",
            interactiveButtons: [
              { id: "NY_ATR", type: "reply", title: "Atracciones" },
              { id: "NY_FOOD", type: "reply", title: "Comida" },
            ],
          },
          type: "conversation",
          width: 320,
          height: 332,
          dragging: false,
          position: { x: -360, y: 820 },
          selected: false,
          positionAbsolute: { x: -360, y: 820 },
        },
        {
          id: "c_ny_atr",
          data: {
            name: "Atracciones NY",
            botResponse:
              "• Estatua de la Libertad 🗽\n• Central Park 🌳\n• Times Square 🌆",
          },
          type: "conversation",
          width: 320,
          height: 258,
          dragging: false,
          position: { x: 940, y: 520 },
          selected: false,
          positionAbsolute: { x: 940, y: 520 },
        },
        {
          id: "c_ny_food",
          data: {
            name: "Comida NY",
            botResponse: "• Bagels 🥯\n• Pizza NY 🍕\n• Cheesecake 🍰",
          },
          type: "conversation",
          width: 320,
          height: 258,
          dragging: false,
          position: { x: 940, y: 1120 },
          selected: true,
          positionAbsolute: { x: 940, y: 1120 },
        },
        {
          id: "a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          data: {
            name: "End Conversation",
            type: "turnOffAgent",
            label: "turnOffAgent",
            message: "Conversation ended.",
            botResponse: "",
            userResponse: "",
          },
          type: "turnOffAgent",
          width: 256,
          height: 78,
          dragging: false,
          position: { x: 1800, y: 280 },
          selected: false,
          positionAbsolute: { x: 1800, y: 280 },
        },
      ],
      edges: [
        {
          id: "e0",
          source: "c_inicio",
          target: "c_paris",
          sourceHandle: "PARIS",
        },
        {
          id: "e1",
          source: "c_inicio",
          target: "c_tokyo",
          sourceHandle: "TOKYO",
        },
        {
          id: "e2",
          source: "c_inicio",
          target: "c_ny",
          sourceHandle: "NEWYORK",
        },
        {
          id: "e3",
          source: "c_paris",
          target: "c_par_museo",
          sourceHandle: "PAR_MUSEO",
        },
        {
          id: "e4",
          source: "c_paris",
          target: "c_par_gastro",
          sourceHandle: "PAR_GASTRO",
        },
        {
          id: "e7",
          source: "c_tokyo",
          target: "c_tok_templ",
          sourceHandle: "TOK_TEMPL",
        },
        {
          id: "e8",
          source: "c_tokyo",
          target: "c_tok_food",
          sourceHandle: "TOK_FOOD",
        },
        {
          id: "e11",
          source: "c_ny",
          target: "c_ny_atr",
          sourceHandle: "NY_ATR",
        },
        {
          id: "e12",
          source: "c_ny",
          target: "c_ny_food",
          sourceHandle: "NY_FOOD",
        },
        {
          id: "reactflow__edge-c_par_museodefault-source-a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          type: "smoothstep",
          style: { stroke: "#6366f1", strokeWidth: 2 },
          source: "c_par_museo",
          target: "a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          sourceHandle: "default-source",
          targetHandle: null,
        },
        {
          id: "reactflow__edge-c_par_gastrodefault-source-a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          type: "smoothstep",
          style: { stroke: "#6366f1", strokeWidth: 2 },
          source: "c_par_gastro",
          target: "a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          sourceHandle: "default-source",
          targetHandle: null,
        },
        {
          id: "reactflow__edge-c_ny_atrdefault-source-a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          type: "smoothstep",
          style: { stroke: "#6366f1", strokeWidth: 2 },
          source: "c_ny_atr",
          target: "a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          sourceHandle: "default-source",
          targetHandle: null,
        },
        {
          id: "reactflow__edge-c_ny_fooddefault-source-a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          type: "smoothstep",
          style: { stroke: "#6366f1", strokeWidth: 2 },
          source: "c_ny_food",
          target: "a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          sourceHandle: "default-source",
          targetHandle: null,
        },
        {
          id: "reactflow__edge-c_tok_templdefault-source-a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          type: "smoothstep",
          style: { stroke: "#6366f1", strokeWidth: 2 },
          source: "c_tok_templ",
          target: "a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          sourceHandle: "default-source",
          targetHandle: null,
        },
        {
          id: "reactflow__edge-c_tok_fooddefault-source-a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          type: "smoothstep",
          style: { stroke: "#6366f1", strokeWidth: 2 },
          source: "c_tok_food",
          target: "a4eb4e3a-81aa-4458-9de0-5009cf9fea92",
          sourceHandle: "default-source",
          targetHandle: null,
        },
      ],
    }),
  },
];

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

  // TODO: Replace with dedicated chat hook
  const { deleteWorkflow, duplicateWorkflow } = useWorkflows();

  const handleCreateWorkflowClick = () => {
    setTemplateModalOpen(true);
  };

  const createWorkflowFromTemplate = async (template: TemplateDef) => {
    setIsLoading(true);
    try {
      const response = await createChatWorkflow({
        name: template.name,
        workflowJson: template.getJson(),
      });
      if (response.status !== 200 || !response.workflow) throw new Error();
      router.push(
        `/application/agents/chat-agents/flows/${response.workflow.id}`
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
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    } catch (error) {
      console.error("Failed to delete chat workflow:", error);
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
    return new Intl.DateTimeFormat("es-ES", {
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
            <div className="text-center py-12">
              <WorkflowIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes flujos de chat creados
              </h3>
              <p className="text-gray-500 mb-4">
                Comienza creando tu primer flujo de chat
              </p>
              <Button
                onClick={handleCreateWorkflowClick}
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
                        <Badge variant="secondary" className="font-medium">
                          Draft
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
                              <Edit className="h-4 w-4 mr-2" /> Editar Flujo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleCopyId(e, workflow.id)}
                            >
                              <Copy className="h-4 w-4 mr-2" /> Copiar ID
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDuplicate(e, workflow.id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              {operationLoading === workflow.id
                                ? "Duplicando..."
                                : "Duplicar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteClick(e, workflow.id)}
                              className="text-red-600 focus:text-red-600"
                              disabled={operationLoading === workflow.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {operationLoading === workflow.id
                                ? "Eliminando..."
                                : "Eliminar"}
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
            <AlertDialogTitle>Eliminar Flujo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este flujo? Esta acción no se
              puede deshacer y eliminará permanentemente el flujo y todos sus
              datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template selector modal */}
      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear flujo a partir de una plantilla</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {TEMPLATES.map((tpl) => (
              <Button
                key={tpl.id}
                variant="outline"
                className="justify-between"
                disabled={isLoading}
                onClick={() => createWorkflowFromTemplate(tpl)}
              >
                <div className="text-left">
                  <p className="font-medium">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tpl.description}
                  </p>
                </div>
                <Plus className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
