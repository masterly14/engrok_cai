import { useState, useEffect, useCallback } from "react"
import type { Node, Edge } from "reactflow"
import { updateWorkflow, getWorkflow } from "@/actions/workflow"
import { toast } from "sonner"
import type {
  WorkflowNode,
  ConversationNodeData,
  IntegrationNodeData,
  TransferCallNodeData,
  Variable,
  VapiVoice,
  WorkflowNodeData,
  EndCallNodeData,
} from "@/app/application/agents/voice-agents/workflows/types"

interface UseWorkflowDataProps {
  workflowId: string
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
}

export interface GlobalWorkflowSettings {
  voice: VapiVoice
}

interface WorkflowData {
  name: string
  workflowJson: {
    nodes: any[]
    edges: any[]
    globalSettings?: GlobalWorkflowSettings
  }
}

// Función para transformar el estado del builder al formato de VAPI
const transformToVapiPayload = (
  nodes: WorkflowNode[],
  edges: Edge[],
  workflowName: string,
  globalSettings: GlobalWorkflowSettings,
) => {
  if (nodes.length === 0) {
    return { name: workflowName, nodes: [], edges: [] }
  }

  // 1. Find the ID of the start node (the one with no incoming edges)
  const targetNodeIds = new Set(edges.map((edge) => edge.target))
  let startNode = nodes.find((node) => !targetNodeIds.has(node.id))
  if (!startNode && nodes.length > 0) {
    startNode = nodes[0] // Fallback for single node or looped flows
  }
  const startNodeId = startNode?.id

  // 2. Create a unique name for each node.
  const idToNameMap = new Map<string, string>()
  const usedNames = new Set<string>()
  nodes.forEach((node) => {
    let candidateName = node.data.name || node.id
    // Ensure name is unique and not a reserved word like 'start'
    if (usedNames.has(candidateName) || candidateName === "start") {
      candidateName = node.id // fallback to unique id
    }
    usedNames.add(candidateName)
    idToNameMap.set(node.id, candidateName)
  })

  // 3. Transform all user-defined nodes to the Vapi format.
  const vapiNodes = nodes
    .map((node) => {
      const { data } = node
      const vapiName = idToNameMap.get(node.id)!
      const baseVapiNode = { name: vapiName }

      if (data.type === "conversation") {
        const convData = data as ConversationNodeData
        const schemaProperties = (convData.variables || []).reduce(
          (acc: Record<string, { type: string; description: string }>, variable: Variable) => {
            acc[variable.name] = {
              type: "string",
              description: variable.description,
            }
            return acc
          },
          {} as Record<string, { type: string; description: string }>,
        )

        const vapiNodeData: any = {
          ...baseVapiNode,
          type: "conversation",
          model: convData.model,
          voice: convData.voice || globalSettings.voice,
          transcriber: convData.transcriber,
          prompt: convData.prompt,
          variableExtractionPlan: {
            schema: {
              type: "object",
              properties: schemaProperties,
            },
          },
        }

        if (node.id === startNodeId) {
          vapiNodeData.isStart = true
        }

        return vapiNodeData
      }

      if (data.type === "transferCall") {
        const transferData = data as TransferCallNodeData
        return {
          ...baseVapiNode,
          type: "transfer",
          destination: {
            type: "phoneNumber",
            number: transferData.number,
          },
        }
      }

      if (data.type === "endCall") {
        return {
          ...baseVapiNode,
          type: "end",
        }
      }

      if (data.type === "integration") {
        const intData = data as IntegrationNodeData
        let tool = {}
        if (intData.integrationType === "google-sheet") {
          tool = {
            type: "apiRequest",
            url: `/api/integrations/sheets?action=appendData`,
            method: "POST",
            body: {
              type: "object",
              properties: {
                spreadsheetId: intData.spreadsheetId,
                sheetName: intData.sheetName,
                column: intData.column,
                value: intData.value,
              },
            },
          }
        }
        if (intData.integrationType === "google-calendar") {
          if (intData.calendarAction === "availability") {
            tool = {
              type: "apiRequest",
              url: `/api/integrations/calendar?action=availability`,
              method: "GET",
              query: {
                calendarId: intData.calendarId,
                rangeDays: intData.rangeDays || 15,
              },
            }
          } else {
            tool = {
              type: "apiRequest",
              url: `/api/integrations/calendar?action=createEvent`,
              method: "POST",
              body: {
                type: "object",
                properties: {
                  calendarId: intData.calendarId,
                  summary: intData.eventSummary,
                  description: intData.eventDescription,
                  startDate: intData.eventStartDate,
                  startTime: intData.eventStartTime,
                  duration: intData.eventDuration,
                },
              },
            }
          }
        }
        return { ...baseVapiNode, type: "tool", tool }
      }

      if (data.type === "apiRequest") {
        const apiData = data as any

        // Clone headers to avoid mutating the original data object.
        const headers = apiData.headers ? { ...apiData.headers } : {}

        // The Vapi API error indicates that 'Content-Type' should not be set manually.
        // We remove it if it exists.
        if ("Content-Type" in headers) {
          delete headers["Content-Type"]
        }

        const tool: any = {
          type: "apiRequest",
          url: apiData.url,
          method: apiData.method,
        }

        // Only include the headers object if it's not empty after filtering.
        if (Object.keys(headers).length > 0) {
          tool.headers = headers
        }

        // Only include body if it is not empty
        if (apiData.body && Object.keys(apiData.body).length > 0) {
          tool.body = apiData.body
        }

        return {
          ...baseVapiNode,
          type: "tool",
          tool: tool,
        }
      }
      return null
    })
    .filter(Boolean)

  // 4. Transform user-defined edges.
  const vapiEdges = edges.map((edge) => ({
    from: idToNameMap.get(edge.source),
    to: idToNameMap.get(edge.target),
    condition: edge.data?.condition,
  }))

  return {
    name: workflowName,
    nodes: vapiNodes as any[],
    edges: vapiEdges as any[],
  }
}

