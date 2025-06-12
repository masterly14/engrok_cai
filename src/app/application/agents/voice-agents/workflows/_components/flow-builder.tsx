"use client";

import { useState, useCallback, useRef } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { ConversationNode } from "./nodes/conversation-node";
import { EndCallNode } from "./nodes/end-call-node";
import { ApiRequestNode } from "./nodes/api-request-node";
import { IntegrationNode } from "./nodes/integration-node";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { TransferCallNode } from "./nodes/trasfer-call-node";
import { conditionEdges } from "./edges/condition-edges";
import { NodeSelector } from "./node-selector";
import { TemplateSelector, type WorkflowTemplate } from "./template-selector";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NodeConfigurationSheet } from "./node-configuration";
import { useWorkflowData } from "./hooks/use-workflow-data";

// Define node types
export type NodeData = {
  label: string;
  type: string;
  /** Prompt principal del nodo */
  prompt?: string;
  /** Nombre interno del nodo */
  name?: string;
  /** Información de posicionamiento y otros metadatos */
  metadata?: {
    position: { x: number; y: number };
    [key: string]: any;
  };
  /** Primer mensaje o plan de mensajes */
  messagePlan?: {
    firstMessage: string;
  };
  /** Extracción de variables desde LLM */
  variableExtractionPlan?: {
    output: any[];
  };
  /** Configuración global para nodos como globalNodePlan */
  globalNodePlan?: {
    enabled: boolean;
    enterCondition: string;
  };
  /** Para nodos de tipo herramienta (transferCall, endCall, etc.) */
  tool?: any;
};

// Initial nodes and edges
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Define custom node types
const nodeTypes: NodeTypes = {
  conversation: ConversationNode,
  transferCall: TransferCallNode,
  endCall: EndCallNode,
  apiRequest: ApiRequestNode,
  integration: IntegrationNode,
};

// Add after the nodeTypes definition
const edgeTypes = {
  smartCondition: conditionEdges,
};

