"use client"

import { useState, useEffect } from "react"
import type { Edge } from "reactflow"
import { toast } from "sonner"
import { getChatWorkflow } from "@/actions/chat-agents"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

interface UseChatWorkflowDataProps {
  workflowId?: string
  setNodes: (nodes: any[]) => void
  setEdges: (edges: any[]) => void
}

interface WorkflowData {
  name: string
  workflow: {
    nodes: any[]
    edges: any[]
  }
}

function transformFromMinimalFormat(minNodes: any[], minEdges: any[]) {
  const existingIds = new Set<string>()
  const builderNodes = minNodes.map((minNode: any, idx: number) => {
    let id = minNode.name || `${minNode.type}-${idx}`
    if (existingIds.has(id)) {
      id = `${minNode.type}-${uuidv4().slice(0, 4)}-${idx}` // Id unico para cada nodo
    }
    existingIds.add(id)
    const position = minNode.position || {
      x: (idx % 5) * 280 + 50,
      y: Math.floor(idx / 5) * 200 + 50,
    }
    let data: any = {
      type: minNode.type,
      name: minNode.name,
      position,
    }
    switch (minNode.type) {
      case "conversation":
        data = {
          ...data,
          initialMessage: minNode.initialMessage || false,
          userResponse: minNode.userResponse || "",
          botResponse: minNode.botResponse || "",
          variableName: minNode.variableName || "",
          fileOrImageUrl: minNode.fileOrImageUrl || "",
          interactiveButtons: minNode.interactiveButtons || [],
          jumpToNextNode: minNode.jumpToNextNode || false,
          acceptAnyMessage: minNode.acceptAnyMessage || false,
        }
        break
      case "crm":
        ;(async () => {
          const res = await fetch("/api/crm/access-token")
          if (!res.ok) throw new Error("No se pudo obtener el accessToken")
          const { accessToken } = await res.json()
          data = {
            ...data,
            url:
              minNode.url ||
              (process.env.NEXT_PUBLIC_BASE_URL
                ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/crm/contacts?accessToken=${accessToken}`
                : `/api/crm/contacts?accessToken=${accessToken}`),
            method: minNode.method || "POST",
            headers: minNode.headers || { "Content-Type": "application/json" },
            body:
              minNode.body ||
              JSON.stringify({
                name: minNode.name || "New Contact",
                stage: minNode.stage || "",
                phone: minNode.phone || "",
                tag: minNode.tag || "",
                notes: minNode.notes || "",
                useInfoWhatsApp: minNode.useInfoWhatsApp || false,
              }),
            botResponse: minNode.botResponse || "",
            userResponse: minNode.userResponse || "",
            variableName: minNode.variableName || "",
            fileOrImageUrl: minNode.fileOrImageUrl || "",
            interactiveButtons: minNode.interactiveButtons || [],
          }
        })()
        break
      case "apiRequest":
        data = {
          ...data,
          url: minNode.url || "",
          method: minNode.method || "GET",
          headers: minNode.headers || {},
          body: minNode.body || {},
          agentResponse: minNode.agentResponse || "",
          statusSuccess: minNode.statusSuccess || "",
          statusError: minNode.statusError || "",
          botResponse: minNode.botResponse || "",
          userResponse: minNode.userResponse || "",
        }
        break
      case "turnOffAgent":
        data = {
          ...data,
          message: minNode.message || "Conversation ended.",
          botResponse: minNode.botResponse || "",
          userResponse: minNode.userResponse || "",
        }
        break
      case "captureResponse":
        data = {
          ...data,
          variableName: minNode.variableName || "",
        }
        break
      case "condition":
        data = {
          ...data,
          condition: minNode.condition || "",
          statusSuccess: minNode.statusSuccess || "",
          statusError: minNode.statusError || "",
          botResponse: minNode.botResponse || "",
          userResponse: minNode.userResponse || "",
        }
        break
      case "urlButton":
        data = {
          ...data,
          url: minNode.url || "",
          message: minNode.message || "",
          botResponse: minNode.botResponse || "",
          userResponse: minNode.userResponse || "",
        }
        break
      // Agregamos el caso para el nodo de IA
      case "ai":
        data = {
          ...data,
          prompt: minNode.prompt || "Eres un asistente de IA.",
          conditions: minNode.conditions || [],
        }
        break
      default:
        data.type = "unknown"
        break
    }
    return {
      id,
      type: minNode.type,
      position,
      data,
    }
  })
  const builderEdges: Edge[] = minEdges
    .map((minEdge: any, idx: number) => {
      const sourceNode = builderNodes.find((n) => n.data.name === minEdge.from || n.id === minEdge.from)
      const targetNode = builderNodes.find((n) => n.data.name === minEdge.to || n.id === minEdge.to)
      if (!sourceNode || !targetNode) {
        console.warn(`Edge references non-existent node: from '${minEdge.from}' to '${minEdge.to}'. Skipping edge.`)
        return null
      }

      // Reconstruir la etiqueta si es una conexión de IA
      const edgeLabel = minEdge.data?.condition || minEdge.label || undefined

      return {
        id: minEdge.id || `e-${sourceNode.id}-${targetNode.id}-${idx}`,
        source: sourceNode.id,
        target: targetNode.id,
        label: edgeLabel,
        data: minEdge.data, // Preservar cualquier data adicional
      }
    })
    .filter((edge) => edge !== null) as Edge[]
  return { builderNodes, builderEdges }
}

export function useChatWorkflowData({ workflowId, setNodes, setEdges }: UseChatWorkflowDataProps) {
  const [workflowName, setWorkflowName] = useState("Nuevo Flujo")
  const [agentData, setAgentData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [workflowAgentId, setWorkflowAgentId] = useState("")
  const router = useRouter()

  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId) {
        setWorkflowName("Nuevo Flujo")
        setNodes([])
        setEdges([])
        return
      }
      setIsLoading(true)
      try {
        const response = await getChatWorkflow(workflowId)
        if (response.status === 200 && response.workflow) {
          const workflow = response.workflow as any
          setWorkflowName(workflow.name || "Flujo sin nombre")
          setAgentData(workflow.agent || null)
          setWorkflowAgentId(workflow.agent?.id ?? "")
          if (workflow.workflow) {
            try {
              let workflowData: any = workflow.workflow
              if (typeof workflowData === "string") {
                workflowData = JSON.parse(workflowData)
              }

              const isReactFlowFormat =
                Array.isArray(workflowData.nodes) &&
                workflowData.nodes.length > 0 &&
                workflowData.nodes[0].id !== undefined &&
                workflowData.nodes[0].type !== undefined &&
                workflowData.nodes[0].position !== undefined &&
                workflowData.nodes[0].data !== undefined

              const isMinimalFormat =
                Array.isArray(workflowData.nodes) &&
                workflowData.nodes.length > 0 &&
                workflowData.nodes[0].id === undefined &&
                workflowData.nodes[0].type !== undefined

              if (isReactFlowFormat) {
                const { nodes: loadedNodes = [], edges: loadedEdges = [] } = workflowData

                // **AQUÍ LA MODIFICACIÓN**
                // Procesar edges para restaurar la etiqueta visual desde los datos guardados
                const processedEdges = loadedEdges.map((edge: Edge) => {
                  if (edge.data?.condition) {
                    return { ...edge, label: edge.data.condition }
                  }
                  return edge
                })

                setNodes(loadedNodes)
                setEdges(processedEdges)
              } else if (isMinimalFormat) {
                const { builderNodes, builderEdges } = transformFromMinimalFormat(
                  workflowData.nodes,
                  workflowData.edges || [],
                )
                setNodes(builderNodes)
                setEdges(builderEdges)
              } else {
                const { nodes: loadedNodes = [], edges: loadedEdges = [] } = workflowData
                setNodes(loadedNodes)
                setEdges(loadedEdges)
              }
            } catch (error) {
              console.error("Error parsing or transforming workflow data:", error)
              toast.error("Error parseando o transformando los datos del flujo")
            }
          } else {
            setNodes([])
            setEdges([])
          }
        } else {
          toast.error("No se encontró el flujo o hubo un error al obtenerlo.")
          setNodes([])
          setEdges([])
        }
      } catch (error) {
        console.error("Error loading workflow:", error)
        toast.error("Error al cargar el flujo.")
        setNodes([])
        setEdges([])
        return router.push("/application/agents/chat-agents/flows")
      } finally {
        setIsLoading(false)
      }
    }
    loadWorkflow()
  }, [workflowId, setNodes, setEdges, router])

  return { workflowName, agentData, isLoading, workflowAgentId }
}
