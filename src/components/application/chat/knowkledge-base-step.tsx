"use client"

import { Database, FileText } from "lucide-react"
import { Label } from "@/components/ui/label" // Assuming the type is declared in a separate file
import { FileUploadComponent } from "../agents/file-upload"

type KnowledgeBaseStepProps = {
  formData: {
    name: string
    description: string
    isActive: boolean
    phoneNumber: string
    whatsappBusinessId: string
    apiKey: string
    webhookUrl: string
    welcomeMessage: string
    fallbackMessage: string
    maxResponseTime: number
    knowledgeBaseId: string
  }
  updateFormData: (data: Partial<KnowledgeBaseStepProps["formData"]>) => void
}

export default function KnowledgeBaseStep({ formData, updateFormData }: KnowledgeBaseStepProps) {
  const handleUploadSuccess = (result: any) => {
    if (result && result.id) {
      updateFormData({ knowledgeBaseId: result.id })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary mb-4">
        <Database size={24} />
        <h2 className="text-xl font-semibold">Base de Conocimiento</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <FileText size={16} />
            Archivos de Conocimiento
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Suba archivos para entrenar a su agente con información específica. Puede subir documentos de texto, PDFs o
            archivos de audio.
          </p>

          <FileUploadComponent onSubmitSuccess={handleUploadSuccess} />
        </div>
      </div>
    </div>
  )
}
