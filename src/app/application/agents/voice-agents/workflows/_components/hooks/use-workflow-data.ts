import { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { updateWorkflow, getWorkflow } from '@/actions/workflow';
import { toast } from 'sonner';
import {
  WorkflowNode,
  ConversationNodeData,
  IntegrationNodeData,
  TransferCallNodeData,
  Variable,
} from '@/app/application/agents/voice-agents/workflows/types';

interface UseWorkflowDataProps {
  workflowId: string;
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
}

interface WorkflowData {
  name: string;
  workflowJson: {
    nodes: any[];
    edges: any[];
  };
}

// Función para transformar el estado del builder al formato de VAPI
const transformToVapiPayload = (
  nodes: WorkflowNode[],
  edges: Edge[],
  workflowName: string
) => {
  if (nodes.length === 0) {
    return { name: workflowName, nodes: [], edges: [] };
  }

  // 1. Find the ID of the start node (the one with no incoming edges)
  const targetNodeIds = new Set(edges.map((edge) => edge.target));
  let startNode = nodes.find((node) => !targetNodeIds.has(node.id));
  if (!startNode && nodes.length > 0) {
    startNode = nodes[0]; // Fallback for single node or looped flows
  }
  const startNodeId = startNode?.id;

  // 2. Create a unique name for each node.
  const idToNameMap = new Map<string, string>();
  const usedNames = new Set<string>();
  nodes.forEach(node => {
      let candidateName = node.data.name || node.id;
      // Ensure name is unique and not a reserved word like 'start'
      if (usedNames.has(candidateName) || candidateName === 'start') {
          candidateName = node.id; // fallback to unique id
      }
      usedNames.add(candidateName);
      idToNameMap.set(node.id, candidateName);
  });

  // 3. Transform all user-defined nodes to the Vapi format.
  const vapiNodes = nodes.map((node) => {
    const { data } = node;
    const vapiName = idToNameMap.get(node.id)!;
    const baseVapiNode = { name: vapiName };

    if (data.type === "conversation") {
      const convData = data as ConversationNodeData;
      const schemaProperties = (convData.variables || []).reduce(
        (acc: Record<string, { type: string; description: string }>, variable: Variable) => {
          acc[variable.name] = {
            type: "string",
            description: variable.description,
          };
          return acc;
        },
        {} as Record<string, { type: string; description: string }>
      );

      const vapiNodeData: any = {
        ...baseVapiNode,
        type: "conversation",
        model: convData.model,
        voice: convData.voice,
        transcriber: convData.transcriber,
        prompt: convData.prompt,
        variableExtractionPlan: {
          schema: {
            type: "object",
            properties: schemaProperties,
          },
        },
      };

      if (node.id === startNodeId) {
        vapiNodeData.isStart = true;
      }

      return vapiNodeData;
    }

    if (data.type === "transferCall") {
      const transferData = data as TransferCallNodeData;
      return {
        ...baseVapiNode,
        type: "transfer",
        destination: {
          type: "phoneNumber",
          number: transferData.number,
        },
      };
    }

    if (data.type === "endCall") {
      return {
        ...baseVapiNode,
        type: "end",
      };
    }

    if (data.type === "integration") {
        const intData = data as IntegrationNodeData;
        let tool = {};
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
        };
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
          };
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
          };
            }
        }
      return { ...baseVapiNode, type: "tool", tool };
    }

    if (data.type === "apiRequest") {
        const apiData = data as any;

        // Clone headers to avoid mutating the original data object.
        const headers = apiData.headers ? { ...apiData.headers } : {};

        // The Vapi API error indicates that 'Content-Type' should not be set manually.
        // We remove it if it exists.
        if ('Content-Type' in headers) {
          delete headers['Content-Type'];
        }
        
        const tool: any = {
          type: "apiRequest",
            url: apiData.url,
            method: apiData.method,
        };

        // Only include the headers object if it's not empty after filtering.
        if (Object.keys(headers).length > 0) {
            tool.headers = headers;
        }

        // Only include body if it is not empty
        if (apiData.body && Object.keys(apiData.body).length > 0) {
            tool.body = apiData.body;
        }

        return {
          ...baseVapiNode,
          type: "tool",
          tool: tool,
        };
    }
    return null;
  }).filter(Boolean);

  // 4. Transform user-defined edges.
  const vapiEdges = edges.map((edge) => ({
    from: idToNameMap.get(edge.source),
    to: idToNameMap.get(edge.target),
    condition: edge.data?.condition,
  }));

  return {
    name: workflowName,
    nodes: vapiNodes as any[],
    edges: vapiEdges as any[],
  };
};

