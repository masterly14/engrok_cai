"use client"

import type { ChatContact } from "@prisma/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Bot, Search, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface ContactListProps {
  contacts: ChatContact[]
  onContactSelect: (contact: ChatContact) => void
  selectedContactId?: string
  agentName: string
}

export function ContactList({ contacts, onContactSelect, selectedContactId, agentName }: ContactListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  return (
    <div className="w-[300px] border-r bg-card flex flex-col h-screen">
      <div className="p-4 border-b cursor-pointer" onClick={() => router.back()}>
        <div className="flex items-center gap-2 mb-5">
          <ArrowLeft className="h-4 w-4" />
          <p>Volver</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-sky-700 to-slate-800 shadow-lg">
                <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
                <h2 className="text-base font-semibold">{agentName}</h2>
                <p className="text-xs text-muted-foreground">Conversaciones</p>
            </div>
        </div>
        <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
                placeholder="Buscar contacto..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => {
              const needsAttention = (contact as any).sessions?.some((s: any) => s.status === "NEEDS_ATTENTION")
              return (
                <button
                  key={contact.id}
                  onClick={() => onContactSelect(contact)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3",
                    selectedContactId === contact.id
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://avatar.vercel.sh/${contact.phone}.png`} />
                    <AvatarFallback>{contact.name ? contact.name.charAt(0).toUpperCase() : 'C'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate flex items-center gap-1">
                      {contact.name || contact.phone}
                      {needsAttention && <AlertCircle className="h-3 w-3 text-red-500" />}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Click para ver la conversación
                    </p>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">
                    {searchTerm ? "No se encontraron contactos" : "No hay contactos para este agente"}
                </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 