"use client"

import { Bot, Info, ToggleLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface BasicInfoStepProps {
  formData: {
    name: string
    description: string
    isActive: boolean
  }
  updateFormData: (data: Partial<BasicInfoStepProps["formData"]>) => void
}

export default function BasicInfoStep({ formData, updateFormData }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary mb-4">
        <Bot size={24} />
        <h2 className="text-xl font-semibold">Información Básica</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-1">
            <Info size={16} />
            Nombre del Agente <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ej: Asistente de Ventas"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-1">
            <Info size={16} />
            Descripción
          </Label>
          <Textarea
            id="description"
            placeholder="Describa la función de este agente..."
            value={formData.description || ""}
            onChange={(e) => updateFormData({ description: e.target.value })}
            className="min-h-[100px]"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <ToggleLeft size={18} className="text-primary" />
            <Label htmlFor="isActive" className="cursor-pointer">
              Agente Activo
            </Label>
          </div>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => updateFormData({ isActive: checked })}
          />
        </div>
      </div>
    </div>
  )
}
