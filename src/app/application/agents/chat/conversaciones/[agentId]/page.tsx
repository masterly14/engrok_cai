"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, MessageSquare, Send, User, Bot, MoreVertical, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useAgentConversations } from "@/hooks/use-conversations"
import { useContactMessages } from "@/hooks/use-messages"
import { sendMessage } from "@/actions/conversations"
import { sendMediaMessage } from "@/actions/media"
import { CreateUpdateLead } from "@/actions/crm"
import { useAllLeads } from "@/hooks/use-all-leads"
import { AddLeadModal } from "@/components/application/crm/add-lead-modal"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Pusher from "pusher-js"
import Image from "next/image"
import { LeadDetailModal } from "@/components/application/crm/lead-detail-modal"
import type { Lead } from "@/lib/data"

export default function ConversationsPage() {
  const { agentId } = useParams<{ agentId: string }>()
  console.log(agentId)
  const router = useRouter()
  const queryClient = useQueryClient()

  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isBotActive, setIsBotActive] = useState(true)
  const [showAddLead, setShowAddLead] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showLeadDetailModal, setShowLeadDetailModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  // Obtener conversaciones del agente
  const { conversationsData, conversationsLoading } = useAgentConversations(agentId)
  console.log(conversationsData)

  // Cuando las conversaciones carguen, seleccionamos la primera por defecto (si no hay ya seleccionada)
  useEffect(() => {
    if (!selectedContactId && conversationsData?.data?.length) {
      setSelectedContactId(conversationsData.data[0].id)
    }
  }, [conversationsData, selectedContactId])

  // Obtener mensajes de la conversación seleccionada
  const { messagesData, messagesLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useContactMessages(
    selectedContactId ?? undefined,
  )

  // Mutación para enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedContactId) return
      await sendMessage(agentId, selectedContactId, content)
    },
    onSuccess: () => {
      // Limpiar input y refrescar mensajes
      setMessage("")
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedContactId],
      })
    },
  })

  const handleSendMessage = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim())
    }
  }

  const formatTime = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Obtiene info del agente para mostrar nombre/estado de activación
  // Por simplicidad, tomamos de la primera conversación (asumiendo que existe)
  const agentIsActive = true // TODO: traer de la base de datos si es necesario
  const agentName = conversationsData?.data?.[0]?.contact || ""

  // Suscribirse a Pusher para actualizaciones en tiempo real
  useEffect(() => {
    // Evitamos la suscripción si no hay credenciales
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return

    // Inicializar Pusher del lado cliente
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "mt1",
    })

    const channel = pusher.subscribe("whatsapp-messages")

    const handleNewMessage = (data: any) => {
      // Refrescamos mensajes del contacto activo y la lista de conversaciones
      if (selectedContactId) {
        queryClient.invalidateQueries({
          queryKey: ["messages", selectedContactId],
        })
      }
      queryClient.invalidateQueries({ queryKey: ["conversations", agentId] })
      queryClient.invalidateQueries({ queryKey: ["leads"] })
    }

    channel.bind("new-message", handleNewMessage)

    return () => {
      channel.unbind("new-message", handleNewMessage)
      pusher.unsubscribe("whatsapp-messages")
      pusher.disconnect()
    }
  }, [selectedContactId, agentId, queryClient])

  // Leads & CRM data
  const [showLeadInfo, setShowLeadInfo] = useState(false)
  const { leadsData, stagesData, tagsData } = useAllLeads(showLeadInfo || showAddLead || showLeadDetailModal)

  // Lead linked to current conversation
  const selectedConversation = conversationsData?.data?.find((c) => c.id === selectedContactId)
  const currentPhone = selectedConversation?.phoneNumber
  const currentLead: Lead | null = (leadsData?.find((l: any) => l.phone === currentPhone) as Lead) || null

  // Mutación para crear lead
  const addLeadMutation = useMutation({
    mutationFn: async (lead: any) => {
      return await CreateUpdateLead(lead as any)
    },
    onSuccess: () => {
      setShowAddLead(false)
      queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
  })

  const handleAddLead = (lead: any) => {
    addLeadMutation.mutate(lead)
  }

  const handleUpdateLead = (lead: Lead) => {
    // Simply close the modal, the LeadDetailModal already invalidates queries
    setShowLeadDetailModal(false)
    setSelectedLead(null)
  }

  // Mutación para enviar medios
  const sendMediaMutation = useMutation({
    mutationFn: async ({
      fileUrl,
      type,
    }: {
      fileUrl: string
      type: "IMAGE" | "DOCUMENT"
    }) => {
      if (!selectedContactId) return
      await sendMediaMessage(agentId, selectedContactId, fileUrl, type)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedContactId],
      })
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    const file = files[0]
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const isImage = file.type.startsWith("image/")
      sendMediaMutation.mutate({
        fileUrl: result,
        type: isImage ? "IMAGE" : "DOCUMENT",
      })
    }
    reader.readAsDataURL(file)
    // limpiamos
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSendImageMessage = async () => {
    if (imagePreview && !sendMediaMutation.isPending) {
      sendMediaMutation.mutate({ fileUrl: imagePreview, type: "IMAGE" })
      setImagePreview(null)
    }
  }

  // Función para hacer scroll al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Efecto para hacer scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom()
    }
  }, [messagesData?.data, shouldScrollToBottom])

  // Función para manejar el scroll y detectar cuando se llega al top
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget

    // Si el usuario está cerca del final, activamos el auto-scroll
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShouldScrollToBottom(isNearBottom)

    // Si el usuario hace scroll hasta arriba, cargamos más mensajes
    if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      const previousScrollHeight = scrollHeight
      fetchNextPage().then(() => {
        // Mantenemos la posición del scroll después de cargar mensajes antiguos
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight
            messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight
          }
        }, 100)
      })
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/")} className="mr-2">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Conversaciones: {agentName || "Agente"}</h1>
          <Badge variant={agentIsActive ? "default" : "outline"} className="ml-3">
            {agentIsActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lista de conversaciones */}
          <div className="md:col-span-1">
            <Card className="h-[calc(100vh-150px)] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare size={18} className="mr-2 text-primary" />
                  Conversaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto">
                {conversationsLoading ? (
                  <p className="text-center text-muted-foreground">Cargando...</p>
                ) : (
                  <div className="space-y-2">
                    {conversationsData?.data?.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border ${
                          selectedContactId === conv.id
                            ? "border-border bg-muted"
                            : "border-transparent hover:border-border"
                        }`}
                        onClick={() => setSelectedContactId(conv.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{conv.contact}</div>
                          <div className="text-xs text-muted-foreground">{formatTime(conv.timestamp)}</div>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">{conv.lastMessage}</div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-xs text-muted-foreground">{conv.phoneNumber}</div>
                          {conv.unread > 0 && <Badge>{conv.unread}</Badge>}
                        </div>
                      </div>
                    ))}
                    {conversationsData?.data?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center">Sin conversaciones</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mensajes de la conversación */}
          <div className="md:col-span-2">
            <Card className="h-[calc(100vh-150px)] flex flex-col overflow-hidden">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-primary" />
                    <span>{conversationsData?.data?.find((c) => c.id === selectedContactId)?.contact || ""}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {conversationsData?.data?.find((c) => c.id === selectedContactId)?.phoneNumber || ""}
                    </span>
                    {/* Lead info */}
                    {(() => {
                      if (!showLeadInfo) {
                        return (
                          <Button variant="ghost" size="sm" onClick={() => setShowLeadInfo(true)} className="ml-2">
                            Ver info de lead
                          </Button>
                        )
                      }

                      const phone = conversationsData?.data?.find((c) => c.id === selectedContactId)?.phoneNumber
                      const lead = leadsData?.find((l: any) => l.phone === phone)
                      if (!lead) return null

                      const stage = stagesData.find((s: any) => s.id === lead.status || s.id === lead.stageId)

                      return (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-muted text-xs flex items-center gap-1">
                          {stage && (
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                          )}
                          {lead.company || "Lead"}
                        </span>
                      )
                    })()}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Bot / Human switch */}
                    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                      <Bot className={`h-4 w-4 ${isBotActive ? "text-primary" : "text-muted-foreground"}`} />
                      <Switch checked={isBotActive} onCheckedChange={setIsBotActive} aria-label="Toggle chatbot" />
                      <User className={`h-4 w-4 ${!isBotActive ? "text-primary" : "text-muted-foreground"}`} />
                    </div>

                    {/* Contact actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {currentLead ? (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLead(currentLead!)
                              setShowLeadDetailModal(true)
                            }}
                          >
                            Editar Lead
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setShowAddLead(true)}>
                            Agregar como Lead
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsBotActive((prev) => !prev)}>
                          {isBotActive ? "Desactivar Chatbot" : "Activar Chatbot"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent
                ref={messagesContainerRef}
                className="flex-grow overflow-y-auto overflow-x-hidden p-4"
                onScroll={handleScroll}
              >
                {messagesLoading ? (
                  <p className="text-center text-muted-foreground">Cargando...</p>
                ) : (
                  <div className="space-y-4">
                    {isFetchingNextPage && (
                      <div className="flex justify-center py-2">
                        <div className="text-sm text-muted-foreground">Cargando mensajes antiguos...</div>
                      </div>
                    )}

                    {messagesData?.data?.map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}>
                        <div
                          className={`max-w-[80%] min-w-0 rounded-lg p-3 break-words ${
                            msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <div className="text-sm break-words overflow-wrap-anywhere">{msg.content}</div>
                          <div
                            className={`text-xs mt-1 text-right ${
                              msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {messagesData?.data?.length === 0 && (
                      <p className="text-center text-muted-foreground">No hay mensajes todavía.</p>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t p-3 overflow-hidden">
                <div className="flex w-full items-center flex-col space-y-2">
                  {imagePreview && (
                    <div className="relative rounded-md overflow-hidden border border-border max-w-full">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="h-20 object-contain max-w-full"
                        width={80}
                        height={80}
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={() => setImagePreview(null)}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-shrink-0"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Input
                      placeholder={isBotActive ? "Escribe un mensaje..." : "Mensaje al agente humano..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-grow min-w-0"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSendMessage()
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending}
                      className="flex-shrink-0"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
            {/* Modal Agregar Lead */}
            <AddLeadModal
              open={showAddLead}
              tags={tagsData}
              stages={stagesData}
              onClose={() => setShowAddLead(false)}
              onAdd={handleAddLead}
            />

            {/* Modal Editar Lead */}
            {(currentLead || selectedLead) && (
              <LeadDetailModal
                open={showLeadDetailModal}
                lead={selectedLead || currentLead}
                tags={tagsData}
                stages={stagesData}
                onClose={() => setShowLeadDetailModal(false)}
                onUpdate={handleUpdateLead}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

