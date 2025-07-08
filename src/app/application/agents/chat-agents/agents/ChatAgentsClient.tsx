"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, RotateCcw, Trash2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useChatAgent } from "@/context/chat-agent-context";
import type { ChatAgent, ChatWorkflow } from "@prisma/client";
import {
  useUpdateChatAgent,
  useDeleteChatAgent,
  useCreateChatAgent,
} from "@/hooks/use-create-chat-agent";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { getAvailableWorkflows } from "@/actions/chat-agents";
import WhatsAppConnectButton from "@/components/application/whatsapp-connect-button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ChatAgentsClient = ({
  agents,
}: {
  agents: (ChatAgent & { workflows: ChatWorkflow[] })[];
}) => {
  const {
    selectedChatAgent,
    formData,
    setFormData,
    hasChanges,
    resetForm,
    isCreatingNew,
    setIsCreatingNew,
    setSelectedChatAgent,
  } = useChatAgent();

  const updateAgentMutation = useUpdateChatAgent();
  const deleteAgentMutation = useDeleteChatAgent();
  const createAgentMutation = useCreateChatAgent();
  const router = useRouter();

  const [availableWorkflows, setAvailableWorkflows] = useState<ChatWorkflow[]>(
    [],
  );

  useEffect(() => {
    getAvailableWorkflows(selectedChatAgent?.id).then(setAvailableWorkflows);
  }, [selectedChatAgent]);

  useEffect(() => {
    if (agents.length > 0 && !selectedChatAgent && !isCreatingNew) {
      setSelectedChatAgent(agents[0]);
    }
  }, [agents, selectedChatAgent, isCreatingNew, setSelectedChatAgent]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean | null,
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSave = async () => {
    const {
      name,
      whatsappAccessToken,
      whatsappBusinessAccountId,
      whatsappPhoneNumber,
      whatsappPhoneNumberId,
    } = formData;
    if (
      !name ||
      !whatsappAccessToken ||
      !whatsappBusinessAccountId ||
      !whatsappPhoneNumber ||
      !whatsappPhoneNumberId
    ) {
      toast.error("Por favor, completa todos los campos requeridos.");
      return;
    }

    await createAgentMutation.mutateAsync(formData, {
      onSuccess: (newAgent) => {
        setSelectedChatAgent(newAgent);
        setIsCreatingNew(false);
        if (!formData.workflowId) {
          toast.info("Agente creado. Redirigiendo para crear un flujo...", {
            duration: 4000,
          });
          router.push(`/application/agents/chat-agents/flows/`);
        }
      },
    });
  };

  const handleUpdate = async () => {
    if (!selectedChatAgent) return;
    await updateAgentMutation.mutateAsync(
      { agentId: selectedChatAgent.id, data: formData },
      {
        onSuccess: (updatedAgent) => {
          setSelectedChatAgent(updatedAgent);
        },
      },
    );
  };

  const handleDelete = async () => {
    if (!selectedChatAgent) return;
    await deleteAgentMutation.mutateAsync(selectedChatAgent.id, {
      onSuccess: () => {
        setSelectedChatAgent(null);
        setIsCreatingNew(false);
      },
    });
  };

  return (
    <div className="flex-1 p-6 overflow-auto overflow-x-hidden">
      {!selectedChatAgent && !isCreatingNew ? (
        <div className="max-w-4xl mx-auto">
          <Card className="mt-20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold text-muted-foreground">
                  No hay agente seleccionado
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Selecciona un agente de la lista para editarlo o crea uno
                  nuevo para comenzar.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {isCreatingNew
                  ? "Crear Nuevo Agente de Chat"
                  : `Editando: ${selectedChatAgent?.name}`}
              </h1>
              <p className="text-muted-foreground">
                {isCreatingNew
                  ? "Configura los detalles de tu nuevo chatbot."
                  : "Modifica la configuración de tu agente."}
              </p>
            </div>

            <div className="flex gap-2 items-center">
              {!isCreatingNew && selectedChatAgent && (
                <Link
                  href={`/application/agents/chat-agents/conversations/${selectedChatAgent.id}`}
                  passHref
                >
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Conversaciones
                  </Button>
                </Link>
              )}

              {hasChanges && !isCreatingNew && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={updateAgentMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Descartar
                </Button>
              )}

              {!isCreatingNew && (
                <Button
                  onClick={handleUpdate}
                  disabled={!hasChanges || updateAgentMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateAgentMutation.isPending
                    ? "Guardando..."
                    : "Guardar Cambios"}
                </Button>
              )}
            </div>
          </div>

          {/* General Agent Information Card (always visible when editing or creating) */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Agente</CardTitle>
              <CardDescription>
                Nombre, estado y flujo de conversación principal del agente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del agente</Label>
                <Input
                  id="name"
                  placeholder="Ej: Agente de Soporte Nivel 1"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleInputChange("isActive", checked)
                  }
                />
                <Label htmlFor="isActive">Agente Activo</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflowId">Flujo de Conversación</Label>
                <Select
                  value={formData.workflowId || "none"}
                  onValueChange={(value) =>
                    handleInputChange(
                      "workflowId",
                      value === "none" ? null : value,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un flujo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {availableWorkflows.map((flow) => (
                      <SelectItem key={flow.id} value={flow.id}>
                        {flow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Asigna un guion al agente. Si no tienes, puedes crearlo
                  después.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Configuration (conditionally rendered based on isCreatingNew) */}
          {isCreatingNew ? (
            <Tabs defaultValue="oauth" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="oauth">
                  Conexión Rápida (OAuth2)
                </TabsTrigger>
                <TabsTrigger value="manual">Configuración Manual</TabsTrigger>
              </TabsList>
              <TabsContent value="oauth">
                <Card>
                  <CardHeader>
                    <CardTitle>Conecta tu cuenta de WhatsApp</CardTitle>
                    <CardDescription>
                      Usa el siguiente botón para iniciar sesión con Meta y
                      autorizar la línea de WhatsApp Business que quieras usar.
                      Al finalizar, se creará el agente automáticamente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center">
                    <WhatsAppConnectButton />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="manual">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración Manual de WhatsApp</CardTitle>
                    <CardDescription>
                      Introduce las credenciales de tu cuenta de WhatsApp
                      Business para conectar el agente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="whatsappAccessToken">Access Token</Label>
                      <Input
                        id="whatsappAccessToken"
                        placeholder="Pega tu Access Token de la App de Meta"
                        value={formData.whatsappAccessToken}
                        onChange={(e) =>
                          handleInputChange(
                            "whatsappAccessToken",
                            e.target.value,
                          )
                        }
                        type="password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsappBusinessAccountId">
                        Business Account ID
                      </Label>
                      <Input
                        id="whatsappBusinessAccountId"
                        placeholder="Pega tu Business Account ID"
                        value={formData.whatsappBusinessAccountId}
                        onChange={(e) =>
                          handleInputChange(
                            "whatsappBusinessAccountId",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsappPhoneNumber">
                        Número de Teléfono
                      </Label>
                      <Input
                        id="whatsappPhoneNumber"
                        placeholder="Ej: +15551234567"
                        value={formData.whatsappPhoneNumber}
                        onChange={(e) =>
                          handleInputChange(
                            "whatsappPhoneNumber",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsappPhoneNumberId">
                        Phone Number ID
                      </Label>
                      <Input
                        id="whatsappPhoneNumberId"
                        placeholder="Pega el Phone Number ID de WhatsApp"
                        value={formData.whatsappPhoneNumberId}
                        onChange={(e) =>
                          handleInputChange(
                            "whatsappPhoneNumberId",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={createAgentMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {createAgentMutation.isPending
                        ? "Creando..."
                        : "Crear Agente Manualmente"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Cuenta de WhatsApp</CardTitle>
                <CardDescription>
                  Conecta o gestiona la línea de WhatsApp asociada a este
                  agente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedChatAgent?.whatsappPhoneNumber ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      Número conectado:{" "}
                      <strong>{selectedChatAgent.whatsappPhoneNumber}</strong>
                    </p>
                    <p className="text-muted-foreground break-all">
                      Business Account ID:{" "}
                      {selectedChatAgent.whatsappBusinessAccountId}
                    </p>
                    <p className="text-muted-foreground break-all">
                      Phone Number ID: {selectedChatAgent.whatsappPhoneNumberId}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Para volver a conectar otra línea, elimínala primero o usa
                      el botón de gestionar en Meta.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-4">
                    <p className="text-sm text-muted-foreground">
                      Aún no hay una línea asociada. Conecta tu cuenta para
                      crear el agente automáticamente.
                    </p>
                    <WhatsAppConnectButton />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!isCreatingNew && selectedChatAgent && (
            <Card className="border-red-500/50">
              <CardHeader>
                <CardTitle>Zona de Peligro</CardTitle>
                <CardDescription>
                  Esta acción no se puede deshacer. Esto eliminará
                  permanentemente el agente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteAgentMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAgentMutation.isPending
                    ? "Eliminando..."
                    : "Eliminar Agente"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatAgentsClient;
