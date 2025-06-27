"use client"

import type { Node } from "reactflow"
import { ConfigField } from "../shared-config-components"

interface TurnOffAgentNodeConfigProps {
  selectedNode: Node
  updateNode: (nodeId: string, updates: any) => void
}

export function TurnOffAgentNodeConfig({ selectedNode, updateNode }: TurnOffAgentNodeConfigProps) {
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
        placeholder="E.g., End Chat"
      />
      <ConfigField
        id="message"
        label="End Message"
        value={data.message}
        onChange={(val: any) => handleChange("message", val)}
        placeholder="Thank you for contacting us!"
        as="textarea"
        description="Este mensaje se enviará al usuario cuando finalice la conversación."
      />
      <ConfigField
        id="bot-response"
        label="Respuesta del bot (Interna)"
        value={data.botResponse}
        onChange={(val: any) => handleChange("botResponse", val)}
        placeholder="Agent deactivated."
        as="textarea"
        description="Mensaje interno o de sistema (no mostrado al usuario)."
      />
      <ConfigField
        id="user-response"
        label="Respuesta del usuario (Disparador)"
        value={data.userResponse}
        onChange={(val: any) => handleChange("userResponse", val)}
        placeholder="Palabra clave o frase para activar este nodo (e.g. 'Hablar con un asesor')"
        as="textarea"
        disabled={data.isUserResponseAuto}
      />
    </div>
  )
}
