"use client";

import type React from "react";

import { useRef, useState, useCallback, useEffect, useTransition } from "react";
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
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

// Import custom node components
import ConversationNode from "./nodes/conversation-node";
import TurnOffAgentNode from "./nodes/turn-off-agent-node";
import CaptureResponseNode from "./nodes/capture-response-node";
import ConditionNode from "./nodes/condition-node";
import UrlButtonNode from "./nodes/url-button-node";
import CrmNode from "./nodes/crm-node";
import ApiRequestNode from "./nodes/api-request-node";
import TriggerNode from "./nodes/trigger-node";
import HandoverToHumanNode from "./nodes/handover-to-human-node";

import { Button } from "@/components/ui/button";
import {
  Plus,
  Workflow,
  Save,
  Play,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  Pencil,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NodeSelector } from "./node-selector"; // Assuming node-selector.tsx is in the same directory
import { NodeConfigurationSheet } from "./node-configuration/node-configuration-sheet";

import { useChatWorkflowData } from "./hooks/use-chat-workflow-data"; // Assuming use-chat-workflow-data.tsx is in hooks subdirectory
import { createChatWorkflow, updateChatWorkflow } from "@/actions/chat-agents";

// Add imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AssignAgentModal } from "./assign-agent-modal";

// Initial nodes and edges
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Map nodeTypes
const nodeTypes: NodeTypes = {
  conversation: ConversationNode,
  turnOffAgent: TurnOffAgentNode,
  crm: CrmNode,
  apiRequest: ApiRequestNode,
  captureResponse: CaptureResponseNode,
  condition: ConditionNode,
  urlButton: UrlButtonNode,
  trigger: TriggerNode,
  handoverToHuman: HandoverToHumanNode,
};

// Add validation function before the FlowBuilder component
const validateConnection = (
  sourceNode: Node,
  targetNode: Node,
  allNodes: Node[]
): boolean => {
  // Regla: El Trigger solo puede conectarse a un nodo de Conversación inicial
  if (sourceNode.type === "trigger") {
    if (targetNode.type !== "conversation") {
      toast.error("El nodo Trigger solo puede conectarse a un nodo de Conversación.");
      return false;
    }
    if (!targetNode.data.initialMessage) {
      toast.error(
        "El nodo Trigger solo puede conectarse al primer nodo de Conversación del flujo."
      );
      return false;
    }
  }

  // Regla: El nodo de Conversación inicial solo puede ser precedido por un Trigger
  if (targetNode.data.initialMessage && targetNode.type === "conversation") {
    if (sourceNode.type !== "trigger") {
      toast.error(
        "El primer nodo de Conversación solo puede recibir conexiones desde un nodo Trigger."
      );
      return false;
    }
  }

  // Rule 2: CaptureResponse node cannot connect to another CaptureResponse node
  if (
    sourceNode.type === "captureResponse" &&
    targetNode.type === "captureResponse"
  ) {
    toast.error(
      "No puedes conectar dos nodos de captura de respuesta entre sí"
    );
    return false;
  }

  // Rule 3: TurnOffAgent node cannot have outgoing connections
  if (sourceNode.type === "turnOffAgent") {
    toast.error("El nodo de finalización no puede tener conexiones salientes");
    return false;
  }

  // Rule 4: Handover node cannot have outgoing connections
  if (sourceNode.type === "handoverToHuman") {
    toast.error("El nodo de handover no puede tener conexiones salientes");
    return false;
  }

  // Add more rules as needed...

  return true;
};

