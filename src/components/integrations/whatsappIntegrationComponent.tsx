"use client"

import { useAllChatAgents } from "@/hooks/use-all-chat-agents"
import { useAgentMessageTemplates } from "@/hooks/use-message-templates"
import { useState } from "react"
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "../ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card"
import { Badge } from "../ui/badge"
import type { ChatAgent } from "@prisma/client"
import { MessageSquare, Bot, FileText, Globe, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "../ui/button"

type Props = {
  setIntegrationConnection: (isConnected: boolean) => void
}

const WhatsAppIntegrationComponent = ({ setIntegrationConnection }: Props) => {
  const [selectedChatAgent, setSelectedChatAgent] = useState<ChatAgent | null>(null)
  const { chatAgentsData } = useAllChatAgents()
  const { templates } = useAgentMessageTemplates(selectedChatAgent?.id)

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case "pending":
        return <Clock className="h-3 w-3 text-yellow-600" />
      default:
        return <AlertCircle className="h-3 w-3 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Estado cuando no hay agentes
  if (!chatAgentsData?.data.length) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <Bot className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-gray-900">No hay agentes disponibles</CardTitle>
          <CardDescription className="text-gray-600">
            Necesitas crear al menos un agente de chat para usar esta integración
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="w-full max-w-2xl mx-auto border-green-200 bg-green-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-green-800">Integración WhatsApp</CardTitle>
              <CardDescription className="text-green-600">
                Envía plantillas de mensaje a través de WhatsApp Business
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Agent Selection Card */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Seleccionar Agente de Chat
          </CardTitle>
          <CardDescription>Elige uno de tus agentes de chat para enviar plantillas de mensaje</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            onValueChange={(value: string) =>
              setSelectedChatAgent(chatAgentsData?.data.find((agent) => agent.id === value) || null)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`${selectedChatAgent?.name || "Selecciona un agente de chat"}`} />
            </SelectTrigger>
            <SelectContent>
              {chatAgentsData?.data.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-500" />
                    {agent.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Templates Card */}
      {selectedChatAgent && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Plantillas Disponibles
            </CardTitle>
            <CardDescription>
              Plantillas de mensaje para el agente: <strong>{selectedChatAgent.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templates?.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No hay plantillas disponibles</p>
                <p className="text-sm text-gray-500 mt-1">Este agente no tiene plantillas configuradas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates?.map((template) => (
                  <Card key={template.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              {template.language}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${getStatusColor(template.status)}`}>
                              {getStatusIcon(template.status)}
                              <span className="ml-1 capitalize">{template.status}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {template.components && (
                        <>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Componentes del mensaje:</h4>
                          {(
                            template.components as Array<{
                              id: string
                              type: string
                              text: string
                            }>
                          ).map((component) => (
                            <div key={component.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {component.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{component.text}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default WhatsAppIntegrationComponent
