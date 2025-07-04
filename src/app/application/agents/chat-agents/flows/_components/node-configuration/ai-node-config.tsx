"use client"

import { useState, useEffect } from "react"
import type { Node } from "reactflow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AiNodeData } from "../nodes/ai-node"

interface AiNodeConfigProps {
  selectedNode: Node<AiNodeData>
  updateNode: (nodeId: string, data: any) => void
}

export function AiNodeConfig({ selectedNode, updateNode }: AiNodeConfigProps) {
  const [name, setName] = useState(selectedNode.data.name || "Inteligencia Artificial")
  const [prompt, setPrompt] = useState(selectedNode.data.prompt || "")

  // --- RAG related local state ---



  // Fetch knowledge bases when toggle is enabled


  // Función centralizada para actualizar los datos del nodo
  const handleUpdateNodeData = (newData: Partial<AiNodeData>) => {
    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, ...newData },
    })
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
    </div>
  )
}
