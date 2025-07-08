"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import type { Agent, AgentFormData } from "../types/agent";
import { Agent as PrismaAgent, Tool } from "@prisma/client";

export type AgentWithTools = PrismaAgent & { tools: Tool[] };

interface AgentContextType {
  selectedAgent: AgentWithTools | null;
  setSelectedAgent: (agent: AgentWithTools | null) => void;
  formData: any;
  setFormData: (formData: any) => void;
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
  resetForm: () => void;
  isCreatingNew: boolean;
  setIsCreatingNew: (creating: boolean) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

const defaultFormData: AgentFormData = {
  name: "",
  firstMessage: "",
  prompt: "",
  backgroundSound: "",
  voiceId: "",
};

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [selectedAgent, setSelectedAgent] = useState<AgentWithTools | null>(
    null,
  );
  const [originalFormData, setOriginalFormData] = useState<any>({});
  const [formData, setFormData] = useState<any>({
    name: "",
    firstMessage: "",
    prompt: "",
    backgroundSound: "off",
    voiceId: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (selectedAgent) {
      const initialData = {
        name: selectedAgent.name,
        firstMessage: selectedAgent.firstMessage || "",
        prompt: selectedAgent.prompt || "",
        backgroundSound: selectedAgent.backgroundSound || "off",
        voiceId: selectedAgent.voiceId || "",
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
      setIsCreatingNew(false);
      setHasChanges(false);
    } else {
      // Limpiar formulario si no hay agente seleccionado
      const blankForm = {
        name: "",
        firstMessage: "",
        prompt: "",
        backgroundSound: "off",
        voiceId: "",
      };
      setFormData(blankForm);
      setOriginalFormData(blankForm);
    }
  }, [selectedAgent]);

  const resetForm = () => {
    setFormData(originalFormData);
    setHasChanges(false);
  };

  return (
    <AgentContext.Provider
      value={{
        selectedAgent,
        setSelectedAgent,
        formData,
        setFormData,
        hasChanges,
        setHasChanges,
        resetForm,
        isCreatingNew,
        setIsCreatingNew,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
}
