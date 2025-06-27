"use client"

import type { Node } from "reactflow"
import { ConfigField } from "../shared-config-components"

interface UrlButtonNodeConfigProps {
  selectedNode: Node
  updateNode: (nodeId: string, updates: any) => void
}

export function UrlButtonNodeConfig({ selectedNode, updateNode }: UrlButtonNodeConfigProps) {
  const data = selectedNode.data || {}

  const handleChange = (field: string, value: any) => {
    updateNode(selectedNode.id, { data: { ...data, [field]: value } })
  }

  return (
    <div className="space-y-6">
      <ConfigField
        id="node-name"
        label="Nombre del nodo"
        value={data.name}
        onChange={(val: any) => handleChange("name", val)}
        placeholder="E.g., Visit Our Website"
      />
      <ConfigField
        id="message"
        label="Texto del mensaje"
        value={data.message}
        onChange={(val: any) => handleChange("message", val)}
        placeholder="Click the button below to visit our website!"
        as="textarea"
        description="El mensaje mostrado arriba del botón de URL."
      />
      <ConfigField
        id="url"
        label="URL del botón"
        value={data.url}
        onChange={(val: any) => handleChange("url", val)}
        placeholder="https://example.com"
        type="url"
        description="La URL a la que se enlazará el botón."
      />
      <ConfigField
        id="bot-response"
        label="Respuesta del bot (Interna)"
        value={data.botResponse}
        onChange={(val: any) => handleChange("botResponse", val)}
        placeholder="URL button sent."
        as="textarea"
        description="Mensaje interno o de sistema (no mostrado al usuario)."
      />
      <ConfigField
        id="user-response"
        label="Respuesta del usuario (Disparador)"
        value={data.userResponse}
        onChange={(val: any) => handleChange("userResponse", val)}
        placeholder="Palabra clave o frase para activar este nodo"
        as="textarea"
        disabled={data.isUserResponseAuto}
      />
    </div>
  )
}
