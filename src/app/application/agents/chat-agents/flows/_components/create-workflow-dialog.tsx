"use client";
import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarDays,
  Headset,
  ShoppingBag,
  ChevronsUpDown,
  CheckCircle,
  FileText,
  Sparkles,
  ArrowRight,
  Bot,
  Database,
  Upload,
  Plus,
  Loader2,
  Key,
} from "lucide-react";
import { createChatWorkflow } from "@/actions/chat-agents";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PdfViewer } from "./pdf_viewer";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";
import IntegrationComponent from "@/components/nango/integrationComponent";
import {
  validateIntegrationUser,
  validateWompiIntegrationUser,
  validateAndSaveWompiCredentials,
} from "@/actions/integrations";
import { Input } from "@/components/ui/input";

const FileUploader = dynamic(() => import("./file-uploader"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span className="ml-2 text-sm text-muted-foreground">Cargando...</span>
    </div>
  ),
});

// Chat Workflow type
type TemplateDef = {
  id: string;
  name: string;
  description: string;
  features: string[];
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  getJson: () => { nodes: any[]; edges: any[] };
};

const TEMPLATES: TemplateDef[] = [
  {
    id: "appointment-scheduler-google",
    name: "Agendamiento de Citas",
    description:
      "Agenda citas usando la integración con Google Calendar para verificar y reservar horarios.",
    features: [
      "Integración Google Calendar",
      "Verificación automática",
      "Confirmación por email",
    ],
    icon: CalendarDays,
    getJson: () => ({
      nodes: [
        {
          id: "ai-scheduler",
          type: "ai",
          position: { x: 250, y: 50 },
          data: {
            name: "Asistente de Agendamiento",
            prompt:
              "Eres un asistente amigable para agendar citas. Tu objetivo es recopilar el nombre completo del cliente, su email, el servicio que desea y la fecha y hora para la cita. Conversa de forma natural. Una vez tengas toda la información, la usarás para verificar la disponibilidad. Si el usuario solicita hablar con un humano, debes usar la condición correspondiente para transferirlo.",
            initialMessage: true,
            extractVariables: [
              {
                id: "var-name",
                name: "nombre_cliente",
                description: "Nombre completo del cliente.",
              },
              {
                id: "var-email",
                name: "email_cliente",
                description: "Correo electrónico del cliente.",
              },
              {
                id: "var-service",
                name: "servicio_deseado",
                description: "El servicio que el cliente quiere agendar.",
              },
              {
                id: "var-datetime",
                name: "fecha_hora_deseada",
                description:
                  "La fecha y hora que el cliente prefiere para su cita.",
              },
            ],
          },
        },
        {
          id: "check-availability",
          type: "integration",
          position: { x: 250, y: 350 },
          data: {
            name: "Verificar Disponibilidad",
            provider: "GOOGLE_CALENDAR",
            action: "GET_AVAILABILITY",
            fields: {
              dateTime: "{{fecha_hora_deseada}}",
              duration: 60,
            },
            saveResponseTo: "availability_status",
            botResponse: "",
          },
        },
        {
          id: "check-if-available",
          type: "condition",
          position: { x: 250, y: 550 },
          data: {
            name: "Disponibilidad",
            condition: "{{availability_status}} == 'available'",
            statusSuccess: "Disponible",
            statusError: "No Disponible",
          },
        },
        {
          id: "create-event",
          type: "integration",
          position: { x: 50, y: 750 },
          data: {
            name: "Crear Evento en Calendar",
            provider: "GOOGLE_CALENDAR",
            action: "CREATE_EVENT",
            fields: {
              summary: "Cita para {{nombre_cliente}} - {{servicio_deseado}}",
              description:
                "Agendado via Chatbot. Email: {{email_cliente}}. Servicio: {{servicio_deseado}}",
              dateTime: "{{fecha_hora_deseada}}",
              duration: 30,
              attendeeEmail: "{{email_cliente}}",
            },
            saveResponseTo: "event_details",
          },
        },
        {
          id: "confirm-booking",
          type: "conversation",
          position: { x: 50, y: 950 },
          data: {
            name: "Confirmación Final",
            botResponse:
              "¡Excelente! Tu cita ha sido confirmada. Recibirás un correo electrónico con los detalles. ¡Nos vemos pronto!",
          },
        },
        {
          id: "propose-new-time",
          type: "conversation",
          position: { x: 450, y: 750 },
          data: {
            name: "Sugerir Nueva Hora",
            botResponse:
              "Lo siento, no tengo disponibilidad en esa fecha y hora. Por favor, indica otra fecha u hora para verificar nuevamente.",
          },
        },
        {
          id: "end-flow",
          type: "turnOffAgent",
          position: { x: 50, y: 1150 },
          data: {
            name: "Finalizar",
            message: "Proceso de agendamiento finalizado.",
          },
        },
        {
          id: "handover-node",
          type: "handoverToHuman",
          position: { x: 550, y: 150 },
          data: {
            name: "Transferir a Humano",
            botResponse:
              "Entendido. Un momento por favor, te transferiré con un agente humano.",
          },
        },
      ],
      edges: [
        {
          id: "edge-ai-to-check",
          source: "ai-scheduler",
          target: "check-availability",
          type: "smoothstep",
          label: "Información completa",
          data: {
            condition:
              "Si se ha recopilado toda la información: nombre_cliente, email_cliente, servicio_deseado, y fecha_hora_deseada.",
          },
        },
        {
          id: "edge-check-to-condition",
          source: "check-availability",
          target: "check-if-available",
          type: "smoothstep",
        },
        {
          id: "edge-condition-success",
          source: "check-if-available",
          sourceHandle: "success",
          target: "create-event",
          label: "Disponible",
          type: "smoothstep",
        },
        {
          id: "edge-condition-error",
          source: "check-if-available",
          sourceHandle: "error",
          target: "propose-new-time",
          label: "No Disponible",
          type: "smoothstep",
        },
        {
          id: "edge-create-to-confirm",
          source: "create-event",
          target: "confirm-booking",
          type: "smoothstep",
        },
        {
          id: "edge-confirm-to-end",
          source: "confirm-booking",
          target: "end-flow",
          type: "smoothstep",
        },
        {
          id: "edge-propose-to-ai",
          source: "propose-new-time",
          target: "ai-scheduler",
          type: "smoothstep",
        },
        {
          id: "edge-ai-to-handover",
          source: "ai-scheduler",
          target: "handover-node",
          type: "smoothstep",
          label: "Solicita humano",
          data: {
            condition: "Si el usuario pide hablar con un humano o agente.",
          },
        },
      ],
    }),
  },
  {
    id: "whatsapp-sales-wompi",
    name: "Ventas por WhatsApp",
    description:
      "Guía al cliente en una compra y genera un enlace de pago con Wompi.",
    features: [
      "Procesamiento de pagos",
      "Enlaces seguros",
      "Seguimiento de ventas",
    ],
    icon: ShoppingBag,
    getJson: () => ({
      nodes: [
        // ... nodes
      ],
      edges: [
        // ... edges
      ],
    }),
  },
  {
    id: "customer-support",
    name: "Soporte al Cliente",
    description:
      "Proporciona soporte automatizado con base de conocimiento integrada.",
    features: [
      "Base de conocimiento",
      "Escalación automática",
      "Historial de conversaciones",
    ],
    icon: Headset,
    getJson: () => ({
      nodes: [],
      edges: [],
    }),
  },
];

