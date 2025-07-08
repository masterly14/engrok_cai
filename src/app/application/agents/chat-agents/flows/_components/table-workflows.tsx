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
  MoreHorizontal,
  Trash2,
  Copy,
  WorkflowIcon,
  FilePlus2,
  Plus,
  BotMessageSquare,
  CalendarDays,
  Target,
  ShoppingCart,
  Pencil,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  getJson: () => { nodes: any[]; edges: any[] };
};

const TEMPLATES: TemplateDef[] = [
  {
    id: "appointment-scheduler-google",
    name: "Agendamiento de Citas (Google)",
    description:
      "Agenda citas usando la integración con Google Calendar para verificar y reservar horarios.",
    icon: CalendarDays,
    getJson: () => ({
      nodes: [
        {
          id: "conv-start",
          type: "conversation",
          position: { x: 0, y: 150 },
          data: {
            name: "Iniciar Agendamiento",
            botResponse:
              "¡Hola! Soy tu asistente virtual. Para agendar una cita, primero necesito saber qué día te gustaría.",
            initialMessage: true,
          },
        },
        {
          id: "capture-day",
          type: "captureResponse",
          position: { x: 350, y: 150 },
          data: {
            name: "Capturar Día",
            variableName: "dia_preferido",
          },
        },
        {
          id: "integration-google-avail",
          type: "integration",
          position: { x: 700, y: 150 },
          data: {
            name: "Verificar Disponibilidad",
            integration: "google-calendar",
            action: "get-availability",
            // Este input sería configurado en el nodo.
            // Aquí se asume que se usa la variable capturada.
            input: { date: "{{dia_preferido}}" },
            output: "horarios_disponibles",
          },
        },
        {
          id: "conv-show",
          type: "conversation",
          position: { x: 1050, y: 150 },
          data: {
            name: "Mostrar Horarios",
            botResponse:
              "Perfecto. Estos son los horarios disponibles para el {{dia_preferido}}: {{horarios_disponibles}}. ¿Cuál prefieres?",
          },
        },
        {
          id: "capture-choice",
          type: "captureResponse",
          position: { x: 1400, y: 150 },
          data: {
            name: "Capturar Horario",
            variableName: "horario_elegido",
          },
        },
        {
          id: "integration-google-book",
          type: "integration",
          position: { x: 1750, y: 150 },
          data: {
            name: "Crear Evento en Calendar",
            integration: "google-calendar",
            action: "create-event",
            input: {
              dateTime: "{{horario_elegido}}",
              attendee: "{{whatsapp.contact.wa_id}}",
              duration: 30,
            },
            output: "evento_creado",
          },
        },
        {
          id: "conv-confirm",
          type: "conversation",
          position: { x: 2100, y: 150 },
          data: {
            name: "Confirmar Cita",
            botResponse:
              "¡Excelente! Tu cita ha sido agendada para el {{horario_elegido}}. Recibirás una invitación en tu calendario. ¡Nos vemos!",
          },
        },
      ],
      edges: [
        { id: "e1-2", source: "conv-start", target: "capture-day", type: "smoothstep" },
        { id: "e2-3", source: "capture-day", target: "integration-google-avail", type: "smoothstep" },
        { id: "e3-4", source: "integration-google-avail", target: "conv-show", type: "smoothstep" },
        { id: "e4-5", source: "conv-show", target: "capture-choice", type: "smoothstep" },
        { id: "e5-6", source: "capture-choice", target: "integration-google-book", type: "smoothstep" },
        { id: "e6-7", source: "integration-google-book", target: "conv-confirm", type: "smoothstep" },
      ],
    }),
  },
  {
    id: "whatsapp-sales-wompi",
    name: "Ventas por WhatsApp (Wompi)",
    description:
      "Guía al cliente en una compra y genera un enlace de pago con Wompi.",
    icon: ShoppingCart,
    getJson: () => ({
      nodes: [
        {
          id: "conv-offer",
          type: "conversation",
          position: { x: 0, y: 100 },
          data: {
            name: "Presentar Producto",
            botResponse:
              "¡Hola! Veo que te interesan nuestros Zapatos Deportivos X-3000. Cuestan $150.000. ¿Te gustaría comprarlos ahora?",
            interactiveButtons: [
              { id: "buy-yes", type: "reply", title: "Sí, comprar" },
              { id: "buy-no", type: "reply", title: "No, gracias" },
            ],
            initialMessage: true,
          },
        },
        {
          id: "conv-get-email",
          type: "conversation",
          position: { x: 400, y: 0 },
          data: {
            name: "Pedir Correo",
            botResponse:
              "¡Genial! Para generar tu enlace de pago, por favor, indícame tu correo electrónico.",
          },
        },
        {
          id: "capture-email",
          type: "captureResponse",
          position: { x: 750, y: 0 },
          data: { name: "Capturar Correo", variableName: "email_cliente" },
        },
        {
          id: "integration-wompi",
          type: "integration",
          position: { x: 1100, y: 0 },
          data: {
            name: "Generar Link de Pago Wompi",
            integration: "wompi",
            action: "create-payment-link",
            input: {
              amount: 150000,
              currency: "COP",
              email: "{{email_cliente}}",
            },
            output: "wompi_link",
          },
        },
        {
          id: "conv-send-link",
          type: "conversation",
          position: { x: 1450, y: 0 },
          data: {
            name: "Enviar Link de Pago",
            botResponse: "¡Perfecto! Aquí tienes tu enlace para completar la compra de forma segura:",
          },
        },
        {
          id: "url-wompi",
          type: "urlButton",
          position: { x: 1800, y: 0 },
          data: {
            name: "Botón de Pago",
            message: "Pagar ahora con Wompi",
            url: "{{wompi_link}}",
          },
        },
        {
          id: "conv-no-thanks",
          type: "conversation",
          position: { x: 400, y: 250 },
          data: {
            name: "Despedida",
            botResponse:
              "Entendido. Si cambias de opinión, no dudes en escribirme. ¡Que tengas un buen día!",
          },
        },
        {
          id: "turn-off",
          type: "turnOffAgent",
          position: { x: 750, y: 250 },
          data: { name: "Finalizar Conversación" },
        },
      ],
      edges: [
        {
          id: "e-offer-yes",
          source: "conv-offer",
          target: "conv-get-email",
          sourceHandle: "buy-yes",
          type: "smoothstep",
        },
        {
          id: "e-getemail-capture",
          source: "conv-get-email",
          target: "capture-email",
          type: "smoothstep",
        },
        {
          id: "e-capture-wompi",
          source: "capture-email",
          target: "integration-wompi",
          type: "smoothstep",
        },
        {
          id: "e-wompi-sendlink",
          source: "integration-wompi",
          target: "conv-send-link",
          type: "smoothstep",
        },
        {
          id: "e-sendlink-button",
          source: "conv-send-link",
          target: "url-wompi",
          type: "smoothstep",
        },
        {
          id: "e-offer-no",
          source: "conv-offer",
          target: "conv-no-thanks",
          sourceHandle: "buy-no",
          type: "smoothstep",
        },
        {
          id: "e-nothanks-off",
          source: "conv-no-thanks",
          target: "turn-off",
          type: "smoothstep",
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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

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
      if (response.status !== 200 || !response.workflow) {
        toast.error("No se pudo crear el flujo de trabajo.");
        throw new Error("Failed to create workflow from template");
      }
      router.push(
        `/application/agents/chat-agents/flows/${response.workflow.id}`,
      );
    } catch (e) {
      toast.error("Error creando el flujo desde la plantilla");
    } finally {
      setIsLoading(false);
      setTemplateModalOpen(false);
    }
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

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {    

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
                          <CalendarDays className="h-3 w-3" />
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
                              <Pencil className="h-4 w-4 mr-2" /> Editar Flujo
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
      <Dialog
        open={templateModalOpen}
        onOpenChange={(isOpen) => {
          setTemplateModalOpen(isOpen);
          if (!isOpen) {
            setCurrentStep(1); // Reset step on close
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear un nuevo flujo de chat</DialogTitle>
            <DialogDescription>
              {currentStep === 1 &&
                "Comienza desde cero o utiliza una de nuestras plantillas para empezar rápidamente."}
              {currentStep === 2 && "Configura los detalles de tu nuevo flujo."}
              {currentStep === 3 && "¡Todo listo para empezar!"}
            </DialogDescription>
          </DialogHeader>

          {/* Stepper progress indicator */}
          <div className="flex items-center my-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center w-full">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    currentStep > i
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors ${
                      currentStep > i + 1 ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <Card
                className="cursor-pointer hover:border-primary transition-all"
                onClick={() => !isLoading && createBlankWorkflow()}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FilePlus2 className="h-5 w-5" /> Flujo en Blanco
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Empieza con un lienzo en blanco y construye tu flujo paso a
                    paso.
                  </p>
                </CardContent>
              </Card>

              {TEMPLATES.map((tpl) => (
                <Card
                  key={tpl.id}
                  className="cursor-pointer hover:border-primary transition-all"
                  onClick={() => !isLoading && createWorkflowFromTemplate(tpl)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {tpl.icon ? (
                        <tpl.icon className="h-5 w-5" />
                      ) : (
                        <WorkflowIcon className="h-5 w-5" />
                      )}{" "}
                      {tpl.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {tpl.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {currentStep === 2 && (
            <div className="py-8 text-center">
              <h3 className="text-lg font-semibold">Paso 2: Configuración</h3>
              <p className="text-muted-foreground mt-2">
                Aquí irá el contenido para configurar el flujo.
              </p>
            </div>
          )}
          {currentStep === 3 && (
            <div className="py-8 text-center">
              <h3 className="text-lg font-semibold">Paso 3: Finalización</h3>
              <p className="text-muted-foreground mt-2">
                Este es el último paso del proceso.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>
              <Button
                onClick={() => {
                  if (currentStep < totalSteps) {
                    setCurrentStep((s) => s + 1);
                  } else {
                    // Handle finish
                    setTemplateModalOpen(false);
                  }
                }}
              >
                {currentStep < totalSteps ? "Siguiente" : "Finalizar"}
              </Button>
            </div>
          </AlertDialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
