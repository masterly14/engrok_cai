"use client"

import { MessageSquare, Phone, PhoneOff, Zap, Workflow, Sparkles, Plus, Layers, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TemplateSelector, type WorkflowTemplate } from "./template-selector"

const nodeTypes = [
  {
    id: "conversation",
    label: "Conversación",
    description: "Interacción con IA conversacional",
    icon: MessageSquare,
    color: "bg-blue-500",
    category: "core",
  },
  {
    id: "transferCall",
    label: "Transferir Llamada",
    description: "Transferir a otro número",
    icon: Phone,
    color: "bg-green-500",
    category: "core",
  },
  {
    id: "endCall",
    label: "Finalizar Llamada",
    description: "Terminar la conversación",
    icon: PhoneOff,
    color: "bg-red-500",
    category: "core",
  },
  {
    id: "integration",
    label: "Integración",
    description: "Conectar con APIs externas",
    icon: Zap,
    color: "bg-purple-500",
    category: "advanced",
  },
  {
    id: "apiRequest",
    label: "API Request",
    description: "Realiza una petición HTTP externa",
    icon: Zap,
    color: "bg-purple-500",
    category: "advanced",
  },
]

interface WorkflowSidebarProps {
  onAddNode: (nodeType: string) => void
  onSelectTemplate: (template: WorkflowTemplate) => void
  hasNodes: boolean
  isOpen: boolean
}

export function WorkflowSidebar({ onAddNode, onSelectTemplate, hasNodes, isOpen }: WorkflowSidebarProps) {
  const coreNodes = nodeTypes.filter((node) => node.category === "core")
  const advancedNodes = nodeTypes.filter((node) => node.category === "advanced")

  if (!isOpen) return null

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Workflow className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Workflow Builder</h2>
            <p className="text-sm text-gray-500">Construye tu flujo de trabajo</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasNodes && (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Sparkles className="h-4 w-4" />
                Plantillas
              </div>
              <TemplateSelector onSelectTemplate={onSelectTemplate} />
            </div>
            <div className="border-t border-gray-200 my-4"></div>
          </>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Layers className="h-4 w-4" />
            Nodos Principales
          </div>
          <div className="space-y-2">
            {coreNodes.map((nodeType) => (
              <button
                key={nodeType.id}
                onClick={() => onAddNode(nodeType.id)}
                className="group flex h-auto w-full items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${nodeType.color}`}>
                  <nodeType.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{nodeType.label}</span>
                    <Plus className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{nodeType.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Settings className="h-4 w-4" />
            Nodos Avanzados
            <Badge variant="secondary" className="ml-auto text-xs">
              Pro
            </Badge>
          </div>
          <div className="space-y-2">
            {advancedNodes.map((nodeType) => (
              <button
                key={nodeType.id}
                onClick={() => onAddNode(nodeType.id)}
                className="group flex h-auto w-full items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${nodeType.color}`}>
                  <nodeType.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{nodeType.label}</span>
                    <Plus className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{nodeType.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
