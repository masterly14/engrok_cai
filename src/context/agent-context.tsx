"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Agent, AgentFormData } from "../types/agent"

interface AgentContextType {
  selectedAgent: Agent | null
  setSelectedAgent: (agent: Agent | null) => void
  formData: AgentFormData
  setFormData: (data: AgentFormData) => void
  hasChanges: boolean
  resetForm: () => void
  isCreatingNew: boolean
  setIsCreatingNew: (creating: boolean) => void
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

const defaultFormData: AgentFormData = {
  name: "",
  firstMessage: "",
  prompt: "",
  backgroundSound: "",
  voiceId: "",
  language: "multi",
}

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState<AgentFormData>(defaultFormData)
  const [originalData, setOriginalData] = useState<AgentFormData>(defaultFormData)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Detectar si hay cambios comparando con los datos originales
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)

  // Cuando se selecciona un agente, cargar sus datos en el formulario
  useEffect(() => {
    if (selectedAgent) {
      const agentFormData: AgentFormData = {
        name: selectedAgent.name,
        firstMessage: selectedAgent.firstMessage,
        prompt: selectedAgent.prompt,
        backgroundSound: selectedAgent.backgroundSound || "",
        voiceId: selectedAgent.voiceId || "",
        language: "multi",
      }
      setFormData(agentFormData)
      setOriginalData(agentFormData)
      setIsCreatingNew(false) // Si se selecciona un agente, no estamos creando uno nuevo
    } else if (isCreatingNew) {
      // Solo resetear el formulario si estamos explícitamente creando uno nuevo
      setFormData(defaultFormData)
      setOriginalData(defaultFormData)
    }
  }, [selectedAgent, isCreatingNew])

  const resetForm = () => {
    if (selectedAgent) {
      const agentFormData: AgentFormData = {
        name: selectedAgent.name,
        firstMessage: selectedAgent.firstMessage,
        prompt: selectedAgent.prompt,
        backgroundSound: selectedAgent.backgroundSound || "",
        voiceId: selectedAgent.voiceId || "",
        language: "multi",
      }
      setFormData(agentFormData)
      setOriginalData(agentFormData)
    } else {
      setFormData(defaultFormData)
      setOriginalData(defaultFormData)
    }
    setIsCreatingNew(false) // Al resetear, ya no estamos creando
  }

  return (
    <AgentContext.Provider
      value={{
        selectedAgent,
        setSelectedAgent,
        formData,
        setFormData,
        hasChanges,
        resetForm,
        isCreatingNew,
        setIsCreatingNew,
      }}
    >
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const context = useContext(AgentContext)
  if (context === undefined) {
    throw new Error("useAgent must be used within an AgentProvider")
  }
  return context
}
