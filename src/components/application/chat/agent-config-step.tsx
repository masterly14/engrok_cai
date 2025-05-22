"use client"

import { Settings, MessageCircle, AlertCircle, Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"

// Definir el tipo inline
type AgentConfigStepProps = {
  formData: {
    welcomeMessage: string
    fallbackMessage: string
    maxResponseTime: number
  }
  updateFormData: (data: Partial<AgentConfigStepProps["formData"]>) => void
}

export default function AgentConfigStep({ formData, updateFormData }: AgentConfigStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary mb-4">
        <Settings size={24} />
        <h2 className="text-xl font-semibold">Configuración del Agente</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="welcomeMessage" className="flex items-center gap-1">
            <MessageCircle size={16} />
            Mensaje de Bienvenida
          </Label>
          <Textarea
            id="welcomeMessage"
            placeholder="Mensaje que se enviará cuando un usuario inicie una conversación"
            value={formData.welcomeMessage}
            onChange={(e) => updateFormData({ welcomeMessage: e.target.value })}
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fallbackMessage" className="flex items-center gap-1">
            <AlertCircle size={16} />
            Mensaje de Respaldo
          </Label>
          <Textarea
            id="fallbackMessage"
            placeholder="Mensaje que se enviará cuando el agente no entienda la consulta"
            value={formData.fallbackMessage}
            onChange={(e) => updateFormData({ fallbackMessage: e.target.value })}
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxResponseTime" className="flex items-center gap-1">
            <Clock size={16} />
            Tiempo Máximo de Respuesta (segundos): {formData.maxResponseTime}
          </Label>
          <div className="pt-2 px-1">
            <Slider
              id="maxResponseTime"
              min={5}
              max={120}
              step={5}
              value={[formData.maxResponseTime]}
              onValueChange={(value) => updateFormData({ maxResponseTime: value[0] })}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5s</span>
              <span>60s</span>
              <span>120s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
