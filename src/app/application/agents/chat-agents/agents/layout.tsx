"use client"

import React from "react"
import { ChatAgentProvider } from "@/context/chat-agent-context"

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return <ChatAgentProvider>{children}</ChatAgentProvider>
}
