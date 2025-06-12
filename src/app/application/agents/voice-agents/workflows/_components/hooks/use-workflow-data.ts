import { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { updateWorkflow, getWorkflow } from '@/actions/workflow';
import { toast } from 'sonner';

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

              /**
               * If the stored workflow follows the new minimal Vapi format (nodes without React-Flow metadata),
               * we need to transform it back to the internal React-Flow representation so the editor can work.
               */
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

  const saveWorkflow = async (nodes: Node[], edges: Edge[]): Promise<boolean> => {
    if (!workflowName.trim()) {
      toast.error("Por favor proporciona un nombre para el workflow");
      return false;
    }

    setIsSaving(true);
    try {
      // Convert internal representation to minimal API format before saving
      const minimalNodes = nodes.map((n) => transformNodeToMinimal(n));
      const minimalEdges = edges.map((e) => transformEdgeToMinimal(e, nodes));

      const workflowData: WorkflowData = {
        name: workflowName,
        workflowJson: { nodes: minimalNodes, edges: minimalEdges },
      };

      if (!workflowId) {
        toast.error("Workflow ID is not provided");
        return false;
      }

      const response = await updateWorkflow(workflowData, workflowId);

      if (response.status === 200) {
        if (response.workflow) {
          toast.success("Workflow guardado exitosamente");
          return true;
        }
      } else {
        toast.error("Error al guardar el workflow");
        console.log(response, "response");
        return false;
      }
    } catch (error) {
      console.error("Error al guardar el workflow:", error);
      toast.error("Error al guardar el workflow");
      return false;
    } finally {
      setIsSaving(false);
    }
    return false;
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
      name: d.name || d.label || node.id,
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
    };
  }

  // Integration node --------------------------------------------------------
  if (node.type === "integration") {
    return {
      type: "integration",
      name: d.name || d.label || node.id,
      metadataIntegration: (node as any).metadataIntegration || {},
      tool: d.tool || {
        type: "apiRequest",
      },
    };
  }

  // Tool nodes (fallback) ---------------------------------------------------
  const baseToolNode: any = {
    type: "tool",
    name: d.name || d.label || node.id,
    tool: d.tool || {
      type: node.type, // fallback
    },
  };

  return baseToolNode;
}

// Converts a React-Flow edge into the {from,to} format expected by the API
function transformEdgeToMinimal(edge: Edge, nodes: Node[]): any {
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  return {
    from: getNodeName(sourceNode),
    to: getNodeName(targetNode),
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
    const id = minNode.name || `${minNode.type}-${idx}`;
    const position = { x: (idx % 5) * 250, y: Math.floor(idx / 5) * 160 };

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
      return {
        id,
        type: "integration",
        position,
        metadataIntegration: minNode.metadataIntegration || {},
        data: {
          label: minNode.name || "Integración",
          type: "tool",
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
    const sourceNode = builderNodes.find(
      (n) => getNodeName(n) === minEdge.from
    );
    const targetNode = builderNodes.find(
      (n) => getNodeName(n) === minEdge.to
    );

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