"use client"

import Image from "next/image"
import type { NodeConfigurationProps } from "./types"
import { Button } from "@/components/ui/button"
import IntegrationComponent from "@/components/nango/integrationComponent"    
import NativeCrmIntegrationComponent from "@/components/integrations/nativeCrmIntegrationComponent"
import { IntegrationNodeData } from "../../types"

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
    providerConfigKey: 'google-calendar',
    authMode: 'oauth2'
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    logo: "/integrations-logos-providers/google-sheets.webp",
    color: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300",
    textColor: "text-emerald-700",
    providerConfigKey: 'google-sheet',
    authMode: 'oauth2'
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
    providerConfigKey: 'hubspot',
    authMode: 'oauth2'
  },
  {
    id: "airtable",
    name: "Airtable",
    logo: "/integrations-logos-providers/airtable.png",
    color: "bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300",
    textColor: "text-red-700",
    providerConfigKey: 'airtable',
    authMode: 'oauth2'
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
  const nodeData = selectedNode.data as IntegrationNodeData;

  const handleIntegrationSelect = (integrationType: IntegrationNodeData["integrationType"]) => {
    const baseData = {
        label: nodeData.label,
        name: nodeData.name,
        type: nodeData.type,
    }
    updateNode(selectedNode.id, { ...baseData, integrationType: integrationType });
  };
  
  const selectedIntegrationConfig = integrations.find(int => int.id === nodeData.integrationType);

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50/50 rounded-lg">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Configuración de Integración
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Selecciona y configura la integración para este nodo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {integrations.map((integration) => (
            <Button
              key={integration.id}
              variant="outline"
              onClick={() => handleIntegrationSelect(integration.id as IntegrationNodeData["integrationType"])}
              className={`
                relative flex flex-col items-center justify-center p-4 h-24 
                transition-all duration-200 ease-in-out
                ${integration.color}
                ${
                  nodeData.integrationType === integration.id
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
            </Button>
          ))}
      </div>
      
      {selectedIntegrationConfig?.providerConfigKey && selectedIntegrationConfig?.authMode && (
        <div className="mt-4 border-t pt-4">
          <IntegrationComponent
            visibleName={selectedIntegrationConfig.name}
            providerConfigKey={selectedIntegrationConfig.providerConfigKey}
            authMode={selectedIntegrationConfig.authMode}
            nodeId={selectedNode.id}
            updateNode={updateNode}
            selectedNode={selectedNode}
            setIntegrationConnection={() => {}}
          />
        </div>
      )}
    </div>
  )
}
