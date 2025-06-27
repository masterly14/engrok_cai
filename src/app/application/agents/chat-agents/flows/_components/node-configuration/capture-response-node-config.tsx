"use client"

import type { Node } from "reactflow"
import { ConfigField } from "../shared-config-components"

interface captureResponseNodeConfigProps {
  selectedNode: Node
  updateNode: (nodeId: string, updates: any) => void
}

export function CaptureResponseNodeConfig({ selectedNode, updateNode }: captureResponseNodeConfigProps) {
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
        placeholder="E.j Capturar número de identificación."
      />
      <ConfigField
        id="variable-name"
        label="Nombre de la variable"
        value={data.variableName}
        onChange={(val: any) => handleChange("variableName", val)}
        placeholder="E.j. identificacionCliente, productoComprado"
        description="El nombre de la variable donde se capturará la respuesta del usuario."
      />
    </div>
  )
}