export function useWorkflowData({ workflowId, setNodes, setEdges }: UseWorkflowDataProps) {
  const [workflowName, setWorkflowName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load workflow data on component mount
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId) return;
      
      setIsLoading(true);
      try {
        const response = await getWorkflow(workflowId);
        if (response.status === 200 && response.workflow) {
          const workflow = response.workflow;
          setWorkflowName(workflow.name || "");
          
          // Load nodes and edges from workflowJson if available
          if (workflow.workflowJson) {
            try {
              let workflowData: any = workflow.workflowJson;
              if (typeof workflowData === "string") {
                workflowData = JSON.parse(workflowData);
              }
              const isMinimalFormat =
                Array.isArray(workflowData.nodes) &&
                workflowData.nodes.length > 0 &&
                !workflowData.nodes[0].id; // "id" is always present in React-Flow nodes

              if (isMinimalFormat) {
                const { builderNodes, builderEdges } = transformFromMinimalFormat(
                  workflowData.nodes,
                  workflowData.edges || []
                );
                setNodes(builderNodes);
                setEdges(builderEdges);
              } else {
                const { nodes: loadedNodes, edges: loadedEdges } = workflowData;
                if (loadedNodes) setNodes(loadedNodes);
                if (loadedEdges) setEdges(loadedEdges);
              }
            } catch (error) {
              console.error("Error parsing workflow JSON:", error);
              toast.error("Error al cargar el workflow");
            }
          }
        }
      } catch (error) {
        console.error("Error loading workflow:", error);
        toast.error("Error al cargar el workflow");
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflow();
  }, [workflowId, setNodes, setEdges]);

  const saveWorkflow = async (nodes: WorkflowNode[], edges: Edge[]) => {
    if (!workflowName) {
        toast.error("Por favor, asigna un nombre al workflow antes de guardar.");
        return false;
    }
    setIsSaving(true);
    try {
      const vapiPayload = transformToVapiPayload(nodes, edges, workflowName);

      const localPayload = {
        name: workflowName,
        workflowJson: {
            nodes,
            edges,
        },
        tools: vapiPayload.nodes.filter((node: any) => node.type === 'tool'),
        vapiPayload: vapiPayload // Incluir el payload de Vapi
      };
      
      const response = await updateWorkflow(localPayload, workflowId);

      if (response.status !== 200) {
        throw new Error(response.message || "Error al guardar el workflow");
      }
      
      // Mostrar resultado de Vapi si está disponible
      if (response.vapiResult) {
        if (response.vapiResult.success) {
          toast.success("Workflow guardado y sincronizado con Vapi AI");
        } else {
          toast.warning("Workflow guardado localmente, pero hubo un problema con Vapi AI");
          console.warn("Vapi API error:", response.vapiResult.error);
        }
      } else {
        toast.success("Workflow guardado con éxito");
      }
      
      return true;
    } catch (error: any) {
      console.error("Error guardando el workflow:", error);
      toast.error(error.message || "Error al guardar el workflow");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    workflowName,
    setWorkflowName,
    isSaving,
    isLoading,
    saveWorkflow,
  };
}

/****************************************************************************************
 * Helpers – conversion between internal React-Flow format and minimal API format
 ****************************************************************************************/