interface CreateWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function CreateWorkflowDialog({
  open,
  onOpenChange,
  isLoading,
  setIsLoading,
}: CreateWorkflowDialogProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isOpenCollapsible, setIsOpenCollapsible] = useState(false);
  const [isOpenCollapsible2, setIsOpenCollapsible2] = useState(false);
  const [ragEnabled, setRagEnabled] = useState(false);
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string | null>(null);
  const [kbList, setKbList] = useState<any[]>([]);
  const [isKbLoading, setIsKbLoading] = useState(false);
  const [isIntegrationConnected, setIsIntegrationConnected] = useState<
    boolean | null
  >(null);
  const [isIntegrationLoading, setIsIntegrationLoading] = useState(false);
  const [wompiPublicKey, setWompiPublicKey] = useState<string>("");
  const [wompiPrivateKey, setWompiPrivateKey] = useState<string>("");
  const [wompiEventToken, setWompiEventToken] = useState<string>("");

  const totalSteps = 3;

  const fetchKbs = useCallback(async () => {
    setIsKbLoading(true);
    try {
      const res = await fetch("/api/knowledge-bases");
      if (res.ok) {
        const json = await res.json();
        setKbList(json);
      } else {
        toast.error("Error al cargar las bases de conocimiento.");
      }
    } catch (err) {
      toast.error("Error al cargar las bases de conocimiento.");
      console.error("[CreateWorkflowDialog] Error fetching KBs", err);
    } finally {
      setIsKbLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentStep === 2) {
      fetchKbs();
    }
  }, [currentStep, fetchKbs]);

  const checkGoogleConnection = useCallback(async () => {
    setIsIntegrationLoading(true);
    try {
      const result = await validateIntegrationUser("GOOGLE_CALENDAR");
      setIsIntegrationConnected(result.isConnected);
      if (!result.isConnected) {
        toast.info("Conecta tu cuenta de Google Calendar para continuar.");
      }
    } catch (error) {
      toast.error("Error al verificar la conexión con Google Calendar.");
      setIsIntegrationConnected(false);
    } finally {
      setIsIntegrationLoading(false);
    }
  }, []);

  const checkWompiConnection = useCallback(async () => {
    setIsIntegrationLoading(true);
    try {
      const result = await validateWompiIntegrationUser();
      setIsIntegrationConnected(result.isConnected);
      if (!result.isConnected) {
        toast.info("Conecta tu cuenta de Wompi para continuar.");
      }
    } catch (error) {
      toast.error("Error al verificar la conexión con Wompi.");
      setIsIntegrationConnected(false);
    } finally {
      setIsIntegrationLoading(false);
    }
  }, []);

  const handleValidateWompi = async () => {
    if (!wompiPublicKey || !wompiPrivateKey || !wompiEventToken) {
      toast.error("Por favor, completa todos los campos para continuar");
      return;
    }

    setIsIntegrationLoading(true);
    try {
      const result = await validateAndSaveWompiCredentials(
        wompiPublicKey,
        wompiPrivateKey,
        wompiEventToken
      );
      if (result.success) {
        toast.success("Wompi conectada correctamente");
        setIsIntegrationConnected(true);
      } else {
        toast.error(result.error || "Error al validar Wompi");
        setIsIntegrationConnected(false);
      }
    } catch (error) {
      toast.error("Error inesperado al validar Wompi");
      setIsIntegrationConnected(false);
    } finally {
      setIsIntegrationLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 3) {
      setIsIntegrationConnected(null);
      if (selectedTemplate === "appointment-scheduler-google") {
        checkGoogleConnection();
      } else if (selectedTemplate === "whatsapp-sales-wompi") {
        checkWompiConnection();
      }
    }
  }, [
    currentStep,
    selectedTemplate,
    checkGoogleConnection,
    checkWompiConnection,
  ]);

  const createWorkflowFromTemplate = async (template: TemplateDef) => {
    setIsLoading(true);
    try {
      const workflowJson = template.getJson();

      if (ragEnabled && knowledgeBaseId) {
        const aiNode = workflowJson.nodes.find((node) => node.type === "ai");
        if (aiNode) {
          aiNode.data.ragEnabled = true;
          aiNode.data.knowledgeBaseId = knowledgeBaseId;
        } else {
          toast.info(
            "La plantilla no tiene un nodo de IA, por lo que no se vinculó la base de conocimiento."
          );
        }
      }

      const response = await createChatWorkflow({
        name: template.name,
        workflowJson: workflowJson,
      });
      if (response.status !== 200 || !response.workflow) {
        toast.error("No se pudo crear el flujo de trabajo.");
        throw new Error("Failed to create workflow from template");
      }
      router.push(
        `/application/agents/chat-agents/flows/${response.workflow.id}`
      );
    } catch (e) {
      toast.error("Error creando el flujo desde la plantilla");
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  const selectedTemplateData = TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setCurrentStep(1);
          setSelectedTemplate(null);
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                Crear un nuevo flujo de chat
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {currentStep === 1 &&
                  "Selecciona una plantilla para comenzar rápidamente"}
                {currentStep === 2 &&
                  "Configura los detalles de tu nuevo flujo"}
                {currentStep === 3 && "Revisa y finaliza la configuración"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Enhanced Stepper */}
        <div className="flex items-center justify-between mb-8 px-4">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                    currentStep > i
                      ? "bg-primary border-primary text-primary-foreground shadow-lg"
                      : currentStep === i + 1
                        ? "border-primary text-primary bg-primary/10"
                        : "border-muted-foreground/30 text-muted-foreground bg-muted/50"
                  )}
                >
                  {currentStep > i ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 font-medium transition-colors",
                    currentStep >= i + 1
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {i === 0 && "Plantilla"}
                  {i === 1 && "Configuración"}
                  {i === 2 && "Finalizar"}
                </span>
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={cn(
                    "w-20 h-0.5 mx-4 transition-all duration-300",
                    currentStep > i + 1
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Template Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Elige tu plantilla
              </h3>
              <p className="text-muted-foreground">
                Selecciona el tipo de agente que mejor se adapte a tus
                necesidades
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TEMPLATES.map((template) => {
                const Icon = template.icon || Bot;
                const isSelected = selectedTemplate === template.id;

                return (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Características
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.features.map((feature, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Configuration */}
        {currentStep === 2 && selectedTemplateData && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                {selectedTemplateData.icon && (
                  <selectedTemplateData.icon className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedTemplateData.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplateData.description}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Base de Conocimiento
                </CardTitle>
                <CardDescription>
                  Configura la información que tu agente utilizará para
                  responder preguntas{" "}
                  {selectedTemplate === "appointment-scheduler-google" && (
                    <span className="text-xs font-bold">
                      Asegurate de que la base de conocimiento tenga información
                      sobre horarios, ubicación, servicios, etc.
                    </span>
                  )}
                  {selectedTemplate === "whatsapp-sales-wompi" && (
                    <span className="text-xs font-bold">
                      Asegurate de que la base de conocimiento tenga información
                      sobre productos, servicios, plazos de entrega, etc.
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Collapsible
                  open={isOpenCollapsible}
                  onOpenChange={setIsOpenCollapsible}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto"
                    >
                      <span className="font-medium">
                        ¿Qué es una base de conocimiento?
                      </span>
                      <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        Una base de conocimiento es un conjunto de documentos
                        que contienen información relevante para que el agente
                        de chat pueda dar respuestas precisas y específicas.
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-blue-800 dark:text-blue-200">
                          <strong>Ejemplo:</strong> Si tienes un agente para tu
                          empresa, puedes incluir documentos sobre tu historia,
                          productos, servicios, políticas, etc.
                        </p>
                      </div>

                      <Collapsible
                        open={isOpenCollapsible2}
                        onOpenChange={setIsOpenCollapsible2}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between bg-transparent"
                          >
                            <span>Ver ejemplo de base de conocimiento</span>
                            <ChevronsUpDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 flex flex-col gap-y-2">
                          <PdfViewer
                            fileUrl="/clinica_estetica.pdf"
                            title="Base de conocimiento - Ejemplo"
                          >
                            <Button
                              variant="outline"
                              className="w-full bg-transparent"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Toca aquí para abrir el documento de ejemplo
                            </Button>
                          </PdfViewer>
                          <p className="text-muted-foreground text-sm">
                            Este es un ejemplo de base de conocimiento para una
                            clínica de estética. En esta se dan respuestas a
                            preguntas como:
                            <ul className="list-disc list-inside text-muted-foreground text-sm">
                              <li>¿Qué servicios ofrece la clínica?</li>
                              <li>¿Cuáles son los horarios de atención?</li>
                              <li>¿Cómo puedo agendar una cita?</li>
                              <li>
                                ¿Qué tratamientos se realizan en la clínica?
                              </li>
                              <li>
                                ¿Qué productos se utilizan en los tratamientos?
                              </li>
                              <li>¿Qué garantías se ofrecen?</li>
                              <li>
                                ¿Qué se debe hacer antes de un tratamiento?
                              </li>
                              <li>
                                ¿Qué se debe hacer después de un tratamiento?
                              </li>
                              <li>
                                ¿Qué se debe hacer si se tiene una alergia a
                                algún producto?
                              </li>
                            </ul>
                          </p>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="rag-enabled-switch"
                        checked={ragEnabled}
                        onCheckedChange={setRagEnabled}
                      />
                      <div>
                        <Label
                          htmlFor="rag-enabled-switch"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Habilitar Base de Conocimiento
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Permite al asistente acceder a información específica
                          de tu negocio
                        </p>
                      </div>
                    </div>
                    {ragEnabled && (
                      <Badge variant="secondary">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Activa
                      </Badge>
                    )}
                  </div>

                  {ragEnabled && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Seleccionar Base de Conocimiento
                        </Label>
                        <Select
                          value={knowledgeBaseId ?? ""}
                          onValueChange={(value) => setKnowledgeBaseId(value)}
                          disabled={isKbLoading}
                        >
                          <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Selecciona una base de conocimiento" />
                          </SelectTrigger>
                          <SelectContent>
                            {kbList && kbList.length > 0 ? (
                              kbList.map((kb: any) => (
                                <SelectItem key={kb.id} value={kb.id}>
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span>{kb.name}</span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-kbs" disabled>
                                {isKbLoading
                                  ? "Cargando..."
                                  : "No hay bases de conocimiento"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <Dialog
                        onOpenChange={(open) => {
                          if (!open) {
                            fetchKbs();
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full transition-all duration-200 hover:bg-primary/5 bg-transparent"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Crear Nueva Base de Conocimiento
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Upload className="w-5 h-5" />
                              Crear Base de Conocimiento
                            </DialogTitle>
                            <DialogDescription>
                              Sube documentos para crear tu base de
                              conocimiento.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            <FileUploader onUploaded={() => fetchKbs()} />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Finalization */}
        {currentStep === 3 && selectedTemplateData && (
          <>
            {selectedTemplate === "appointment-scheduler-google" ||
            selectedTemplate === "whatsapp-sales-wompi" ? (
              <div>
                {isIntegrationLoading &&
                !isIntegrationConnected &&
                !wompiPublicKey ? (
                  <div className="flex flex-col items-center justify-center gap-4 p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Verificando conexión...
                    </p>
                  </div>
                ) : isIntegrationConnected === true ? (
                  <div className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">¡Todo listo!</h3>
                        <p className="text-muted-foreground">
                          Tu agente de chat está configurado y listo para usar
                        </p>
                      </div>
                    </div>
                  </div>
                ) : selectedTemplate === "appointment-scheduler-google" ? (
                  <IntegrationComponent
                    setIntegrationConnection={setIsIntegrationConnected}
                    visibleName="Google Calendar"
                    providerConfigKey="google-calendar"
                    authMode="O_AUTH2"
                    displayMode="button"
                  />
                ) : selectedTemplate === "whatsapp-sales-wompi" ? (
                  <Card className="max-w-md mx-auto">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Key className="w-4 h-4" />
                        Conecta tu cuenta de Wompi
                      </CardTitle>
                      <CardDescription>
                        Ingresa tus credenciales de Wompi para establecer la
                        conexión
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="publicKey">Clave Pública</Label>
                        <Input
                          id="publicKey"
                          placeholder="pub_test_..."
                          value={wompiPublicKey}
                          onChange={(e) => setWompiPublicKey(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="privateKey">Clave Privada</Label>
                        <Input
                          id="privateKey"
                          type="password"
                          placeholder="prv_test_..."
                          value={wompiPrivateKey}
                          onChange={(e) => setWompiPrivateKey(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="eventToken">Token de Evento</Label>
                        <Input
                          id="eventToken"
                          type="password"
                          placeholder="Event webhook token"
                          value={wompiEventToken}
                          onChange={(e) => setWompiEventToken(e.target.value)}
                        />
                      </div>

                      <Button
                        onClick={handleValidateWompi}
                        className="w-full"
                        disabled={
                          isIntegrationLoading ||
                          !wompiPublicKey ||
                          !wompiPrivateKey ||
                          !wompiEventToken
                        }
                      >
                        {isIntegrationLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Validar y Conectar
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">¡Todo listo!</h3>
                    <p className="text-muted-foreground">
                      Tu agente de chat está configurado y listo para usar
                    </p>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {selectedTemplateData.icon && (
                        <selectedTemplateData.icon className="h-5 w-5" />
                      )}
                      {selectedTemplateData.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedTemplateData.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="font-medium text-sm">
                        Características incluidas:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedTemplateData.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Enhanced Footer */}
        <AlertDialogFooter className="pt-6 border-t">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1 || isLoading}
              className="min-w-[100px]"
            >
              Anterior
            </Button>

            <div className="flex gap-2">
              {currentStep < totalSteps ? (
                <Button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  disabled={currentStep === 1 && !selectedTemplate}
                  className="min-w-[100px]"
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (selectedTemplateData) {
                      createWorkflowFromTemplate(selectedTemplateData);
                    }
                  }}
                  disabled={
                    isLoading ||
                    ((selectedTemplate === "appointment-scheduler-google" ||
                      selectedTemplate === "whatsapp-sales-wompi") &&
                      !isIntegrationConnected)
                  }
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Crear Flujo
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </AlertDialogFooter>
      </DialogContent>
    </Dialog>
  );
}
