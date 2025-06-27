"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { ChatAgentWithWorkflows } from "@/types/agent"

// Define the shape of the form data based on the ChatAgent model
export type ChatAgentFormData = {
  name: string
  isActive: boolean
  whatsappAccessToken: string
  whatsappBusinessAccountId: string
  whatsappPhoneNumber: string
  whatsappPhoneNumberId: string
  workflowId?: string | null
}

// Define the shape of the context
interface ChatAgentContextType {
  selectedChatAgent: ChatAgentWithWorkflows | null
  setSelectedChatAgent: (agent: ChatAgentWithWorkflows | null) => void
  formData: ChatAgentFormData
  setFormData: (formData: ChatAgentFormData) => void
  hasChanges: boolean
  resetForm: () => void
  isCreatingNew: boolean
  setIsCreatingNew: (isCreating: boolean) => void
}

const ChatAgentContext = createContext<ChatAgentContextType | undefined>(undefined)

// Initial form state
const initialFormDataState: ChatAgentFormData = {
  name: "",
  isActive: false,
  whatsappAccessToken: "",
  whatsappBusinessAccountId: "",
  whatsappPhoneNumber: "",
  whatsappPhoneNumberId: "",
  workflowId: null,
}

export const ChatAgentProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedChatAgent, setSelectedChatAgent] = useState<ChatAgentWithWorkflows | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false)
  const [formData, setFormData] = useState<ChatAgentFormData>(initialFormDataState)
  const [initialFormData, setInitialFormData] = useState<ChatAgentFormData>(initialFormDataState)

  useEffect(() => {
    if (selectedChatAgent && !isCreatingNew) {
      const agentData = {
        name: selectedChatAgent.name,
        isActive: selectedChatAgent.isActive,
        whatsappAccessToken: selectedChatAgent.whatsappAccessToken || "",
        whatsappBusinessAccountId: selectedChatAgent.whatsappBusinessAccountId || "",
        whatsappPhoneNumber: selectedChatAgent.whatsappPhoneNumber || "",
        whatsappPhoneNumberId: selectedChatAgent.whatsappPhoneNumberId || "",
        workflowId: selectedChatAgent.workflows.find(w => w.agentId === selectedChatAgent.id)?.id || null
      }
      setFormData(agentData)
      setInitialFormData(agentData)
    } else {
      setFormData(initialFormDataState)
      setInitialFormData(initialFormDataState)
    }
  }, [selectedChatAgent, isCreatingNew])

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData)

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
  }, [initialFormData])

  const contextValue = {
    selectedChatAgent,
    setSelectedChatAgent,
    formData,
    setFormData,
    hasChanges,
    resetForm,
    isCreatingNew,
    setIsCreatingNew,
  }

  return <ChatAgentContext.Provider value={contextValue}>{children}</ChatAgentContext.Provider>
}

export const useChatAgent = () => {
  const context = useContext(ChatAgentContext)
  if (context === undefined) {
    throw new Error("useChatAgent must be used within a ChatAgentProvider")
  }
  return context
} 