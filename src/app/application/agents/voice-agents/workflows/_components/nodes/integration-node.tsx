"use client"

import { Handle, Position } from "reactflow"
import { Wrench } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect } from "react"
import { useReactFlow } from "reactflow"
import type { NodeData } from "../flow-builder"
import Image from "next/image"

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
  "hubspot": {
    name: "Hubspot",
    logo: "/integrations-logos-providers/hubspot.webp",
    color: "from-orange-500 to-orange-600",
  },
  "airtable": {
    name: "Airtable",
    logo: "/integrations-logos-providers/airtable.png",
    color: "from-red-500 to-red-600",
  },
  "whatsapp": {
    name: "WhatsApp",
    logo: "/integrations-logos-providers/whatsapp.webp",
    color: "from-green-500 to-green-600",
  },
  "engrok": {
    name: "Engrok Local CRM",
    logo: "/engrok-icon-theme-white.png",
    color: "from-yellow-500 to-yellow-600",
  },
};

// Mapeo de tipos de acción a nombres legibles
const actionNames: Record<string, string> = {
  "checkAvailability": "Verificar Disponibilidad",
  "createEvent": "Crear Evento",
  "deleteEvent": "Eliminar Evento",
  "updateEvent": "Actualizar Evento",
};

interface IntegrationNodeProps {
  data: NodeData
  isConnectable: boolean
  selected?: boolean
}

export function IntegrationNode({ data, isConnectable, selected }: IntegrationNodeProps) {
  const reactFlowInstance = useReactFlow();
  // Obtener información de la integración desde metadataIntegration
  const integration = (data as any)?.metadataIntegration;
  const providerKey = integration?.providerConfigKey;
  const action = integration?.action;
  const calendarId = integration?.calendarId;
  const timeMin = integration?.timeMin;
  const timeMax = integration?.timeMax;

  // Obtener información de la integración seleccionada
  const integrationDetails = providerKey ? integrationInfo[providerKey] : null;

  // Forzar actualización del nodo cuando cambia la integración
  useEffect(() => {
    if (integration?.providerConfigKey) {
      reactFlowInstance.setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === (data as any).id) {
            return {
              ...node,
              data: {
                ...node.data,
                label: integrationDetails?.name || "Integración",
              },
            };
          }
          return node;
        })
      );
    }
  }, [integration?.providerConfigKey, integrationDetails?.name, reactFlowInstance, data]);

  console.log(integrationDetails);
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`rounded-lg overflow-hidden shadow-lg transition-shadow ${selected ? "ring-2 ring-amber-500 ring-offset-2" : ""}`}
      style={{ minWidth: 220 }}
    >
      <div className={`bg-gradient-to-r ${integrationDetails?.color || "from-orange-500 to-amber-600"} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {integrationDetails ? (
            <div className="bg-white/20 p-1.5 rounded-md">
              <Image
                src={integrationDetails.logo}
                alt={integrationDetails.name}
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="bg-white/20 p-1.5 rounded-md">
              <Wrench className="h-5 w-5 text-white" />
            </div>
          )}
          <span className="font-medium text-white">
            {integrationDetails?.name || data.label}
          </span>
        </div>
      </div>
      <div className="bg-white border-x border-b border-gray-200 p-3 rounded-b-lg space-y-2">
        {integration?.action && (
          <div className="text-sm font-medium text-gray-700">
            {actionNames[action] || action}
          </div>
        )}
        {calendarId && (
          <div className="text-xs text-gray-600">
            Calendario: {calendarId}
          </div>
        )}
        {timeMin && timeMax && (
          <div className="text-xs text-gray-600">
            {new Date(timeMin).toLocaleDateString()} - {new Date(timeMax).toLocaleDateString()}
          </div>
        )}
          <div className="text-sm text-gray-600">{integrationDetails ? "Conectado a servicio externo de " + integrationDetails.name : "Conecta a un servicio externo."}</div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className={`w-3 h-3 ${integrationDetails?.color ? "bg-blue-600" : "bg-orange-600"} border-2 border-white top-0`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className={`w-3 h-3 ${integrationDetails?.color ? "bg-blue-600" : "bg-orange-600"} border-2 border-white bottom-0`}
      />
    </motion.div>
  )
}