export function FlowBuilder({ workflowId }: { workflowId: string }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[] | any>(
    initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Use workflow data hook
  const {
    workflowName,
    setWorkflowName,
    isSaving,
    isLoading,
    saveWorkflow,
  } = useWorkflowData({ workflowId, setNodes, setEdges });

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: "smartCondition",
        data: { condition: { type: "ai", prompt: "Condition" } },
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Add a new node to the canvas
  const addNode = useCallback(
    (nodeType: string) => {
      if (!reactFlowInstance) return;

      // Get the center position of the viewport
      const position = reactFlowInstance.project({
        x: reactFlowWrapper.current!.clientWidth / 2,
        y: reactFlowWrapper.current!.clientHeight / 2,
      });

      let newNode: Node | any;
      // Create a new node with an incremented ID
      if (nodeType === "conversation") {
        newNode = {
          id: `${nodeType}-${nodes.length + 1}`,
          type: nodeType,
          position,
          data: {
            label: `${nodeType.charAt(0).toUpperCase()}`,
            name: "",
            type: nodeType,
            prompt: "",
            messagePlan: { firstMessage: "" },
            metadata: { position },
            model: {
              temperature: 0.5,
              max_tokens: 1000,
              model: "gpt-4.1-nano",
              provider: "openai",
            },
            voice: {
              provider: "11labs",
              voiceId: "",
              language: "es",
            },
            transcription: {
              model: "nova-2",
              language: "es",
              provider: "deepgram",
            },
          },
        };
      } else if (nodeType === "transferCall") {
        newNode = {
          id: `${nodeType}-${nodes.length + 1}`,
          type: nodeType,
          position,
          data: {
            name: "Transfer Call",
            type: "tool",
            tool: {
              type: "transferCall",
              function: {
                name: "untitled_tool",
                parameters: {
                  type: "object",
                  properties: {},
                  required: [],
                },
              },
              destinations: [
                {
                  type: "number",
                  message: "",
                  description: "",
                  number: "",
                  numberE164CheckEnabled: true,
                  transferPlan: {
                    mode: "blind_transfer"
                  }
                },
              ],
            },
          },
        };
      } else if (nodeType === "endCall") {
        newNode = {
          id: `${nodeType}-${nodes.length + 1}`,
          type: nodeType,
          position,
          data: {
            name: "End Call",
            type: "tool",
            tool: {
              type: "endCall",
              function: {
                name: "untitled_tool",
                parameters: {
                  type: "object",
                  properties: {},
                  required: [],
                },
              },
            },
          },
        };
      } else if (nodeType === "apiRequest") {
        newNode = {
          id: `${nodeType}-${nodes.length + 1}`,
          type: nodeType,
          position,
          data: {
            label: "API Request",
            type: "tool",
            tool: {
              type: "apiRequest",
              url: "",
              method: "GET",
              headers: {
                type: "object",
                items: {},
                properties: {},
                description: "",
                required: [],
                value: "",
                target: "",
                enum: [],
              },
              body: {
                type: "object",
                items: {},
                properties: {},
                description: "",
                required: [],
                value: "",
                target: "",
                enum: [],
              },
            },
          }
        };
      } else if (nodeType === "integration") {
        newNode = {
          id: `${nodeType}-${nodes.length + 1}`,
          type: nodeType,
          position,
          metadataIntegration: {
            providerConfigKey: "",
            action: "",
            calendarId: "",
            timeMin: "",
            timeMax: "",
            url: "",
            method: "GET"
          },
          data: {
            label: "Integración",
            type: "tool",
            tool: {
              type: "apiRequest",
              url: "",
              method: "GET",
              headers: {
                type: "object",
                items: {},
                properties: {},
                description: "",
                required: [],
                value: "",
                target: "",
                enum: [],
              },
              body: {
                type: "object",
                items: {},
                properties: {},
                description: "",
                required: [],
                value: "",
                target: "",
                enum: [],
              },
            },
          },
        };
      }

      setNodes((nds) => nds.concat(newNode));
      setIsMenuOpen(false);
      console.log(nodes);
    },
    [nodes.length, reactFlowInstance, setNodes]
  );

  // Handle template selection
  const handleTemplateSelect = useCallback(
    (template: WorkflowTemplate) => {
      // Replace current nodes and edges with template ones
      const transformedNodes = template.nodes.map((n) => {
        const baseData: any = n.data || {};
        return {
          ...n,
          data: {
            ...baseData,
            prompt: baseData.message || baseData.prompt || "",
            messagePlan: {
              firstMessage: baseData.message || baseData.prompt || "",
            },
            metadata: { position: n.position },
            variableExtractionPlan: baseData.variableExtractionPlan
              ? {
                  output: baseData.variableExtractionPlan.output.map(
                    (variable: any) => ({
                      ...variable,
                      id: variable.id || `var_${Date.now()}_${Math.random()}`,
                      isEditing: false,
                    })
                  ),
                }
              : { output: [] },
          },
        };
      });

      const transformedEdges = template.edges.map((e) => ({
        ...e,
        data: { condition: { type: "ai", prompt: e.data?.condition || "" } },
      }));

      setNodes(transformedNodes);
      setEdges(transformedEdges);

      // Fit view to show all nodes
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView();
        }
      }, 100);
    },
    [reactFlowInstance, setNodes, setEdges]
  );

  // Encuentra el nodo seleccionado
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Manejar clic en nodo para abrir Sheet
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Update node function for the sheet components
  const updateNode = (nodeId: string, updates: any) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  };

  const handleSaveWorkflow = async () => {
    const success = await saveWorkflow(nodes, edges);
    if (success) {
      setIsSaveDialogOpen(false);
    }
  };

  return (
    <div className="w-full h-full flex-1 relative" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={setReactFlowInstance}
          defaultEdgeOptions={{
            type: "smartCondition",
            style: { strokeWidth: 2, stroke: "#64748b" },
          }}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          className="h-full flex-1"
          onNodeClick={onNodeClick}
          minZoom={0.1}
          maxZoom={2}
        >
          <Background gap={12} size={0.7} />

          {/* Top toolbar */}
          <Panel
            position="top-center"
            className="bg-white shadow-md rounded-md p-1 m-2 flex gap-1"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setIsSaveDialogOpen(true)}
            >
              <Save className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Undo className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Redo className="h-5 w-5" />
            </Button>
            <Button onClick={() => {
              console.log(nodes);
            }}>
              <Download className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-gray-200 my-auto mx-1"></div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <TemplateSelector onSelectTemplate={handleTemplateSelect} />
            <div className="w-px h-6 bg-gray-200 my-auto mx-1"></div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Download className="h-5 w-5" />
            </Button>
          </Panel>

          <Controls className="bg-white shadow-md rounded-md border-none overflow-hidden" />
        </ReactFlow>

        {/* Save Dialog */}
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {workflowId ? "Actualizar Workflow" : "Guardar Workflow"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Ingresa el nombre del workflow"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSaveDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveWorkflow} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <motion.div
          className="absolute bottom-4 right-4 z-10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>

        {isMenuOpen && (
          <NodeSelector
            onSelect={addNode}
            onClose={() => setIsMenuOpen(false)}
          />
        )}

        <NodeConfigurationSheet
          selectedNode={selectedNode}
          isOpen={!!selectedNode}
          onClose={() => setSelectedNodeId(null)}
          updateNode={updateNode}
        />
      </ReactFlowProvider>
    </div>
  );
}
