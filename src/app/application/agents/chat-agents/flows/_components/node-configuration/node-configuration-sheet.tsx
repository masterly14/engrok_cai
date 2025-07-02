"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import type { Node } from "reactflow"
import { ConversationNodeConfig } from "./conversation-node-config"
import { ConditionNodeConfig } from "./condition-node-config"
import { CrmNodeConfig } from "./crm-node-config"
import { ApiRequestNodeConfig } from "./api-request-node-config"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TurnOffAgentNodeConfig } from "./turn-off-agent-node-config"
import { CaptureResponseNodeConfig } from "./capture-response-node-config"
import { UrlButtonNodeConfig } from "./url-button-node-config"
import { TriggerNodeConfig } from "./trigger-node-config"
import React from "react"
import { toast } from "sonner"
import { HandoverToHumanNodeConfig } from "./handover-to-human-node-config"
import IntegrationNodeConfig from "./integration-node-config"

interface NodeConfigurationSheetProps {
  selectedNode: Node | null
  isOpen: boolean
  onClose: () => void
  updateNode: (nodeId: string, updates: any) => void
  workflowId: string
  globalVariables: string[]
  onValidationStateChange?: (hasErrors: boolean) => void
  onSaveFlow?: () => void
  workflowChatAgentId: string
}

export function NodeConfigurationSheet({ selectedNode, isOpen, onClose, updateNode, workflowId, globalVariables, onValidationStateChange, onSaveFlow, workflowChatAgentId }: NodeConfigurationSheetProps) {
  if (!selectedNode) return null

  const [hasErrors, setHasErrors] = React.useState(false)
  const [didModify, setDidModify] = React.useState(false)

  // Wrapper to mark modification
  const wrappedUpdateNode = React.useCallback((nodeId: string, updates: any) => {
    setDidModify(true)
    updateNode(nodeId, updates)
  }, [updateNode])

  // Propagate to parent builder if requested
  React.useEffect(() => {
    onValidationStateChange?.(hasErrors)
  }, [hasErrors, onValidationStateChange])

  // Reset error state when node changes
  React.useEffect(() => {
    setHasErrors(false)
    setDidModify(false)
  }, [selectedNode?.id])

  const nodeTypeToNameMap: Record<string, string> = {
    conversation: "Conversación",
    crm: "CRM",
    apiRequest: "API",
    turnOffAgent: "Finalizar Conversación",
    captureResponse: "Capturar Respuesta",
    condition: "Condición",
    urlButton: "Botón URL",
    trigger: "Trigger",
    handoverToHuman: "Transferencia a Agente",
    integration: "Integration",
  }

  const nodeFriendlyName = nodeTypeToNameMap[selectedNode.type || ""] || selectedNode.type || "Node"

  const renderNodeConfiguration = () => {
    switch (selectedNode.type) {
      case "conversation":
        return (
          <ConversationNodeConfig
            selectedNode={selectedNode}
            updateNode={wrappedUpdateNode}
            workflowId={workflowId}
            agentId={workflowChatAgentId}
            globalVariables={globalVariables}
          />
        )
      case "crm":
        return <CrmNodeConfig selectedNode={selectedNode} updateNode={wrappedUpdateNode} />
      case "apiRequest":
        return <ApiRequestNodeConfig selectedNode={selectedNode} updateNode={wrappedUpdateNode} />
      case "turnOffAgent":
        return <TurnOffAgentNodeConfig selectedNode={selectedNode} updateNode={wrappedUpdateNode} />
      case "captureResponse":
        return <CaptureResponseNodeConfig selectedNode={selectedNode} updateNode={wrappedUpdateNode} />
      case "condition":
        return (
          <ConditionNodeConfig
            selectedNode={selectedNode}
            updateNode={wrappedUpdateNode}
            globalVariables={globalVariables}
            onValidationChange={setHasErrors}
          />
        )
      case "urlButton":
        return <UrlButtonNodeConfig selectedNode={selectedNode} updateNode={wrappedUpdateNode} />
      case "trigger":
        return (
          <TriggerNodeConfig
            selectedNode={selectedNode}
            updateNode={wrappedUpdateNode}
            workflowId={workflowId}
          />
        )
      case "handoverToHuman":
        return (
          <HandoverToHumanNodeConfig
            selectedNode={selectedNode}
            updateNode={wrappedUpdateNode}
          />
        )
      case "integration":
        return <IntegrationNodeConfig workflowId={workflowId} selectedNode={selectedNode} updateNode={wrappedUpdateNode} />
      default:
        return (
          <div className="p-6 text-center text-gray-500">
            <p className="font-medium">Configuración no disponible</p>
            <p className="text-sm">Este tipo de nodo no tiene configuraciones específicas.</p>
          </div>
        )
    }
  }

  const handleAttemptClose = () => {
    if (hasErrors) {
      toast.error("Hay errores de validación. Corrígelos antes de cerrar.")
      return
    }
    onClose()
  }

  const handleDone = () => {
    if (hasErrors) {
      toast.error("Hay errores de validación. Corrígelos antes de guardar.")
      return
    }
    if (didModify) {
      // Save flow only if there were modifications
      onSaveFlow?.()
    }
    onClose()
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(openState) => {
        if (!openState) {
          handleAttemptClose();
        }
      }}
    >
      <SheetContent side="right" className="w-auto sm:max-w-4xl flex flex-col p-0 overflow-y-auto">
        <SheetHeader className="p-6 border-b border-gray-200">
          <SheetTitle className="text-lg font-semibold text-gray-900">Configure {nodeFriendlyName}</SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            Ajusta las configuraciones para el nodo '{selectedNode.data?.name || selectedNode.id}'.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-grow">
          <div className="p-6">{renderNodeConfiguration()}</div>
        </ScrollArea>

        <SheetFooter className="p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={handleAttemptClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleDone} className="w-full sm:w-auto">
            Hecho
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
