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
import AINode from "./nodes/ai-node"; // Importar el nuevo nodo
import integrationNode from "./nodes/integration-node";
import ReminderNode from "./nodes/reminder-node"; // Importar el nodo de recordatorio

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
import { NodeSelector } from "./node-selector";
import { NodeConfigurationSheet } from "./node-configuration/node-configuration-sheet";
import { useChatWorkflowData } from "./hooks/use-chat-workflow-data";
import { createChatWorkflow, updateChatWorkflow } from "@/actions/chat-agents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssignAgentModal } from "./assign-agent-modal";
import { onBoardUser } from "@/actions/user";

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

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
  integration: integrationNode,
  ai: AINode, // Registrar el nuevo nodo
  reminder: ReminderNode, // Registrar el nodo de recordatorio
};

const validateConnection = (
  sourceNode: Node,
  targetNode: Node,
  allNodes: Node[],
): boolean => {
  if (sourceNode.type === "trigger") {
    if (targetNode.type !== "conversation") {
      toast.error(
        "El nodo Trigger solo puede conectarse a un nodo de Conversación.",
      );
      return false;
    }
    if (!targetNode.data.initialMessage) {
      toast.error(
        "El nodo Trigger solo puede conectarse al primer nodo de Conversación del flujo.",
      );
      return false;
    }
  }
  if (targetNode.data.initialMessage && targetNode.type === "conversation") {
    if (sourceNode.type !== "trigger") {
      toast.error(
        "El primer nodo de Conversación solo puede recibir conexiones desde un nodo Trigger.",
      );
      return false;
    }
  }
  if (
    sourceNode.type === "captureResponse" &&
    targetNode.type === "captureResponse"
  ) {
    toast.error(
      "No puedes conectar dos nodos de captura de respuesta entre sí",
    );
    return false;
  }
  if (sourceNode.type === "turnOffAgent") {
    toast.error("El nodo de finalización no puede tener conexiones salientes");
    return false;
  }
  if (sourceNode.type === "handoverToHuman") {
    toast.error("El nodo de handover no puede tener conexiones salientes");
    return false;
  }
  return true;
};