export function useWorkflowData({ workflowId, setNodes, setEdges }: UseWorkflowDataProps) {
  const [workflowName, setWorkflowName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [globalVoice, setGlobalVoice] = useState<VapiVoice>({
    provider: "11labs",
    voiceId: "joan",
  })

  // Load workflow data on component mount
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await getWorkflow(workflowId)
        if (response.status === 200 && response.workflow) {
          const workflow = response.workflow
          setWorkflowName(workflow.name || "")

          // Load nodes and edges from workflowJson if available
          if (workflow.workflowJson) {
            try {
              let workflowData: any = workflow.workflowJson
              if (typeof workflowData === "string") {
                workflowData = JSON.parse(workflowData)
              }

              if (workflowData.globalSettings?.voice) {
                setGlobalVoice(workflowData.globalSettings.voice)
              }

              const isMinimalFormat =
                Array.isArray(workflowData.nodes) &&
                workflowData.nodes.length > 0 &&
                !workflowData.nodes[0].id // "id" is always present in React-Flow nodes

              if (isMinimalFormat) {
                const { nodes, edges } = transformFromMinimalFormat(
                  workflowData.nodes,
                  workflowData.edges,
                )
                setNodes(nodes)
                setEdges(edges)
              } else if (workflowData.nodes && workflowData.edges) {
                // Handle old format or direct React Flow format
                setNodes(workflowData.nodes)
                setEdges(workflowData.edges)
              }
            } catch (error) {
              console.error("Error parsing workflowJson:", error)
              toast.error("Hubo un error al cargar el workflow.")
            }
          }
        } else {
          toast.error(response.message || "No se pudo cargar el workflow.")
        }
      } catch (error) {
        console.error("Failed to load workflow:", error)
        toast.error("Ocurrió un error inesperado al cargar el workflow.")
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkflow()
  }, [workflowId, setNodes, setEdges])

  const saveWorkflow = useCallback(
    async (nodes: WorkflowNode[], edges: Edge[]) => {
      setIsSaving(true)
      try {
        // Transformaciones a formato VAPI y minimalista
        const vapiPayload = transformToVapiPayload(nodes, edges, workflowName, {
          voice: globalVoice,
        })
        const minimalNodes = nodes.map(transformNodeToMinimal)
        const minimalEdges = edges.map((edge) => transformEdgeToMinimal(edge, nodes))

        const workflowJson = {
          nodes: minimalNodes,
          edges: minimalEdges,
          globalSettings: {
            voice: globalVoice,
          },
        }

        const response = await updateWorkflow({
          name: workflowName,
          vapiPayload: vapiPayload,
          workflowJson: workflowJson,
        }, workflowId)

        if (response.status === 200) {
          toast.success("Workflow guardado exitosamente!")
          return true
        } else {
          toast.error(`Error al guardar: ${response.message}`)
          return false
        }
      } catch (error) {
        console.error("Error saving workflow:", error)
        toast.error("Ocurrió un error inesperado al guardar el workflow.")
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [workflowId, workflowName, globalVoice],
  )

  return {
    workflowName,
    setWorkflowName,
    isSaving,
    isLoading,
    saveWorkflow,
    globalVoice,
    setGlobalVoice,
  }
}

// --- Funciones de transformación ---

/**
 * Convierte un nodo de React Flow a un formato minimalista para almacenar en la DB.
 * Solo se guarda la data esencial para reconstruir el nodo.
 */
function transformNodeToMinimal(node: Node): any {
  const minimalNode: any = {
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      type: node.data.type,
      name: node.data.name,
      label: node.data.label,
    },
  }

  // Añadir propiedades específicas del tipo de nodo
  const data = node.data as WorkflowNodeData
  switch (data.type) {
    case "conversation":
      minimalNode.data.prompt = data.prompt
      minimalNode.data.model = data.model
      minimalNode.data.voice = data.voice // Puede ser undefined
      minimalNode.data.transcriber = data.transcriber
      minimalNode.data.variables = data.variables
      break
    case "integration":
      minimalNode.data.integrationType = data.integrationType
      // Guardar solo las propiedades relevantes para el integrationType
      if (data.integrationType === "google-sheet") {
        minimalNode.data.spreadsheetId = data.spreadsheetId
        minimalNode.data.sheetName = data.sheetName
        minimalNode.data.column = data.column
        minimalNode.data.value = data.value
      } else if (data.integrationType === "google-calendar") {
        minimalNode.data.calendarId = data.calendarId
        minimalNode.data.calendarAction = data.calendarAction
        if (data.calendarAction === "availability") {
          minimalNode.data.rangeDays = data.rangeDays
        } else {
          minimalNode.data.eventSummary = data.eventSummary
          minimalNode.data.eventDescription = data.eventDescription
          minimalNode.data.eventStartDate = data.eventStartDate
          minimalNode.data.eventStartTime = data.eventStartTime
          minimalNode.data.eventDuration = data.eventDuration
        }
      } else if (data.integrationType === "custom-api") {
        // Las propiedades de custom-api se guardarán si existen
        minimalNode.data.url = data.url
        minimalNode.data.method = data.method
        minimalNode.data.headers = data.headers
        minimalNode.data.body = data.body
      }
      break
    case "transferCall":
      minimalNode.data.number = data.number
      minimalNode.data.message = data.message
      break
    case "endCall":
      // No extra data needed for endCall
      break
    case "apiRequest":
      minimalNode.data.url = data.url
      minimalNode.data.method = data.method
      minimalNode.data.headers = data.headers
      minimalNode.data.body = data.body
      break
  }

  return minimalNode
}

/**
 * Convierte un edge de React Flow a un formato minimalista.
 */
function transformEdgeToMinimal(edge: Edge, nodes: Node[]): any {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    data: edge.data,
  }
}

function getNodeName(node?: Node): string {
  if (!node) return ""
  return (node.data as any)?.name || node.id
}

/**
 * Reconstruye los nodos y edges de React Flow desde el formato minimalista.
 */
function transformFromMinimalFormat(
  minNodes: any[],
  minEdges: any[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes = minNodes.map((minNode) => {
    return {
      id: minNode.id,
      type: minNode.type,
      position: minNode.position,
      data: minNode.data,
      width: 300, // Ancho predeterminado
      height: 150, // Alto predeterminado
    } as Node
  })

  const edges = minEdges.map((minEdge) => {
    return {
      id: minEdge.id,
      source: minEdge.source,
      target: minEdge.target,
      type: minEdge.type,
      data: minEdge.data,
      style: { strokeWidth: 2, stroke: "#374151" },
      animated: true,
    } as Edge
  })

  return { nodes, edges }
} 