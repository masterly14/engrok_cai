"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { PhoneNumber } from "@prisma/client"

interface PhoneNumberContextType {
  selectedPhoneNumber: PhoneNumber | null
  setSelectedPhoneNumber: (phoneNumber: PhoneNumber | null) => void
  formData: any
  setFormData: (data: any) => void
  hasChanges: boolean
  resetForm: () => void
  isCreatingNew: boolean
  setIsCreatingNew: (creating: boolean) => void
}

const PhoneNumberContext = createContext<PhoneNumberContextType | undefined>(undefined)

const defaultFormData = {
  provider: "",
  number: "",
  assistantId: "",
  name: "",
  credentialId: "",
  twilioAccountSid: "",
  twilioAuthToken: "",
  vonageApiKey: "",
  vonageApiSecret: "",
  vapiNumberDesiredAreaCode: "",
  callType: "",
  vapiSipUri: "",
  vapiSipUsername: "",
  vapiSipPassword: "",
  extension: "",
}

export function PhoneNumberProvider({ children }: { children: React.ReactNode }) {
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<any | null>(null)
  const [formData, setFormData] = useState<any>(defaultFormData)
  const [originalData, setOriginalData] = useState<any>(defaultFormData)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Detectar si hay cambios comparando con los datos originales
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)

  // Cuando se selecciona un agente, cargar sus datos en el formulario
  useEffect(() => {
    if (selectedPhoneNumber) {
      const phoneNumberFormData: any = {
        provider: selectedPhoneNumber.provider,
        number: selectedPhoneNumber.number,
        assistantId: selectedPhoneNumber.assistantId,
        workflowId: selectedPhoneNumber.workflowId,
        extension: selectedPhoneNumber.extension,
        name: selectedPhoneNumber.name,
        credentialId: selectedPhoneNumber.credentialId,
        twilioAccountId: selectedPhoneNumber.twilioAccountId,
        twilioAuthToken: selectedPhoneNumber.twilioAuthToken,
        vonageApiKey: selectedPhoneNumber.vonageApiKey,
        vonageApiSecret: selectedPhoneNumber.vonageApiSecret,
        callType: selectedPhoneNumber.callType,
      }
      setFormData(phoneNumberFormData)
      setOriginalData(phoneNumberFormData)
      setIsCreatingNew(false) // Si se selecciona un agente, no estamos creando uno nuevo
    } else if (isCreatingNew) {
      // Solo resetear el formulario si estamos explícitamente creando uno nuevo
      setFormData(defaultFormData)
      setOriginalData(defaultFormData)
    }
  }, [selectedPhoneNumber, isCreatingNew])

  const resetForm = () => {
    if (selectedPhoneNumber) {
      const phoneNumberFormData: any = {
        provider: selectedPhoneNumber.provider,
        number: selectedPhoneNumber.number,
        assistantId: selectedPhoneNumber.assistantId,
        workflowId: selectedPhoneNumber.workflowId,
        name: selectedPhoneNumber.name,
        credentialId: selectedPhoneNumber.credentialId,
        twilioAccountSid: selectedPhoneNumber.twilioAccountSid,
        twilioAuthToken: selectedPhoneNumber.twilioAuthToken,
        vonageApiKey: selectedPhoneNumber.vonageApiKey,
        vonageApiSecret: selectedPhoneNumber.vonageApiSecret,
        callType: selectedPhoneNumber.callType,
        extension: selectedPhoneNumber.extension,
        vapiId: selectedPhoneNumber.vapiId,
      }

      setFormData(phoneNumberFormData)
      setOriginalData(phoneNumberFormData)
    } else {
      setFormData(defaultFormData)
      setOriginalData(defaultFormData)
    }
    setIsCreatingNew(false) // Al resetear, ya no estamos creando
  }

  return (
    <PhoneNumberContext.Provider
      value={{
        selectedPhoneNumber,
        setSelectedPhoneNumber,
        formData,
        setFormData,
        hasChanges,
        resetForm,
        isCreatingNew,
        setIsCreatingNew,
      }}
    >
      {children}
    </PhoneNumberContext.Provider>
  )
}

export function usePhoneNumber() {
  const context = useContext(PhoneNumberContext)
  if (context === undefined) {
    throw new Error("usePhoneNumber must be used within a PhoneNumberProvider")
  }
  return context
}
