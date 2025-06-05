"use client"

import * as React from "react"
import { Plus, Search, PhoneCall, Users, Globe, Check } from "lucide-react"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/loading-spinner"
import { usePhoneNumber } from "@/context/number-context"
import { cn } from "@/lib/utils"
import { useAllPhoneNumbers } from "../../../../../../hooks/use-all-phone-numbers"

// Función para formatear números de teléfono según el país
const formatPhoneNumber = (phoneNumber: string): { formatted: string; country: string; flag: string } => {
  // Remover todos los caracteres no numéricos excepto el +
  const cleaned = phoneNumber.replace(/[^\d+]/g, "")

  // Detectar país por código
  const countryFormats: Record<string, { name: string; flag: string; format: (num: string) => string }> = {
    "+1": {
      name: "US/CA",
      flag: "🇺🇸",
      format: (num) => {
        const digits = num.slice(2) // Remover +1
        if (digits.length === 10) {
          return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
        }
        return num
      },
    },
    "+44": {
      name: "UK",
      flag: "🇬🇧",
      format: (num) => {
        const digits = num.slice(3) // Remover +44
        if (digits.length >= 10) {
          return `+44 ${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
        }
        return num
      },
    },
    "+34": {
      name: "ES",
      flag: "🇪🇸",
      format: (num) => {
        const digits = num.slice(3) // Remover +34
        if (digits.length === 9) {
          return `+34 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`
        }
        return num
      },
    },
    "+52": {
      name: "MX",
      flag: "🇲🇽",
      format: (num) => {
        const digits = num.slice(3) // Remover +52
        if (digits.length === 10) {
          return `+52 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
        }
        return num
      },
    },
    "+33": {
      name: "FR",
      flag: "🇫🇷",
      format: (num) => {
        const digits = num.slice(3) // Remover +33
        if (digits.length === 9) {
          return `+33 ${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`
        }
        return num
      },
    },
    "+49": {
      name: "DE",
      flag: "🇩🇪",
      format: (num) => {
        const digits = num.slice(3) // Remover +49
        if (digits.length >= 10) {
          return `+49 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
        }
        return num
      },
    },
  }

  // Buscar el código de país más largo que coincida
  const matchingCode = Object.keys(countryFormats)
    .sort((a, b) => b.length - a.length)
    .find((code) => cleaned.startsWith(code))

  if (matchingCode && countryFormats[matchingCode]) {
    const countryInfo = countryFormats[matchingCode]
    return {
      formatted: countryInfo.format(cleaned),
      country: countryInfo.name,
      flag: countryInfo.flag,
    }
  }

  // Formato por defecto si no se reconoce el país
  return {
    formatted: cleaned,
    country: "Unknown",
    flag: "🌍",
  }
}

export function Sidebar() {
  const { phoneData, phoneLoading, phoneError } = useAllPhoneNumbers()
  const { selectedPhoneNumber, setSelectedPhoneNumber, setIsCreatingNew } = usePhoneNumber()
  const [searchTerm, setSearchTerm] = React.useState("")

  // Filtrar números basado en el término de búsqueda
  const filteredPhoneNumbers = React.useMemo(() => {
    if (!Array.isArray(phoneData)) return []
    return phoneData.filter(
      (phone) =>
        phone.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatPhoneNumber(phone.number).formatted.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [phoneData, searchTerm])

  const handlePhoneNumberSelect = (phoneNumber: any) => {
    setSelectedPhoneNumber(phoneNumber)
    console.log("phoneNumber", phoneNumber)
    setIsCreatingNew(false)
  }

  const handleNewPhoneNumber = () => {
    setSelectedPhoneNumber(null)
    setIsCreatingNew(true)
    toast.info("Iniciando creación de nuevo número...")

    if (typeof window !== "undefined" && typeof window.openVoiceAgentTemplateDialog === "function") {
      try {
        window.openVoiceAgentTemplateDialog()
      } catch (error) {
        console.error("Error calling openVoiceAgentTemplateDialog:", error)
        toast.error("Error al intentar abrir el diálogo de plantilla.")
      }
    }
  }

  return (
    <div className="h-screen w-[280px] bg-white border-r border-gray-200 shadow-sm">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 shadow-sm">
              <PhoneCall className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">Números de Teléfono</h2>
              <p className="text-xs text-gray-500">Gestiona tus números</p>
            </div>
          </div>

          {/* Botón Nuevo */}
          
          <div className="px-4 pb-4">
            <Button
              onClick={handleNewPhoneNumber}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200 border-0"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Nuevo Número
              </Button>
            </div>

          {/* Buscador */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar números..."
                className="pl-9 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm rounded-lg text-gray-900 placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50/30">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                TUS NÚMEROS ({filteredPhoneNumbers.length})
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {phoneLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-sm text-gray-500 mt-3">Cargando números...</p>
                  </div>
                </div>
              ) : phoneError ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4 ring-1 ring-red-100">
                    <PhoneCall className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-red-600 text-center mb-1">Error al cargar números</p>
                  <p className="text-xs text-red-500 text-center">Intenta recargar la página</p>
                </div>
              ) : filteredPhoneNumbers.length > 0 ? (
                filteredPhoneNumbers.map((phone) => {
                  const phoneInfo = formatPhoneNumber(phone.number)
                  const isSelected = selectedPhoneNumber?.id === phone.id

                  return (
                    <div
                      key={phone.id}
                      onClick={() => handlePhoneNumberSelect(phone)}
                      className={cn(
                        "group relative p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                        isSelected
                          ? "bg-teal-50 border-teal-200 shadow-sm"
                          : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                            isSelected ? "bg-teal-600 shadow-sm" : "bg-gray-100 group-hover:bg-gray-200",
                          )}
                        >
                          <span className="text-base">{phoneInfo.flag}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className={cn(
                                "text-sm font-medium transition-colors",
                                isSelected ? "text-gray-900" : "text-gray-800",
                              )}
                            >
                              {phoneInfo.formatted}
                            </p>
                            {isSelected && <div className="h-2 w-2 rounded-full bg-teal-600 shadow-sm animate-pulse" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-gray-400" />
                            <p
                              className={cn(
                                "text-xs transition-colors",
                                isSelected ? "text-gray-600" : "text-gray-500",
                              )}
                            >
                              {phoneInfo.country} • {phone.provider || "Sin proveedor"}
                            </p>
                          </div>
                          {phone.assistantId && (
                            <div className="flex items-center gap-1 mt-1">
                              <Check className="h-3 w-3 text-teal-600" />
                              <p className="text-xs text-teal-600">Agente asignado</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                    <PhoneCall className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 text-center mb-2">
                    {searchTerm ? "No se encontraron números" : "No tienes números aún"}
                  </p>
                  <p className="text-xs text-gray-500 text-center mb-4">
                    {searchTerm
                      ? "Intenta con otro término de búsqueda"
                      : "Crea tu primer número de teléfono para comenzar"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