// Converts a React-Flow node to the minimal node expected by the Vapi API
function transformNodeToMinimal(node: Node): any {
  const d: any = node.data || {};

  // Conversation node -------------------------------------------------------
  if (node.type === "conversation") {
    return {
      type: "conversation",
      name: node.id,
      prompt: d.prompt || "",
      variableExtractionPlan: d.variableExtractionPlan || {},
      model: d.model
        ? {
            provider: d.model.provider,
            model: d.model.model,
            temperature: d.model.temperature,
            maxTokens: d.model.max_tokens ?? d.model.maxTokens,
          }
        : undefined,
      transcriber: d.transcription || d.transcriber,
      voice: d.voice,
      position: node.position,
    };
  }

  // Integration node --------------------------------------------------------
  if (node.type === "integration") {
    return {
      type: "tool",
      name: node.id,
      metadataIntegration: (node as any).metadataIntegration || {},
      position: node.position,
      tool: d.tool || {
        type: "apiRequest",
      },
    };
  }

  // API Request node -------------------------------------------------------
  if (node.type === "apiRequest") {
    return {
      type: "tool",
      name: node.id,
      position: node.position,
      tool: {
        type: "apiRequest",
        url: d.url,
        method: d.method,
        headers: d.headers || {},
        body: d.body || {},
      },
    };
  }

  // Tool nodes (fallback) ---------------------------------------------------
  const baseToolNode: any = {
    type: "tool",
    name: node.id,
    tool: d.tool || {
      type: node.type, // fallback
    },
    position: node.position,
  };

  return baseToolNode;
}

// Converts a React-Flow edge into the {from,to} format expected by the API
function transformEdgeToMinimal(edge: Edge, nodes: Node[]): any {
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  return {
    from: sourceNode?.id || "",
    to: targetNode?.id || "",
  };
}

function getNodeName(node?: Node): string {
  if (!node) return "";
  const d: any = node.data || {};
  return d.name || d.label || node.id;
}

// Transform minimal format coming from the API back to React-Flow nodes & edges
function transformFromMinimalFormat(minNodes: any[], minEdges: any[]) {
  const builderNodes: Node[] = minNodes.map((minNode: any, idx: number) => {
    let id = minNode.name || `${minNode.type}-${idx}`;
    // Garantizar unicidad
    const existingIds = new Set<string>();
    if (existingIds.has(id)) {
      id = `${id}-${idx}`;
    }
    existingIds.add(id);
    const position = minNode.position || { x: (idx % 5) * 250, y: Math.floor(idx / 5) * 160 };

    if (minNode.type === "conversation") {
      return {
        id,
        type: "conversation",
        position,
        data: {
          ...minNode,
          // keep backwards compatibility with existing editor fields
          transcription: minNode.transcriber,
        },
      } as Node;
    }

    if (minNode.type === "integration") {
      // Compatibilidad con antiguos flujos donde el tipo era "integration"
      return {
        id,
        type: "integration",
        position,
        metadataIntegration: minNode.metadataIntegration || {},
        data: {
          type: "tool",
          name: minNode.name || "Integración",
          metadataIntegration: minNode.metadataIntegration || {},
          tool: minNode.tool || {
            type: "apiRequest",
          },
        },
      } as Node;
    }

    // Nuevo formato: minNode.type === "tool" pero incluye metadataIntegration
    if (minNode.type === "tool" && minNode.metadataIntegration) {
      return {
        id,
        type: "integration",
        position,
        metadataIntegration: minNode.metadataIntegration || {},
        data: {
          type: "tool",
          name: minNode.name || "Integración",
          metadataIntegration: minNode.metadataIntegration || {},
          tool: minNode.tool || {
            type: "apiRequest",
          },
        },
      } as Node;
    }

    if (minNode.type === "tool") {
      const toolType = minNode.tool?.type || "tool";
      return {
        id,
        type: toolType,
        position,
        data: {
          ...minNode,
        },
      } as Node;
    }

    // fallback
    return {
      id,
      type: "default",
      position,
      data: { ...minNode },
    } as Node;
  });

  const builderEdges: Edge[] = minEdges.map((minEdge: any, idx: number) => {
    // find node ids based on names
    const sourceNode = builderNodes.find((n) => n.id === minEdge.from);
    const targetNode = builderNodes.find((n) => n.id === minEdge.to);

    return {
      id: `e-${idx}`,
      source: sourceNode?.id || "",
      target: targetNode?.id || "",
      type: "smartCondition",
      data: { condition: { type: "ai", prompt: "" } },
    } as Edge;
  });

  return { builderNodes, builderEdges };
} 