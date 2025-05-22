"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Bot, MessageSquare, Settings, Package, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import BasicInfoStep from "@/components/application/chat/basic-info-step"
import WhatsAppConfigStep from "@/components/application/chat/whatsapp-config-step"
import AgentConfigStep from "@/components/application/chat/agent-config-step"
import ProductsStep from "@/components/application/chat/products-step"
import ReviewStep from "@/components/application/chat/review-step"
import { useCreateChatAgent } from "@/hooks/use-all-chat-agents"
import { createPhoneNumberRecord } from "@/actions/agents"

export default function CreateAgentPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    whatsappBusinessId: "",
    phoneNumberId: "",
    apiKey: "",
    webhookUrl: "",
    type: "",
    welcomeMessage: "¡Hola! ¿En qué puedo ayudarte?",
    fallbackMessage: "Lo siento, no entiendo tu mensaje. ¿Podrías reformularlo?",
    maxResponseTime: 30,
    knowledgeBaseId: "",
    phoneNumber: "",
    products: []
  })

  const { mutate: createAgent, isPending, isError, error } = useCreateChatAgent();

  const totalSteps = 5

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData({ ...formData, ...data })
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep formData={formData} updateFormData={updateFormData} />
      case 2:
        return <WhatsAppConfigStep formData={formData} updateFormData={updateFormData} />
      case 3:
        return <AgentConfigStep formData={formData} updateFormData={updateFormData} />
      case 4:
        return <ProductsStep formData={formData} updateFormData={updateFormData} />
      case 5:
        return <ReviewStep formData={formData} />
      default:
        return null
    }
  }

  const handleSubmit = async () => {
    // Normaliza los campos UUID vacíos a null
    const dataToSend = {
      ...formData,
      knowledgeBaseId: formData.knowledgeBaseId === "" ? null : formData.knowledgeBaseId,
    };

    createAgent(dataToSend, {
      onSuccess: async (response) => {
        router.push("/application/agents/chat");
      },
      onError: (err) => {
        console.error("Error al crear el agente:", err);
      },
    });
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Crear Agente de Chat</h1>
          <p className="text-muted-foreground">Complete los siguientes pasos para configurar su agente de chat</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`flex flex-col items-center ${
                  index < currentStep ? "text-primary" : "text-muted-foreground"
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
                  {index + 1 === 2 && <MessageSquare size={18} />}
                  {index + 1 === 3 && <Settings size={18} />}
                  {index + 1 === 4 && <Package size={18} />}
                  {index + 1 === 5 && <Check size={18} />}
                </div>
                <span className="text-xs hidden sm:block">
                  {index + 1 === 1 && "Información Básica"}
                  {index + 1 === 2 && "Config. WhatsApp"}
                  {index + 1 === 3 && "Config. Agente"}
                  {index + 1 === 4 && "Productos"}
                  {index + 1 === 5 && "Revisar"}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form card */}
        <Card>
          <CardContent className="pt-6">
            {renderStep()}
            {isError && (
              <div className="text-red-500 text-sm mb-2">Ocurrió un error al crear el agente.</div>
            )}
            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={prevStep} className="flex items-center" disabled={isPending}>
                  <ChevronLeft className="mr-1" size={16} /> Anterior
                </Button>
              ) : (
                <Link href="/">
                  <Button variant="outline" className="flex items-center" disabled={isPending}>
                    <ChevronLeft className="mr-1" size={16} /> Cancelar
                  </Button>
                </Link>
              )}

              {currentStep < totalSteps ? (
                <Button onClick={nextStep} className="flex items-center" disabled={isPending}>
                  Siguiente <ChevronRight className="ml-1" size={16} />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isPending}>
                  {isPending ? "Creando..." : "Crear Agente"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
