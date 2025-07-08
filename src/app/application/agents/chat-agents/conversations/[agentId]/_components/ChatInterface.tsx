"use client";

import { useState } from "react";
import type {
  ChatAgent,
  ChatContact as PrismaChatContact,
  Message,
  ChatSession,
} from "@prisma/client";
import { ContactList } from "./ContactList";
import { ChatView } from "./ChatView";

interface ChatContactWithDetails extends PrismaChatContact {
  messages: Message[];
  sessions: ChatSession[];
}

type ChatInterfaceProps = {
  agent: ChatAgent;
  contacts: ChatContactWithDetails[];
};

export const ChatInterface = ({ agent, contacts }: ChatInterfaceProps) => {
  const [selectedContact, setSelectedContact] =
    useState<ChatContactWithDetails | null>(null);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <ContactList
        contacts={contacts}
        onContactSelect={setSelectedContact}
        selectedContactId={selectedContact?.id}
        agentName={agent.name}
      />
      <ChatView agent={agent} selectedContact={selectedContact} />
    </div>
  );
};
