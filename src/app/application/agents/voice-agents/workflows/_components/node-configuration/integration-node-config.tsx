"use client"

import Image from "next/image"
import type { NodeConfigurationProps } from "./types"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import IntegrationComponent from "@/components/nango/integrationComponent"    
import NativeCrmIntegrationComponent from "@/components/integrations/nativeCrmIntegrationComponent"

const integrations = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    logo: "/integrations-logos-providers/whatsapp.webp",
    color: "bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300",
    textColor: "text-green-700",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    logo: "/integrations-logos-providers/google-calendar.png",
    color: "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300",
    textColor: "text-blue-700",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    logo: "/integrations-logos-providers/google-sheets.webp",
    color: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300",
    textColor: "text-emerald-700",
  },
  {
    id: "cal-com",
    name: "Cal.com",
    logo: "/integrations-logos-providers/cal-logo.jpg",
    color: "bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-300",
    textColor: "text-purple-700",
  },
  {
    id: "hubspot",
    name: "Hubspot",
    logo: "/integrations-logos-providers/hubspot.webp",
    color: "bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-300",
    textColor: "text-orange-700",
  },
  {
    id: "airtable",
    name: "Airtable",
    logo: "/integrations-logos-providers/airtable.png",
    color: "bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300",
    textColor: "text-red-700",
  },
  {
    id: "engrok",
    name: "Engrok Local CRM",
    logo: "/engrok-icon-theme-white.png",
    color: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200 hover:border-yellow-300",
    textColor: "text-yellow-700",
  },
]

export function IntegrationNodeConfig({ selectedNode, updateNode }: NodeConfigurationProps) {
  // Pre-cargamos la integración seleccionada (si la hubiera) al abrir el sheet
  const initialIntegration = (selectedNode as any)?.metadataIntegration?.providerConfigKey ?? null
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(initialIntegration)
  const [integrationConnection, setIntegrationConnection] = useState<boolean>(false);   

  // Mantener sincronización si el usuario cambia de nodo sin recargar la página
  useEffect(() => {
    const newIntegration = (selectedNode as any)?.metadataIntegration?.providerConfigKey ?? null
    setSelectedIntegration(newIntegration)
  }, [selectedNode])


  const handleIntegrationSelect = (integrationId: string) => {
    setSelectedIntegration(integrationId)

    /* Guardamos la selección en el nodo para que persista */
    updateNode(selectedNode.id, {
      metadataIntegration: {
        ...((selectedNode as any)?.metadataIntegration ?? {}),
        providerConfigKey: integrationId,
      },
      data: {
        ...selectedNode.data,
        metadataIntegration: {
          ...((selectedNode as any)?.metadataIntegration ?? {}),
          providerConfigKey: integrationId,
        },
      },
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50/50 rounded-lg">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Configuración de Integración</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Selecciona la integración que deseas usar para este nodo
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h4 className="text-sm font-medium text-gray-700">Integraciones Disponibles</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {integrations.map((integration) => (
            <Button
              key={integration.id}
              variant="outline"
              onClick={() => handleIntegrationSelect(integration.id)}
              className={`
                relative flex flex-col items-center justify-center p-4 h-24 
                transition-all duration-200 ease-in-out
                ${integration.color}
                ${
                  selectedIntegration === integration.id
                    ? "ring-2 ring-blue-500 ring-offset-2 shadow-md"
                    : "hover:shadow-sm"
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src={integration.logo || "/placeholder.svg"}
                    alt={integration.name}
                    width={60}
                    height={60}
                    className="object-cover rounded-sm"
                    style={{
                      objectFit: "contain",
                      objectPosition: "center",
                    }}
                  />
                </div>
                <span className={`text-xs font-medium text-center leading-tight ${integration.textColor}`}>
                  {integration.name}
                </span>
              </div>

              {selectedIntegration === integration.id && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </Button>
          ))}
        </div>
      </div>

      {
        selectedIntegration === "google-calendar" && (
          <IntegrationComponent setIntegrationConnection={setIntegrationConnection} visibleName="Google Calendar" providerConfigKey="google-calendar" authMode="oauth2" nodeId={selectedNode.id} updateNode={updateNode} selectedNode={selectedNode} />
        )
      }
      {
        selectedIntegration === "google-sheets" && (
          <IntegrationComponent setIntegrationConnection={setIntegrationConnection} visibleName="Google Sheets" providerConfigKey="google-sheet" authMode="oauth2" nodeId={selectedNode.id} updateNode={updateNode} selectedNode={selectedNode} />
        )
      },
      {
        selectedIntegration === "cal-com" && (
          <IntegrationComponent setIntegrationConnection={setIntegrationConnection} visibleName="Cal.com" providerConfigKey="cal-com-v2" authMode="api-key" nodeId={selectedNode.id} updateNode={updateNode} selectedNode={selectedNode} />
        )
      }
      {
        selectedIntegration === "hubspot" && (
          <IntegrationComponent setIntegrationConnection={setIntegrationConnection} visibleName="Hubspot" providerConfigKey="hubspot" authMode="oauth2" nodeId={selectedNode.id} updateNode={updateNode} selectedNode={selectedNode} />
        )
      }
      {
        selectedIntegration === "airtable" && (
          <IntegrationComponent setIntegrationConnection={setIntegrationConnection} visibleName="Airtable" providerConfigKey="airtable" authMode="oauth2" nodeId={selectedNode.id} updateNode={updateNode} selectedNode={selectedNode} />
        )
      }
      {
        selectedIntegration === "engrok" && (
          <NativeCrmIntegrationComponent setIntegrationConnection={setIntegrationConnection}/>
        )
      }
    </div>
  )
}