export function FlowBuilder({ workflowId }: { workflowId?: string }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[] | any>(
    initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [globalVariables, setGlobalVariables] = useState<
    Record<string, string>
  >({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasConfigErrors, setHasConfigErrors] = useState(false);
  const hasConfigErrorsRef = useRef(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Load existing workflow if workflowId is given
  const { workflowName: loadedWorkflowName, agentData, workflowAgentId } = useChatWorkflowData({
    workflowId,
    setNodes,
    setEdges,   
  });

  const [currentWorkflowName, setCurrentWorkflowName] = useState<string>(loadedWorkflowName);
  const [isEditingName, setIsEditingName] = useState(false);

  // Local state to keep agentId in sync even after reassignment without full refresh
  const [assignedAgentId, setAssignedAgentId] = useState<string>(workflowAgentId);
  useEffect(() => {
    setAssignedAgentId(workflowAgentId);
  }, [workflowAgentId]);

  // Sync when loaded name changes
  useEffect(() => {
    setCurrentWorkflowName(loadedWorkflowName);
  }, [loadedWorkflowName]);
  console.log("workflowName", loadedWorkflowName);

  // Clear nodes and edges when workflowId changes
  useEffect(() => {
    if (workflowId) {
      setNodes([]);
      setEdges([]);
    }
  }, [workflowId, setNodes, setEdges]);

  // Keep ref in sync
  useEffect(() => {
    hasConfigErrorsRef.current = hasConfigErrors;
  }, [hasConfigErrors]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        if (!hasConfigErrorsRef.current) {
          setSelectedNodeId(null);
        } else {
          toast.error("Hay errores de validación. Corrígelos antes de cerrar.");
        }
      }
      if (
        event.key === " " &&
        !(
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        )
      ) {
        event.preventDefault();
        setIsMenuOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePaneClick = useCallback(() => {
    if (!hasConfigErrorsRef.current) {
      setSelectedNodeId(null);
    } else {
      toast.error("Hay errores de validación. Corrígelos antes de cerrar.");
    }
  }, []);

  // Modify the onConnect function
  const onConnect = useCallback(
    (params: Connection) => {
      // Find the source and target nodes
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);

      if (!sourceNode || !targetNode) {
        toast.error("Error al validar la conexión");
        return;
      }

      // Validate the connection
      if (validateConnection(sourceNode, targetNode, nodes)) {
        // 1️⃣ Determinar el mensaje de activación (trigger) dependiendo del origen
        let triggerMessage: string | undefined;

        // Conversación ➜ cualquier nodo (botón interactivo)
        if (sourceNode.type === "conversation" && params.sourceHandle) {
          const buttons = (sourceNode.data as any)?.interactiveButtons || [];
          const matchedBtn = buttons.find(
            (b: any) => b.id === params.sourceHandle
          );
          if (matchedBtn) {
            // Preferimos el payload si existe, de lo contrario el título
            triggerMessage = matchedBtn.payload || matchedBtn.title;
          }
        }

        // Condición ➜ cualquier nodo (success / error)
        if (sourceNode.type === "condition" && params.sourceHandle) {
          if (params.sourceHandle === "success") {
            triggerMessage =
              (sourceNode.data as any)?.statusSuccess || "success";
          } else if (params.sourceHandle === "error") {
            triggerMessage = (sourceNode.data as any)?.statusError || "error";
          }
        }

        // API Request ➜ cualquier nodo (success / error)
        if (sourceNode.type === "apiRequest" && params.sourceHandle) {
          if (params.sourceHandle === "success") {
            triggerMessage =
              (sourceNode.data as any)?.statusSuccess || "success";
          } else if (params.sourceHandle === "error") {
            triggerMessage = (sourceNode.data as any)?.statusError || "error";
          }
        }

        // Si obtenemos un triggerMessage, actualizamos el nodo destino y bloqueamos edición
        if (triggerMessage) {
          setNodes((nds) =>
            nds.map((n) => {
              if (n.id === targetNode.id) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    userResponse: triggerMessage,
                    isUserResponseAuto: true, // Flag para deshabilitar edición en UI
                  },
                };
              }
              return n;
            })
          );
        }

        // Finalmente, añadimos el edge
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [nodes, setEdges, setNodes]
  );

  // Helper to add a new node by type
  const addNode = useCallback(async (nodeType: string) => {
    if (!reactFlowInstance) return;

    // Regla: El primer nodo debe ser de tipo 'Conversación'
    if (nodes.length === 0 && !["conversation", "trigger"].includes(nodeType)) {
      toast.error("El primer nodo de un flujo debe ser de tipo 'Conversación' o 'Trigger'.");
      return;
    }

    const centerX = reactFlowWrapper.current!.clientWidth / 2;
    const centerY = reactFlowWrapper.current!.clientHeight / 2;
    const randomOffset = () => (Math.random() - 0.5) * 150;

    const position = reactFlowInstance.project({
      x: centerX + randomOffset(),
      y: centerY + randomOffset(),
    });

    // Obtener accessToken *antes* de crear el nodo si es tipo CRM
    let crmUrlSuffix = "";
    if (nodeType === "crm") {
      try {
        const res = await fetch("/api/crm/access-token");
        if (res.ok) {
          const { accessToken } = await res.json();
          crmUrlSuffix = `?accessToken=${accessToken}`;
        }
      } catch (err) {
        console.error("Error obteniendo accessToken:", err);
      }
    }

    // Get default data structure
    let defaultData: any = { label: nodeType, type: nodeType };
    if (nodeType === "conversation")
      defaultData = {
        ...defaultData,
        name: "New Conversation",
        userResponse: "",
        botResponse: "",
        variableName: "",
        fileOrImageUrl: "",
        filePublicId: "",
        fileResourceType: "",
        isUploadingMedia: false,
        interactiveButtons: [],
        initialMessage: !nodes.some((n) => n.type === "conversation"), // Set as initial if it's the first conversation node
      };
    if (nodeType === "turnOffAgent")
      defaultData = {
        ...defaultData,
        name: "End Conversation",
        message: "Conversation ended.",
        botResponse: "",
        userResponse: "",
      };
    if (nodeType === "captureResponse")
      defaultData = {
        ...defaultData,
        name: "Capture Response",
        variableName: "",
      };
    if (nodeType === "condition")
      defaultData = {
        ...defaultData,
        name: "New Condition",
        condition: "",
        statusSuccess: "",
        statusError: "",
        botResponse: "",
        userResponse: "",
      };
    if (nodeType === "urlButton")
      defaultData = {
        ...defaultData,
        name: "New URL Button",
        url: "",
        message: "Click here",
        botResponse: "",
        userResponse: "",
      };
    if (nodeType === "crm")
      defaultData = {
        ...defaultData,
        name: "New CRM Action",
        stage: "",
        phone: "",
        tag: "",
        email: "",
        useInfoWhatsApp: false,
        url: (process.env.NEXT_PUBLIC_BASE_URL
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/crm/contacts${crmUrlSuffix}`
          : `/api/crm/contacts${crmUrlSuffix}`),
        notes: "",
        botResponse: "",
        userResponse: "",
        variableName: "",
        fileOrImageUrl: "",
        interactiveButtons: [],
      };
    if (nodeType === "apiRequest")
      defaultData = {
        ...defaultData,
        name: "New API Request",
        url: "",
        method: "GET",
        headers: {},
        body: {},
        agentResponse: "",
        statusSuccess: "",
        statusError: "",
        botResponse: "",
        userResponse: "",
      };
    if (nodeType === "trigger")
      defaultData = {
        ...defaultData,
        name: "Webhook Trigger",
        provider: "webhook",
        mapping: { phone: "phone", vars: {} },
        token: "",
        url: "",
      };
    if (nodeType === "handoverToHuman")
      defaultData = {
        ...defaultData,
        name: "Handover to Agent",
        botResponse: "En un momento te atenderá un agente humano.",
      };

    const newNode: Node = {
      id: uuidv4(),
      type: nodeType,
      position,
      data: defaultData,
    } as Node;

    setNodes((nds) => nds.concat(newNode));
    setIsMenuOpen(false);
  },
  [reactFlowInstance, setNodes, nodes]
);

  // Handle node click to open configuration
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // ---------- Update node function (race-condition safe) ----------
  const updateNode = (nodeId: string, updates: any) => {
    setNodes((prevNodes) => {
      // Apply updates on the *latest* nodes snapshot to avoid race conditions
      const newNodes = prevNodes.map((n) => {
        if (n.id !== nodeId) return n;

        const currentData = (
          typeof n.data === "object" && n.data !== null ? n.data : {}
        ) as any;
        const updatedData = (
          typeof updates.data === "object" && updates.data !== null
            ? updates.data
            : {}
        ) as any;

        return {
          ...n,
          ...updates,
          data: {
            ...currentData,
            ...updatedData,
          },
        };
      });

      // Garantizar que solo un nodo tenga initialMessage=true
      if (updates.data?.initialMessage === true) {
        newNodes.forEach((n) => {
          if (n.id !== nodeId && n.data.initialMessage)
            n.data.initialMessage = false;
        });
      }

      // ---- Actualizar edges en función de la nueva estructura de nodos ----
      setEdges((prevEdges) => {
        let removedEdge = false;
        const filtered = prevEdges.filter((edge) => {
          const sourceNode = newNodes.find((n) => n.id === edge.source);
          const targetNode = newNodes.find((n) => n.id === edge.target);

          if (!sourceNode || !targetNode) {
            removedEdge = true;
            return false;
          }

          const isValid = validateConnection(sourceNode, targetNode, newNodes);
          if (!isValid) removedEdge = true;
          return isValid;
        });

        if (removedEdge) {
          toast.error(
            "Se eliminaron conexiones inválidas debido a cambios en la configuración del nodo"
          );
        }
        return filtered;
      });

      // ---- Sincronizar variables globales ----
      const newGlobalVars: Record<string, string> = {};
      newNodes.forEach((n) => {
        if (n.type === "captureResponse") {
          const varName = (n.data as any)?.variableName?.trim();
          if (varName) newGlobalVars[varName] = "";
        }
      });
      setGlobalVariables(newGlobalVars);

      return newNodes;
    });
  };

  // Keep global variables in sync when nodes are added/removed externally
  useEffect(() => {
    const vars: Record<string, string> = {};
    nodes.forEach((n) => {
      if (n.type === "captureResponse") {
        const varName = (n.data as any)?.variableName?.trim();
        if (varName) vars[varName] = "";
      }
    });
    setGlobalVariables(vars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const handleSave = () => {
    const workflowData = {
      name: currentWorkflowName || "Nuevo Flujo",
      workflowJson: { nodes, edges },
    };
    startTransition(async () => {
      let res;
      if (workflowId && workflowId.trim() !== "") {
        res = await updateChatWorkflow(workflowId, workflowData);
      } else {
        res = await createChatWorkflow(workflowData);
      }
      if (res?.status === 200) {
        toast.success("Flujo guardado correctamente");
        // If it was a new workflow, we could update the URL or state here
        // For now, just show success message
      } else {
        toast.error(res?.message || "Error al guardar el flujo");
      }
    });
  };

  // ---- Handle saving renamed workflow ----
  const handleRenameSave = async () => {
    const trimmed = (currentWorkflowName || "").trim();
    if (trimmed === "") {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    setIsEditingName(false);

    if (workflowId) {
      // Update only name keeping existing nodes/edges
      const res = await updateChatWorkflow(workflowId, {
        name: trimmed,
        workflowJson: { nodes, edges },
      });
      if (res?.status === 200) {
        toast.success("Nombre actualizado");
      } else {
        toast.error(res?.message || "Error al actualizar el nombre");
      }
    }
  };

  const sendTestMessage = async (phone: string) => {
    setIsTesting(true);
    try {
      const res = await fetch("/api/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Mensaje de prueba",
          from: phone,
          phone_number_id: agentData?.whatsappPhoneNumberId || "test_phone_id",
        }),
      });
      if (res.ok) {
        toast.success("Mensaje de prueba enviado");
      } else {
        toast.error("Error enviando mensaje de prueba");
      }
    } catch (e) {
      toast.error("Error enviando mensaje de prueba");
    } finally {
      setIsTesting(false);
      setIsTestDialogOpen(false);
    }
  };

  const handleTestButtonClick = () => {
    if (!agentData?.id) {
      toast.error("Este flujo no tiene un ChatAgent asignado. Asigna un agente antes de probar.");
      return;
    }
    setTestPhone("");
    setIsTestDialogOpen(true);
  };

  useEffect(() => {
    if (!agentData) {
      toast.warning(
        "Este flujo no tiene un agente asignado. Asigna uno para habilitar todas las funcionalidades."
      );
    }
  }, [agentData]);

  return (
    <div
      className="w-full h-full flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100"
      ref={reactFlowWrapper}
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          fitView
          minZoom={0.1}
          maxZoom={2}
          snapToGrid
          snapGrid={[20, 20]}
          className="h-full flex-1"
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: "#6366f1" },
            type: "smoothstep",
          }}
          connectionLineStyle={{ strokeWidth: 2, stroke: "#6366f1" }}
          onNodeClick={onNodeClick}
          onPaneClick={handlePaneClick}
        >
          <Background
            gap={24}
            size={1}
            color="#94a3b8"
            variant={BackgroundVariant.Dots}
          />

          {/* Header Toolbar */}
          <Panel position="top-center" className="m-6">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 px-6 py-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Workflow className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {isEditingName ? (
                        <>
                          <input
                            value={currentWorkflowName}
                            onChange={(e) => setCurrentWorkflowName(e.target.value)}
                            className="text-sm font-semibold text-gray-900 border border-gray-300 rounded px-1 py-0.5 w-40 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          <button
                            className="p-1 hover:bg-emerald-100 rounded"
                            onClick={handleRenameSave}
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-gray-900">{currentWorkflowName}</span>
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            onClick={() => setIsEditingName(true)}
                          >
                            <Pencil className="w-3 h-3 text-gray-500" />
                          </button>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Diseña tu flujo de conversación
                    </p>
                  </div>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleSave}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-1.5" />
                    )}
                    {isPending ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleTestButtonClick} disabled={isTesting}>
                    {isTesting ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3 mr-1.5" />
                    )}
                    Probar
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsAssignModalOpen(true)}>
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Panel>

          {/* Floating Add Button */}
          <Panel position="top-left" className="m-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
            >
              <Button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl rounded-2xl h-14 w-14 p-0 transition-all duration-300 border-0"
              >
                <motion.div
                  animate={{ rotate: isMenuOpen ? 45 : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Plus className="h-6 w-6" />
                </motion.div>
              </Button>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Agregar nodo (Espacio)
              </div>
            </motion.div>
          </Panel>

          <Controls
            className="bg-white/90 backdrop-blur-xl shadow-xl rounded-2xl border border-gray-200/50 overflow-hidden"
            showInteractive={false}
          />
        </ReactFlow>

        <AnimatePresence>
          {isMenuOpen && (
            <div className="absolute top-0 left-0 w-full h-screen bg-black/50 z-50">
              <NodeSelector
                onSelect={addNode}
                onClose={() => setIsMenuOpen(false)}
              />
            </div>
          )}
        </AnimatePresence>

        <NodeConfigurationSheet
          workflowChatAgentId={assignedAgentId}
          selectedNode={selectedNode}
          isOpen={!!selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
          updateNode={updateNode}
          workflowId={workflowId || ""}
          globalVariables={Object.keys(globalVariables)}
          onValidationStateChange={setHasConfigErrors}
          onSaveFlow={handleSave}
        />

        {/* Test Message Dialog */}
        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar mensaje de prueba</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                placeholder="Número WhatsApp destino (Ej: 573001234567)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTestDialogOpen(false)}
                disabled={isTesting}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => sendTestMessage(testPhone)}
                disabled={isTesting || testPhone.trim() === ""}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ReactFlowProvider>

      {/* Assign Agent Modal */}
      <AssignAgentModal
        open={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
        workflowId={workflowId || ""}
        onAgentAssigned={(id) => setAssignedAgentId(id)}
      />
    </div>
  );
}
