"use client"

import { useParams } from "next/navigation"
import { WhatsAppPreview } from "@/components/application/chat/whatsapp-preview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus } from "lucide-react"
import { useAgentMessageTemplates } from "@/hooks/use-message-templates"
import { Button } from "@/components/ui/button"
import CreateTemplateModal from "@/components/application/chat/create-template-modal"

interface TemplateDetails {
  id: string
  name: string
  language: string
  category: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  components: any[]
  createdAt: string
}

export default function TemplateDetailsPage() {
  const params = useParams() as { templateId: string }
  const agentId = params.templateId

  const { templates, templatesLoading, templatesError } = useAgentMessageTemplates(agentId)

  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (templatesError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">
          {templatesError instanceof Error ? templatesError.message : "Error cargando plantillas"}
        </p>
      </div>
    )
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No hay plantillas para este agente.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-10">
      <div className="flex justify-end mb-6">
        <CreateTemplateModal
          trigger={
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva plantilla
            </Button>
          }
          agentId={agentId}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {templates.map((template: TemplateDetails | any) => {
          const header = (template?.components as any[])?.find((c: any) => c.type === "HEADER")
          const body = (template?.components as any[])?.find((c: any) => c.type === "BODY")
          const footer = (template?.components as any[])?.find((c: any) => c.type === "FOOTER")
          const buttons = (template?.components as any[])?.find((c: any) => c.type === "BUTTONS")

          return (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="truncate max-w-[200px]" title={template.name}>
                    {template.name}
                  </CardTitle>
                  <Badge
                    variant={
                      template.status === "APPROVED"
                        ? "default"
                        : template.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {template.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Idioma:</span> {template.language.toUpperCase()}
                </div>
                <div className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Categoría:</span> {template.category}
                </div>

                <Separator />

                <div className="flex-1">
                  <WhatsAppPreview
                    headerText={header?.text || ""}
                    bodyText={body?.text || ""}
                    footerText={footer?.text || ""}
                    buttons={buttons?.buttons?.map((b: any) => b.text) || []}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
