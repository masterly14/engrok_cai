"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Bot,
  Settings,
  Check,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import BasicInfoStep from "@/components/application/chat/basic-info-step";
import WhatsAppConfigStep from "@/components/application/chat/whatsapp-config-step";
import type { ProductForm } from "@/components/application/chat/products-step";
import { useCreateChatAgent } from "@/hooks/use-all-chat-agents";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { finishSetupServer } from "@/actions/chat-agents";

export default function CreateAgentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [agentCreated, setAgentCreated] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);

  type FormData = {
    name: string;
    isActive: boolean;
    whatsappBusinessId: string;
    phoneNumberId: string;
    apiKey: string;
    type: string;
    wompiEventsKey: string;
    wompiPrivateKey: string;
    phoneNumber: string;
    products: ProductForm[];
    webhookSecretKey?: string;
  };

  const [formData, setFormData] = useState<FormData>({
    name: "",
    isActive: true,
    whatsappBusinessId: "",
    phoneNumberId: "",
    apiKey: "",
    type: "",
    wompiEventsKey: "",
    wompiPrivateKey: "",
    phoneNumber: "",
    products: [] as ProductForm[],
  });

  const { mutate: createAgent, isPending, isError } = useCreateChatAgent();

  const totalSteps = 3;

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData({ ...formData, ...data });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <BasicInfoStep
              formData={formData}
              updateFormData={updateFormData}
            />
          </>
        );
      case 2:
        return (
          <WhatsAppConfigStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <WhatsAppConfigStep
            formData={formData}
            updateFormData={updateFormData}
            agentCreated={true}
            createdAgentId={createdAgentId}
          />
        );
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    createAgent(formData, {
      onSuccess: async (response) => {
        setAgentCreated(true);
        setCreatedAgentId(response.data.id || null);
        nextStep(); // Avanzar al paso de configuración del webhook
      },
      onError: (err) => {
        console.error("Error al crear el agente:", err);
      },
    });
  };

  const finishSetup = async () => {
    router.push("/application/agents/chat");
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Crear Agente de Chat</h1>
          <p className="text-muted-foreground">
            Complete los siguientes pasos para configurar su agente de chat
          </p>
        </div>

        {/* Progress bar - Solo visible si el agente no ha sido creado aún */}
        {!agentCreated && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center ${
                    index < currentStep
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                      index + 1 === currentStep
                        ? "bg-primary text-primary-foreground"
                        : index + 1 < currentStep
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1 === 1 && <Bot size={18} />}
                    {index + 1 === 2 && <Settings size={18} />}
                    {index + 1 === 3 && <Shield size={18} />}
                  </div>
                  <span className="text-xs hidden sm:block">
                    {index + 1 === 1 && "Config. Básica"}
                    {index + 1 === 2 && "Config. Técnica"}
                    {index + 1 === 3 && "Webhook"}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Mensaje de éxito cuando el agente ha sido creado */}
        {agentCreated && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <Check className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              Agente creado exitosamente
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Tu agente de chat ha sido creado correctamente. Ahora configura el
              webhook para recibir mensajes de WhatsApp.
            </AlertDescription>
          </Alert>
        )}

        {/* Form card */}
        <Card>
          <CardContent className="pt-6">
            {renderStep()}
            {isError && (
              <div className="text-red-500 text-sm mb-2">
                Ocurrió un error al crear el agente.
              </div>
            )}
            <div className="flex justify-between mt-8">
              {!agentCreated ? (
                <>
                  {currentStep > 1 ? (
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      className="flex items-center"
                      disabled={isPending}
                    >
                      <ChevronLeft className="mr-1" size={16} /> Anterior
                    </Button>
                  ) : (
                    <Link href="/application/agents/chat">
                      <Button
                        variant="outline"
                        className="flex items-center"
                        disabled={isPending}
                      >
                        <ChevronLeft className="mr-1" size={16} /> Cancelar
                      </Button>
                    </Link>
                  )}

                  {currentStep < totalSteps - 1 ? (
                    <Button
                      onClick={nextStep}
                      className="flex items-center"
                      disabled={isPending}
                    >
                      Siguiente <ChevronRight className="ml-1" size={16} />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={isPending}>
                      {isPending ? "Creando..." : "Crear Agente"}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div></div> {/* Espacio vacío para mantener la alineación */}
                  <Button
                    disabled={formData.webhookSecretKey === ""}
                    onClick={finishSetup}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Finalizar Configuración
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
