"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { Squad } from "@prisma/client";

interface SquadContextType {
  selectedSquad: Squad | null;
  setSelectedSquad: (squad: Squad | null) => void;
  formData: SquadFormData;
  setFormData: (data: SquadFormData) => void;
  hasChanges: boolean;
  resetForm: () => void;
  isCreatingNew: boolean;
  setIsCreatingNew: (creating: boolean) => void;
}

export interface SquadFormData {
  name: string;
}

const SquadContext = createContext<SquadContextType | undefined>(undefined);

const defaultFormData: SquadFormData = {
  name: "",
};

export function SquadProvider({ children }: { children: React.ReactNode }) {
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [formData, setFormData] = useState<SquadFormData>(defaultFormData);
  const [originalData, setOriginalData] = useState<SquadFormData>(defaultFormData);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    if (selectedSquad) {
      const squadFormData: SquadFormData = {
        name: selectedSquad.name,
      };
      setFormData(squadFormData);
      setOriginalData(squadFormData);
      setIsCreatingNew(false);
    } else if (isCreatingNew) {
      setFormData(defaultFormData);
      setOriginalData(defaultFormData);
    }
  }, [selectedSquad, isCreatingNew]);

  const resetForm = () => {
    if (selectedSquad) {
      const squadFormData: SquadFormData = {
        name: selectedSquad.name,
      };
      setFormData(squadFormData);
      setOriginalData(squadFormData);
    } else {
      setFormData(defaultFormData);
      setOriginalData(defaultFormData);
    }
    setIsCreatingNew(false);
  };

  return (
    <SquadContext.Provider
      value={{
        selectedSquad,
        setSelectedSquad,
        formData,
        setFormData,
        hasChanges,
        resetForm,
        isCreatingNew,
        setIsCreatingNew,
      }}
    >
      {children}
    </SquadContext.Provider>
  );
}

export function useSquad() {
  const context = useContext(SquadContext);
  if (context === undefined) {
    throw new Error("useSquad must be used within a SquadProvider");
  }
  return context;
} 