"use client"

import type { ChatAgent, ChatContact, Message } from "@prisma/client"
import { useEffect, useState, useRef, type ReactNode } from "react"
import {
  getMessagesForConversation,
  sendManualMessage,
} from "@/actions/conversations"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User, MessageSquare, Paperclip } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { cn } from "@/lib/utils"
import Pusher from "pusher-js"
import { toast } from "sonner"
import { uploadAudioAction, uploadFile } from "@/actions/upload-audio"

interface ChatViewProps {
  agent: ChatAgent
  selectedContact: ChatContact | null
}

export function ChatView({ agent, selectedContact }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [session, setSession] = useState<{ id: string; status: "ACTIVE" | "COMPLETED" | "NEEDS_ATTENTION" } | null>(null)

  useEffect(() => {
    if (selectedContact) {
      setLoading(true)
      getMessagesForConversation(agent.id, selectedContact.phone)
        .then(setMessages)
        .finally(() => setLoading(false))
    } else {
      setMessages([])
    }
  }, [selectedContact, agent.id])

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "div[data-radix-scroll-area-viewport]"
      )
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages, loading])

  useEffect(() => {
    if (selectedContact) {
      // Fetch current session for this contact
      fetch(`/api/chat/sessions?agentId=${agent.id}&contactId=${selectedContact.id}`)
        .then((res) => res.json())
        .then((data) => {
          setSession(data.session)
        })
        .catch(() => {})
    } else {
      setSession(null)
    }
  }, [selectedContact, agent.id])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedContact || isSending) return

    setIsSending(true)
    const messageToSend = newMessage
    setNewMessage("")

    const result = await sendManualMessage({
      agentId: agent.id,
      contactId: selectedContact.id,
      type: "text",
      text: messageToSend,
    })

    setIsSending(false)

    if (result.error) {
      toast.error(result.error)
      setNewMessage(messageToSend) // Restore message on error
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedContact || isSending) return

    setIsSending(true)

    try {
      let uploadResult: { success: boolean; url?: string; resourceType?: string; error?: string }
      let messageType: "audio" | "image" | "video" | "document" = "document"

      if (file.type.startsWith("audio")) {
        const fd = new FormData()
        fd.append("audioFile", file)
        uploadResult = await uploadAudioAction(fd)
        messageType = "audio"
      } else if (file.type.startsWith("image")) {
        const fd = new FormData()
        fd.append("image", file)
        uploadResult = await uploadFile(fd)
        messageType = "image"
      } else if (file.type.startsWith("video")) {
        const fd = new FormData()
        fd.append("video", file)
        uploadResult = await uploadFile(fd)
        messageType = "video"
      } else {
        const fd = new FormData()
        fd.append("file", file)
        uploadResult = await uploadFile(fd)
        messageType = "document"
      }

      if (!uploadResult.success || !uploadResult.url) {
        toast.error(uploadResult.error || "Error uploading file")
        return
      }

      const result = await sendManualMessage({
        agentId: agent.id,
        contactId: selectedContact.id,
        type: messageType,
        mediaUrl: uploadResult.url,
        text: newMessage.trim() || undefined,
        fileName: file.name,
      } as any)

      if (result.error) {
        toast.error(result.error)
      } else {
        // Clear caption after successful send
        setNewMessage("")
      }
    } catch (error: any) {
      toast.error(error.message || "Error sending file")
    } finally {
      setIsSending(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    if (!selectedContact) {
      return
    }
    if (
      !process.env.NEXT_PUBLIC_PUSHER_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      console.error("Pusher client environment variables are missing.")
      return
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    })

    const channelName = `conversation-${agent.id}-${selectedContact.id}`
    const channel = pusher.subscribe(channelName)

    const handleNewMessage = (newMessage: Message) => {
      setMessages((prevMessages) => {
        if (prevMessages.some((msg) => msg.id === newMessage.id)) {
          return prevMessages
        }
        return [...prevMessages, newMessage]
      })
    }

    channel.bind("new-message", handleNewMessage)

    return () => {
      channel.unbind("new-message", handleNewMessage)
      pusher.unsubscribe(channelName)
    }
  }, [agent.id, selectedContact])

  const toggleSessionStatus = async () => {
    if (!session) return
    const newStatus = session.status === "COMPLETED" ? "ACTIVE" : "COMPLETED"
    const res = await fetch(`/api/chat/sessions/${session.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const { session: updated } = await res.json()
      setSession(updated)
    } else {
      toast.error("Error actualizando la sesión")
    }
  }

  // Listen for session status updates via Pusher
  useEffect(() => {
    if (!session) return
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) return

    const p = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    })
    const ch = p.subscribe(`conversation-${agent.id}-${selectedContact?.id}`)
    const cb = (payload: { status: string }) => {
      setSession((prev) => (prev ? { ...prev, status: payload.status as any } : prev))
    }
    ch.bind("session-status", cb)
    return () => {
      ch.unbind("session-status", cb)
      p.unsubscribe(`conversation-${agent.id}-${selectedContact?.id}`)
    }
  }, [session, agent.id, selectedContact])

  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-muted/50">
        <MessageSquare className="w-16 h-16 text-muted-foreground/50" />
        <h2 className="mt-4 text-xl font-semibold text-muted-foreground">
          Selecciona un contacto
        </h2>
        <p className="text-muted-foreground">
          Elige una conversación de la lista para ver los mensajes.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <header className="p-4 border-b bg-card flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={`https://avatar.vercel.sh/${selectedContact.phone}.png`}
            />
            <AvatarFallback>
              {selectedContact.name ? selectedContact.name.charAt(0).toUpperCase() : "C"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">
              {selectedContact.name || selectedContact.phone}
            </h3>
            <p className="text-xs text-muted-foreground">Chat con {agent.name}</p>
          </div>
        </div>
        {session && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs px-2 py-1 rounded",
                session.status === "ACTIVE" && "bg-green-100 text-green-800",
                session.status === "COMPLETED" && "bg-gray-200 text-gray-700",
                session.status === "NEEDS_ATTENTION" && "bg-yellow-100 text-yellow-800"
              )}
            >
              {session.status}
            </span>
            <Button size="sm" variant="outline" onClick={toggleSessionStatus}>
              {session.status === "COMPLETED" ? "Reabrir" : "Cerrar"}
            </Button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                No hay mensajes en esta conversación.
              </div>
            ) : (
              messages.map((message) => {
                const isAgent = message.from !== selectedContact.phone
                // Determine media URL if exists
                const meta: any = message.metadata || {}
                let renderedContent: ReactNode = null

                switch (message.type) {
                  case "IMAGE":
                    renderedContent = (
                      <img src={meta.image?.link || message.textBody} alt="imagen" className="max-w-xs rounded" />
                    )
                    break
                  case "AUDIO":
                    renderedContent = (
                      <audio controls src={meta.audio?.link || message.textBody} className="max-w-xs" />
                    )
                    break
                  case "VIDEO":
                    renderedContent = (
                      <video controls src={meta.video?.link || message.textBody} className="max-w-xs rounded" />
                    )
                    break
                  case "DOCUMENT": {
                    const docUrl = meta.document?.link || message.textBody
                    renderedContent = (
                      <a href={docUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                        {meta.document?.filename || "Documento"}
                      </a>
                    )
                    break
                  }
                  case "BUTTON": {
                    // WhatsApp quick reply result or template reply
                    const buttonText = meta?.button?.text ?? message.textBody
                    renderedContent = <p>{buttonText}</p>
                    break
                  }
                  case "INTERACTIVE": {
                    // Distinguish between interactive payloads: template messages or interactive buttons
                    if (meta?.interactive) {
                      const interactive = meta.interactive as any
                      if (interactive.type === "button") {
                        const headerImg = interactive.header?.image?.link ?? undefined
                        const bodyText = interactive.body?.text ?? message.textBody

                        renderedContent = (
                          <div className="space-y-2">
                            {headerImg && (
                              <img
                                src={headerImg}
                                alt="header"
                                className="max-w-xs rounded"
                              />
                            )}
                            {bodyText && <p>{bodyText}</p>}
                            {Array.isArray(interactive.action?.buttons) && (
                              <div className="flex flex-col space-y-1 mt-2">
                                {interactive.action.buttons.map((btn: any) => (
                                  <button
                                    key={btn.reply?.id || btn.title}
                                    className="px-3 py-1 rounded bg-background border text-foreground text-sm hover:bg-muted transition-colors"
                                    disabled
                                  >
                                    {btn.reply?.title || btn.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      } else if (interactive.type === "button_reply") {
                        renderedContent = <p>{interactive.button_reply?.title || message.textBody}</p>
                      } else {
                        renderedContent = <p>{message.textBody}</p>
                      }
                    } else if (meta?.template) {
                      const template = meta.template as any
                      const headerParam = template.components?.find((c: any) => c.type === "header")?.parameters?.[0]?.text
                      const bodyParams = template.components?.find((c: any) => c.type === "body")?.parameters ?? []
                      const bodyText = bodyParams.map((p: any) => p.text).join(" ")
                      const buttons = template.components?.filter((c: any) => c.type === "button") ?? []

                      renderedContent = (
                        <div className="space-y-2">
                          {headerParam && <p className="font-semibold">{headerParam}</p>}
                          {bodyText && <p>{bodyText}</p>}
                          {buttons.length > 0 && (
                            <div className="flex flex-col space-y-1 mt-2">
                              {buttons.map((btn: any) => (
                                <button
                                  key={btn.index}
                                  className="px-3 py-1 rounded bg-background border text-foreground text-sm hover:bg-muted transition-colors"
                                  disabled
                                >
                                  {btn.parameters?.[0]?.payload || `Opción ${btn.index}`}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    } else {
                      renderedContent = <p>{message.textBody}</p>
                    }
                    break
                  }
                  default:
                    renderedContent = <p>{message.textBody}</p>
                }

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end gap-2",
                      isAgent ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isAgent && (
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={`https://avatar.vercel.sh/${selectedContact.phone}.png`} />
                        <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-md p-3 rounded-2xl text-sm",
                        !isAgent
                          ? "bg-muted rounded-bl-none"
                          : "bg-blue-600 text-primary-foreground rounded-br-none"
                      )}
                    >
                      {renderedContent}
                      <p
                        className={cn(
                          "text-xs mt-1 text-right",
                          !isAgent ? "text-muted-foreground" : "text-blue-200"
                        )}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {isAgent && (
                       <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      <footer className="p-4 border-t bg-card">
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            // Accept common types
            accept="audio/*,video/mp4,video/3gpp,image/*,application/pdf"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Input
            placeholder="Escribe un mensaje... (opcional)"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8"
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </footer>
    </div>
  )
}