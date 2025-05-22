import type React from "react"
import {
  Check,
  Bot,
  MessageSquare,
  Settings,
  Key,
  Globe,
  MessageCircle,
  AlertCircle,
  Clock,
  ToggleLeft,
  Info,
  Hash,
  Phone,
} from "lucide-react"

interface ReviewStepProps {
  formData: {
    name: string
    description: string
    phoneNumber: string
    isActive: boolean
    whatsappBusinessId: string
    phoneNumberId: string
    apiKey: string
    webhookUrl: string
    welcomeMessage: string
    fallbackMessage: string
    maxResponseTime: number
    knowledgeBaseId: string
  }
}

export default function ReviewStep({ formData }: ReviewStepProps) {
  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: { label: string; value: string | number | boolean; icon: React.ReactNode }[],
  ) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-primary mb-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="bg-muted/30 p-4 rounded-md">
        {items.map((item, index) => (
          <div key={index} className="flex items-start py-2 border-b border-border last:border-0">
            <div className="text-primary mt-0.5 mr-2">{item.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground break-words">
                {typeof item.value === "boolean" ? (
                  item.value ? (
                    "Sí"
                  ) : (
                    "No"
                  )
                ) : item.value ? (
                  item.value
                ) : (
                  <span className="text-muted-foreground/60 italic">No especificado</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary mb-4">
        <Check size={24} />
        <h2 className="text-xl font-semibold">Revisar Información</h2>
      </div>

      <p className="text-muted-foreground mb-4">Por favor revise la información del agente antes de crear.</p>

      {renderSection("Información Básica", <Bot size={20} />, [
        { label: "Nombre", value: formData.name, icon: <Bot size={16} /> },
        { label: "Descripción", value: formData.description || "", icon: <Info size={16} /> },
        { label: "Activo", value: formData.isActive, icon: <ToggleLeft size={16} /> },
        { label: "Número de Teléfono", value: formData.phoneNumber || "", icon: <Phone size={16} /> },
      ])}

      {renderSection("Configuración de WhatsApp", <MessageSquare size={20} />, [
        { label: "ID de WhatsApp Business", value: formData.whatsappBusinessId || "", icon: <Hash size={16} /> },
        { label: "ID de WhatsApp Phone Number", value: formData.phoneNumberId || "", icon: <Hash size={16} /> },
        { label: "Clave API", value: formData.apiKey ? "••••••••" : "", icon: <Key size={16} /> },
        { label: "URL del Webhook", value: formData.webhookUrl || "", icon: <Globe size={16} /> },
      ])}

      {renderSection("Configuración del Agente", <Settings size={20} />, [
        { label: "Mensaje de Bienvenida", value: formData.welcomeMessage, icon: <MessageCircle size={16} /> },
        { label: "Mensaje de Respaldo", value: formData.fallbackMessage, icon: <AlertCircle size={16} /> },
        {
          label: "Tiempo Máximo de Respuesta",
          value: `${formData.maxResponseTime} segundos`,
          icon: <Clock size={16} />,
        },
      ])}
    </div>
  )
}
