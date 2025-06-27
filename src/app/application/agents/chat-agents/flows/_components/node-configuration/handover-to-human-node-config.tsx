"use client"

import type { Node } from "reactflow"
import { ConfigField } from "../shared-config-components"

interface HandoverToHumanNodeConfigProps {
  selectedNode: Node
  updateNode: (nodeId: string, updates: any) => void
}

export function HandoverToHumanNodeConfig({ selectedNode, updateNode }: HandoverToHumanNodeConfigProps) {
  const data = selectedNode.data || {}

  const handleChange = (field: string, value: any) => {
    updateNode(selectedNode.id, { data: { ...data, [field]: value } })
  }

  return (
    <div className="space-y-6">
      <ConfigField
        id="node-name"
        label="Node Name"
        value={data.name}
        onChange={(val: any) => handleChange("name", val)}
        placeholder="Handover a agente"
      />
      <ConfigField
        id="bot-response"
        as="textarea"
        label="Mensaje al usuario"
        value={data.botResponse}
        onChange={(val: any) => handleChange("botResponse", val)}
        placeholder="Un momento, te transfiero con un asesor humano."
        description="Este mensaje se enviará antes de transferir la conversación al agente humano."
      />
    </div>
  )
} 