export function FlowBuilder({ workflowId }: { workflowId?: string }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[] | any>(
    initialNodes,
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
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);

  // State for AI Node connection modal
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(
    null,
  );
  const [conditionInputValue, setConditionInputValue] = useState("");
  const [conditionSuggestion, setConditionSuggestion] = useState("");

  const {
    workflowName: loadedWorkflowName,
    agentData,
    workflowAgentId,
  } = useChatWorkflowData({
    workflowId,
    setNodes,
    setEdges,
  });
  const [currentWorkflowName, setCurrentWorkflowName] =
    useState<string>(loadedWorkflowName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [assignedAgentId, setAssignedAgentId] =
    useState<string>(workflowAgentId);

  useEffect(() => {
    setAssignedAgentId(workflowAgentId);
  }, [workflowAgentId]);

  useEffect(() => {
    setCurrentWorkflowName(loadedWorkflowName);
  }, [loadedWorkflowName]);

  useEffect(() => {
    if (workflowId) {
      setNodes([]);
      setEdges([]);
    }
  }, [workflowId, setNodes, setEdges]);

  useEffect(() => {
    hasConfigErrorsRef.current = hasConfigErrors;
  }, [hasConfigErrors]);

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

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);

      if (!sourceNode || !targetNode) {
        toast.error("Error al validar la conexión");
        return;
      }

      if (!validateConnection(sourceNode, targetNode, nodes)) {
        return;
      }

      // --- LÓGICA ESPECIAL PARA NODO DE IA ---
      if (sourceNode.type === "ai") {
        setPendingConnection(params);
        const handleId = params.sourceHandle;
        let suggestion = "";
        if (handleId === "fallback") {
          suggestion = "Si no se cumple ninguna otra condición";
        } else {
          suggestion = "Ej: si el usuario pide hablar con un humano";
        }
        setConditionSuggestion(suggestion);
        setConditionInputValue("");
        setIsConditionModalOpen(true);
        return; // Detenemos la ejecución para esperar el input del modal
      }
      // --- FIN LÓGICA ESPECIAL ---

      let triggerMessage: string | undefined;
      if (sourceNode.type === "conversation" && params.sourceHandle) {
        const buttons = (sourceNode.data as any)?.interactiveButtons || [];
        const matchedBtn = buttons.find(
          (b: any) => b.id === params.sourceHandle,
        );
        if (matchedBtn) {
          triggerMessage = matchedBtn.payload || matchedBtn.title;
        }
      }
      if (sourceNode.type === "condition" && params.sourceHandle) {
        if (params.sourceHandle === "success") {
          triggerMessage = (sourceNode.data as any)?.statusSuccess || "success";
        } else if (params.sourceHandle === "error") {
          triggerMessage = (sourceNode.data as any)?.statusError || "error";
        }
      }
      if (sourceNode.type === "apiRequest" && params.sourceHandle) {
        if (params.sourceHandle === "success") {
          triggerMessage = (sourceNode.data as any)?.statusSuccess || "success";
        } else if (params.sourceHandle === "error") {
          triggerMessage = (sourceNode.data as any)?.statusError || "error";
        }
      }

      if (triggerMessage) {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === targetNode.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  userResponse: triggerMessage,
                  isUserResponseAuto: true,
                },
              };
            }
            return n;
          }),
        );
      }
      setEdges((eds) => addEdge(params, eds));
    },
    [nodes, setEdges, setNodes],
  );

  const handleConfirmCondition = () => {
    if (
      !pendingConnection ||
      !pendingConnection.source ||
      !pendingConnection.target
    ) {
      toast.error("Conexión inválida. Inténtalo de nuevo.");
      setIsConditionModalOpen(false);
      setPendingConnection(null);
      return;
    }
    if (!conditionInputValue.trim()) {
      toast.error("La condición no puede estar vacía.");
      return;
    }

    const newEdge: Edge = {
      id: `edge-${uuidv4()}`,
      source: pendingConnection.source,
      target: pendingConnection.target,
      sourceHandle: pendingConnection.sourceHandle,
      targetHandle: pendingConnection.targetHandle,
      label: conditionInputValue,
      type: "smoothstep",
      data: {
        condition: conditionInputValue,
      },
    };

    setEdges((eds) => addEdge(newEdge, eds));

    // Reset modal state
    setIsConditionModalOpen(false);
    setPendingConnection(null);
    setConditionInputValue("");
    setConditionSuggestion("");
  };

  const addNode = useCallback(
    async (nodeType: string) => {
      if (!reactFlowInstance) return;
      if (
        nodes.length === 0 &&
        !["conversation", "trigger", "ai"].includes(nodeType)
      ) {
        toast.error(
          "El primer nodo de un flujo debe ser de tipo 'Conversación' o 'Trigger' o 'AI'.",
        );
        return;
      }
      const centerX = reactFlowWrapper.current!.clientWidth / 2;
      const centerY = reactFlowWrapper.current!.clientHeight / 2;
      const randomOffset = () => (Math.random() - 0.5) * 150;
      const position = reactFlowInstance.project({
        x: centerX + randomOffset(),
        y: centerY + randomOffset(),
      });

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
          initialMessage: !nodes.some((n) => n.data?.initialMessage),
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
          url: process.env.NEXT_PUBLIC_BASE_URL
            ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/crm/contacts${crmUrlSuffix}`
            : `/api/crm/contacts${crmUrlSuffix}`,
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
      if (nodeType === "ai")
        defaultData = {
          ...defaultData,
          name: "Inteligencia Artificial",
          prompt:
            "Eres un asistente de IA. Tu objetivo es resolver las dudas del usuario.",
          conditions: [], // Inicialmente sin condiciones de salida
        };
      if (nodeType === "reminder")
        defaultData = {
          ...defaultData,
          name: "New Reminder",
          delay: 60, // 1 minute default
          delayUnit: "seconds",
          botResponse: "",
          userResponse: "",
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
    [reactFlowInstance, setNodes, nodes],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const updateNode = useCallback(
    (nodeId: string, updates: any) => {
      setNodes((prevNodes) => {
        const newNodes = prevNodes.map((n) => {
          if (n.id !== nodeId) return n;
          const currentData = (
            typeof n.data === "object" && n.data !== null ? n.data : {}
          ) as any;
          const updatedData =
            typeof updates.data === "object" && updates.data !== null
              ? updates.data
              : ({} as any);
          return {
            ...n,
            ...updates,
            data: {
              ...currentData,
              ...updatedData,
            },
          };
        });
        if (updates.data?.initialMessage === true) {
          newNodes.forEach((n) => {
            if (n.id !== nodeId && n.data.initialMessage)
              n.data.initialMessage = false;
          });
        }
        setEdges((prevEdges) => {
          let removedEdge = false;
          const filtered = prevEdges.filter((edge) => {
            const sourceNode = newNodes.find((n) => n.id === edge.source);
            const targetNode = newNodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) {
              removedEdge = true;
              return false;
            }
            const isValid = validateConnection(
              sourceNode,
              targetNode,
              newNodes,
            );
            if (!isValid) removedEdge = true;
            return isValid;
          });
          if (removedEdge) {
            toast.error(
              "Se eliminaron conexiones inválidas debido a cambios en la configuración del nodo",
            );
          }
          return filtered;
        });
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
    },
    [setNodes, setEdges, setGlobalVariables],
  );

  useEffect(() => {
    const vars: Record<string, string> = {};
    nodes.forEach((n) => {
      if (n.type === "captureResponse") {
        const varName = (n.data as any)?.variableName?.trim();
        if (varName) vars[varName] = "";
      }
    });
    setGlobalVariables(vars);
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
      } else {
        toast.error(res?.message || "Error al guardar el flujo");
      }
    });
  };

  const handleRenameSave = async () => {
    const trimmed = (currentWorkflowName || "").trim();
    if (trimmed === "") {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    setIsEditingName(false);
    if (workflowId) {
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
    const user = await onBoardUser();
    setIsTesting(true);
    try {
      const res = await fetch("/api/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Mensaje de prueba",
          from: phone,
          phone_number_id: agentData?.whatsappPhoneNumberId || "test_phone_id",
          userId: user?.data.id,
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
      toast.error(
        "Este flujo no tiene un ChatAgent asignado. Asigna un agente antes de probar.",
      );
      return;
    }
    setTestPhone("");
    setIsTestDialogOpen(true);
  };

  useEffect(() => {
    if (!agentData) {
      toast.warning(
        "Este flujo no tiene un agente asignado. Asigna uno para habilitar todas las funcionalidades.",
      );
    }
  }, [agentData]);

  useEffect(() => {
    if (selectedNode?.type === "ai") {
      const fetchKnowledgeBases = async () => {
        const res = await fetch("/api/knowledge-bases");
        const data = await res.json();
        setKnowledgeBases(data);
      };
      fetchKnowledgeBases();
    }
  }, [selectedNode]);

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
                            onChange={(e) =>
                              setCurrentWorkflowName(e.target.value)
                            }
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
                          <span className="text-sm font-semibold text-gray-900">
                            {currentWorkflowName}
                          </span>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleTestButtonClick}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3 mr-1.5" />
                    )}
                    Probar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsAssignModalOpen(true)}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Panel>
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
          knowledgeBases={knowledgeBases}
        />
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

        {/* Modal para la condición del AI Node */}
        <Dialog
          open={isConditionModalOpen}
          onOpenChange={setIsConditionModalOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Definir Condición de Transición</DialogTitle>
              <DialogDescription>
                Describe la condición que debe cumplirse para seguir esta ruta
                desde el nodo de IA.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="condition-input">Condición</Label>
              <Input
                id="condition-input"
                value={conditionInputValue}
                onChange={(e) => setConditionInputValue(e.target.value)}
                placeholder={
                  conditionSuggestion ||
                  "Ej: Si el usuario pide hablar con un humano"
                }
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                Sugerencia: {conditionSuggestion}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsConditionModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmCondition}>
                Confirmar Conexión
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ReactFlowProvider>
      <AssignAgentModal
        open={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
        workflowId={workflowId || ""}
        onAgentAssigned={(id) => setAssignedAgentId(id)}
      />
    </div>
  );
}
