"use client"

import { useState } from "react"
import type { ChatAgent, ChatContact } from "@prisma/client"
import { ContactList } from "./ContactList"
import { ChatView } from "./ChatView"

type ChatInterfaceProps = {
    agent: ChatAgent,
    contacts: ChatContact[]
}

export const ChatInterface = ({ agent, contacts }: ChatInterfaceProps) => {
    const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null)

    return (
        <div className="flex h-screen bg-background text-foreground">
            <ContactList 
                contacts={contacts}
                onContactSelect={setSelectedContact}
                selectedContactId={selectedContact?.id}
                agentName={agent.name}
            />
            <ChatView 
                agent={agent}
                selectedContact={selectedContact}
            />
        </div>
    )
} 