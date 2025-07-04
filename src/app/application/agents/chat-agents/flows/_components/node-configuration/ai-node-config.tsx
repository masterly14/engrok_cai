"use client"

import { useState, useEffect } from "react"
import type { Node } from "reactflow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AiNodeData } from "../nodes/ai-node"

interface AiNodeConfigProps {
  selectedNode: Node<AiNodeData>
  updateNode: (nodeId: string, data: any) => void
}

export function AiNodeConfig({ selectedNode, updateNode }: AiNodeConfigProps) {
  const [name, setName] = useState(selectedNode.data.name || "Inteligencia Artificial")
  const [prompt, setPrompt] = useState(selectedNode.data.prompt || "")

  // Sincronizar estado local si el nodo seleccionado cambia
  useEffect(() => {
    setName(selectedNode.data.name || "Inteligencia Artificial")
    setPrompt(selectedNode.data.prompt || "")
  }, [selectedNode.id, selectedNode.data])

  // Función centralizada para actualizar los datos del nodo
  const handleUpdateNodeData = (newData: Partial<AiNodeData>) => {
    updateNode(selectedNode.id, { data: { ...selectedNode.data, ...newData } })
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <Label htmlFor="ai-node-name">Nombre del Nodo</Label>
        <Input
          id="ai-node-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => handleUpdateNodeData({ name })}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="ai-node-prompt">Prompt de la IA</Label>
        <Textarea
          id="ai-node-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={() => handleUpdateNodeData({ prompt })}
          placeholder="Ej: Eres un asistente virtual amigable..."
          className="mt-1 min-h-[120px]"
        />
        <p className="text-xs text-gray-400 mt-2">
          Describe el comportamiento de la IA. Puedes usar variables de sesión con la sintaxis {"'{{variable}}'"}.
        </p>
      </div>
    </div>
  )
}
