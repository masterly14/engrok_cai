"use client"

import { Handle, Position } from "reactflow"
import { Wrench } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { IntegrationNodeData } from "../../types"

// Mapeo de providerConfigKey a información de la integración
const integrationInfo: Record<string, { name: string; logo: string; color: string }> = {
  "google-calendar": {
    name: "Google Calendar",
    logo: "/integrations-logos-providers/google-calendar.png",
    color: "from-blue-500 to-blue-600",
  },
  "google-sheet": {
    name: "Google Sheets",
    logo: "/integrations-logos-providers/google-sheets.webp",
    color: "from-emerald-500 to-emerald-600",
  },
  "cal-com-v2": {
    name: "Cal.com",
    logo: "/integrations-logos-providers/cal-logo.jpg",
    color: "from-purple-500 to-purple-600",
  },
  hubspot: {
    name: "Hubspot",
    logo: "/integrations-logos-providers/hubspot.webp",
    color: "from-orange-500 to-orange-600",
  },
  airtable: {
    name: "Airtable",
    logo: "/integrations-logos-providers/airtable.png",
    color: "from-red-500 to-red-600",
  },
  whatsapp: {
    name: "WhatsApp",
    logo: "/integrations-logos-providers/whatsapp.webp",
    color: "from-green-500 to-green-600",
  },
  engrok: {
    name: "Engrok Local CRM",
    logo: "/engrok-icon-theme-white.png",
    color: "from-yellow-500 to-yellow-600",
  },
  "custom-api": {
    name: "API Request",
    logo: "/file.svg", // Placeholder
    color: "from-purple-500 to-violet-600",
  },
};

interface IntegrationNodeProps {
  data: IntegrationNodeData
  isConnectable: boolean
  selected?: boolean
}

export function IntegrationNode({ data, isConnectable, selected }: IntegrationNodeProps) {
  const integrationDetails = integrationInfo[data.integrationType] || integrationInfo['custom-api'];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`rounded-lg overflow-hidden shadow-lg transition-shadow ${selected ? "ring-2 ring-amber-500 ring-offset-2" : ""}`}
      style={{ minWidth: 220 }}
    >
      <div className={`bg-gradient-to-r ${integrationDetails.color} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-md">
            <Image
              src={integrationDetails.logo}
              alt={integrationDetails.name}
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <span className="font-medium text-white">{data.label}</span>
        </div>
      </div>
      <div className="bg-white border-x border-b border-gray-200 p-3 rounded-b-lg space-y-2">
        <div className="text-sm font-medium text-gray-700">
          {integrationDetails.name}
        </div>

        {data.integrationType === "google-sheet" && (
          <>
            {data.sheetName && (
              <div className="text-xs text-gray-600">
                Pestaña: {data.sheetName}
              </div>
            )}
            {data.column && (
              <div className="text-xs text-gray-600">
                Columna: {data.column}
              </div>
            )}
          </>
        )}
        
        {data.integrationType === "google-calendar" && (
          <>
            {data.calendarId && <div className="text-xs text-gray-600">Calendario: {data.calendarId}</div>}
            {data.eventSummary && <div className="text-xs text-gray-600 truncate">Evento: {data.eventSummary}</div>}
          </>
        )}

        {data.integrationType === 'custom-api' && data.url && (
          <div className="text-xs text-gray-600 font-mono truncate" title={data.url}>{data.method} {data.url}</div>
        )}

      </div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className={`w-3 h-3 ${integrationDetails.color ? "bg-blue-600" : "bg-orange-600"} border-2 border-white top-0`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className={`w-3 h-3 ${integrationDetails.color ? "bg-blue-600" : "bg-orange-600"} border-2 border-white bottom-0`}
      />
    </motion.div>
  )
}
