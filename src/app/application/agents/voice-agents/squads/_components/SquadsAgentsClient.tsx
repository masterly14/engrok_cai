"use client";

import type React from "react";

import { useCallback, useEffect, useState, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  Handle,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAllAgents } from "@/hooks/use-all-agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSquad } from "@/context/squad-context";
import {
  Check,
  Plus,
  User,
  Bot,
  Sparkles,
  Users,
  Zap,
  Crown,
  Calendar,
  Settings,
  Activity,
} from "lucide-react";
import { createSquad } from "@/actions/squads";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";

interface CreateSquadParams {
  name: string;
  agentIds: string[];
  edges: Edge[];
}

// Custom Node Component
function AgentNode({ data, selected }: { data: any; selected: boolean }) {
  const isFirst = data.label?.includes("Primer agente");

  return (
    <div
      className={`relative group transition-all duration-300 ${
        selected ? "scale-105" : "hover:scale-102"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gradient-to-r from-blue-500 to-purple-500 !border-2 !border-white shadow-lg"
      />

      <div
        className={`
        relative px-6 py-4 rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer
        ${
          isFirst
            ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-yellow-200/50"
            : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-blue-200/50"
        }
        ${selected ? "shadow-xl scale-105" : "hover:shadow-xl"}
        min-w-[180px] backdrop-blur-sm
      `}
      >
        {/* Crown icon for first agent */}
        {isFirst && (
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Crown className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Main icon */}
        <div
          className={`
          w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto
          ${
            isFirst
              ? "bg-gradient-to-br from-yellow-400 to-orange-500"
              : "bg-gradient-to-br from-blue-500 to-indigo-600"
          }
          shadow-lg
        `}
        >
          {isFirst ? (
            <Sparkles className="w-6 h-6 text-white" />
          ) : (
            <Bot className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Agent name */}
        <div className="text-center">
          <h3 className="font-semibold text-gray-800 text-sm leading-tight">
            {data.label?.replace(" - Primer agente", "") || "Agente"}
          </h3>
          {isFirst && (
            <span className="text-xs text-yellow-600 font-medium mt-1 block">
              Líder del Squad
            </span>
          )}
        </div>

        {/* Glow effect */}
        <div
          className={`
          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
          ${
            isFirst
              ? "bg-gradient-to-br from-yellow-400/20 to-orange-500/20"
              : "bg-gradient-to-br from-blue-500/20 to-indigo-600/20"
          }
        `}
        />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gradient-to-r from-purple-500 to-pink-500 !border-2 !border-white shadow-lg"
      />
    </div>
  );
}

const nodeTypes = {
  agentNode: AgentNode,
};

// Configuración por agente incluyendo flags para usar valores por defecto del agente
interface AgentConfig {
  initialMessage: string;
  leaveMessage: string;
  agentPrompt: string;
  useDefaultInitialMessage: boolean;
  useDefaultAgentPrompt: boolean;
}

const defaultAgentConfig: AgentConfig = {
  initialMessage: "",
  leaveMessage: "",
  agentPrompt: "",
  useDefaultInitialMessage: false,
  useDefaultAgentPrompt: false,
};

export default function SquadsAgentsClient() {
  const { agentsData, agentsLoading, agentsError } = useAllAgents();
  const { isCreatingNew, selectedSquad } = useSquad();
  const [flowName, setFlowName] = useState("");

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentSheetOpen, setAgentSheetOpen] = useState(false);

  // Configuración por agente
  const [agentConfigs, setAgentConfigs] = useState<Record<string, AgentConfig>>({});

  // Compute the name of the agent that the selected agent connects to (outgoing edge)
  const selectedAgentTargetName = useMemo(() => {
    if (!selectedAgentId) return null;
    const outgoingEdge = edges.find((e) => e.source === selectedAgentId);
    if (!outgoingEdge) return null;
    const targetAgentId = outgoingEdge.target;
    if (Array.isArray(agentsData)) {
      const targetAgent = (agentsData as any).find((a: any) => a.id === targetAgentId);
      return targetAgent?.name ?? null;
    }
    return null;
  }, [selectedAgentId, edges, agentsData]);

  const hasOutgoing = Boolean(selectedAgentTargetName);

  // Get selected agent data
  const selectedAgentData =
    selectedAgentId && Array.isArray(agentsData)
      ? agentsData.find((agent: any) => agent.id === selectedAgentId)
      : null;

  useEffect(() => {
    const squadAgents = (selectedSquad as any)?.agents as any[] | undefined;
    if (!isCreatingNew && selectedSquad && Array.isArray(squadAgents)) {
      const generated: Node[] = squadAgents.map((as: any, idx: number) => {
        const nodesPerRow = 3;
        const x = (idx % nodesPerRow) * 300 + 100;
        const y = Math.floor(idx / nodesPerRow) * 200 + 100;
        return {
          id: as.agentId,
          type: "agentNode",
          data: { label: as.agent?.name || "Agente" },
          position: { x, y },
        } as Node;
      });
      setNodes(generated);
      setEdges([]);
    }
  }, [selectedSquad, isCreatingNew]);

  useEffect(() => {
    if (isCreatingNew && nodes.length === 0) {
      setAgentModalOpen(true);
    }
  }, [isCreatingNew, nodes.length]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          type: "smoothstep",
          animated: true,
          style: {
            stroke: "#6366f1",
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.Arrow,
            color: "#6366f1",
          },
        },
        eds
      )
    );
  }, []);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedAgentId(node.id);
    setAgentSheetOpen(true);
  }, []);

  const handleSaveSquad = async () => {
    if (!flowName.trim()) {
      toast.error("Ponle un nombre a tu squad");
      return;
    }

    if (nodes.length < 2) {
      toast.error("Necesitas al menos dos agentes en el flujo");
      return;
    }

    const agentIds = nodes.map((n) => n.id);

    const simplifiedEdges = edges.map(({ id, source, target, type }) => ({
      id,
      source,
      target,
      type,
    }));

    const payload: CreateSquadParams = {
      name: flowName,
      agentIds,
      edges: simplifiedEdges,
    };

    // Construimos la lista de miembros para Vapi teniendo en cuenta destinos y mensajes
    const vapiMembers = nodes
      .map((n) => {
        if (!Array.isArray(agentsData)) return null;

        const agent: any = (agentsData as any).find((a: any) => a.id === n.id);
        if (!agent?.vapiId) return null;

        const cfg = agentConfigs[n.id] ?? defaultAgentConfig;

        const firstMessage = cfg.useDefaultInitialMessage ? agent.firstMessage : cfg.initialMessage;
        const promptMessage = cfg.useDefaultAgentPrompt ? agent.prompt : cfg.agentPrompt;

        // Buscar destinos salientes para este agente
        const outgoing = edges.filter((e) => e.source === n.id);

        const member: any = {
          assistantId: agent.vapiId,
          assistantOverrides: {
            voice: {
              provider: "11labs",
              voiceId: agent.voiceId ?? "",
            },
            firstMessage: firstMessage ?? "",
            model: {
              provider: "groq",
              model: "gemma2-9b-it",
              messages: [
                {
                  role: "system",
                  content: promptMessage ?? "",
                },
              ],
              emotionRecognitionEnabled: true,
            },
          },
        };

        if (outgoing.length > 0) {
          member.assistantDestinations = outgoing.map((edge) => {
            const target = (agentsData as any).find((a: any) => a.id === edge.target);
            return {
              type: "assistant",
              assistantName: target?.name ?? "",
              message: cfg.leaveMessage ?? "",
              transferMode: "swap-system-message-in-history",
              description: "",
            };
          });
        }

        return member;
      })
      .filter(Boolean) as any[];

    // Validamos que todos los agentes tengan vapiId
    if (vapiMembers.length !== nodes.length) {
      toast.error("Asegúrate de que todos los agentes tengan un vapiId configurado");
      return;
    }

    console.log(vapiMembers);
    try {
      // Llamado a la API de Vapi para crear el Squad
      const response = await fetch("https://api.vapi.ai/squad", {
        method: "POST",
        headers: {
          Authorization: `Bearer b7ce0ac9-16ee-41cd-894c-f460f9ab53a4`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          members: vapiMembers,
          name: flowName,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        console.error(body);
        toast.error("Error al crear el squad en Vapi");
        return;
      }

      console.log(body);

      // Guardamos el squad en nuestra base de datos interna
      await createSquad(payload, body.id);

      toast.success("Squad creado correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error al crear el squad");
    }
  };

  const addAgentNode = (agentId: string, label?: string) => {
    if (!agentId) return;
    if (nodes.find((n) => n.id === agentId)) {
      toast.error("El agente ya está en el flujo");
      return;
    }
    const idx = nodes.length;
    const nodesPerRow = 3;
    const x = (idx % nodesPerRow) * 300 + 100;
    const y = Math.floor(idx / nodesPerRow) * 200 + 100;
    const agentInfo = Array.isArray(agentsData)
      ? agentsData.find((a: any) => a.id === agentId)
      : null;
    const nodeLabel = label ?? agentInfo?.name ?? "Agente";
    const newNode: Node = {
      id: agentId,
      type: "agentNode",
      data: { label: nodeLabel },
      position: { x, y },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Cargando agentes...</span>
        </div>
      </div>
    );
  }

  if (agentsError) {
    return <p className="p-6 text-sm text-red-500">Error cargando agentes</p>;
  }

  // Placeholder when no squad in view
  if (!selectedSquad && !isCreatingNew) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 shadow-lg">
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              No hay Squad seleccionado
            </h2>
            <p className="text-slate-600">
              Selecciona un Squad en la barra lateral o crea uno nuevo para
              comenzar a construir tu equipo de agentes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {isCreatingNew && (
        <div className="border-b border-slate-200/60 backdrop-blur-sm bg-white/80 shadow-sm">
          <div className="p-6">
            {/* Header with gradient */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Crear Nuevo Squad
                </h1>
                <p className="text-sm text-slate-600">
                  Conecta agentes para crear flujos de trabajo inteligentes
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 items-center flex-wrap">
              <div className="relative">
                <Input
                  placeholder="Nombre del squad"
                  className="pl-10 max-w-xs border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 bg-white/80 backdrop-blur-sm"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                />
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>

              <Button
                variant="outline"
                onClick={() => setAgentModalOpen(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Agente
              </Button>

              <Button
                onClick={handleSaveSquad}
                disabled={!flowName.trim() || nodes.length < 2}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Check className="h-4 w-4 mr-2" />
                Guardar Squad
              </Button>

              {nodes.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-white/60 px-3 py-2 rounded-lg">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>
                    {nodes.length} agente{nodes.length !== 1 ? "s" : ""} en el
                    squad
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-transparent"
        >
          {/* Custom gradient definition for edges */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          <MiniMap
            pannable
            zoomable
            className="!bg-white/80 !border-slate-200 !rounded-lg !shadow-lg backdrop-blur-sm"
            nodeColor={(node) => {
              const isFirst = node.data?.label?.includes("Primer agente");
              return isFirst ? "#f59e0b" : "#3b82f6";
            }}
          />
          <Controls className="!bg-white/80 !border-slate-200 !rounded-lg !shadow-lg backdrop-blur-sm" />
          <Background gap={20} size={1} />
        </ReactFlow>
      </div>

      {/* Agent selection modal */}
      <Dialog open={agentModalOpen} onOpenChange={setAgentModalOpen}>
        <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-md w-full bg-white/95 backdrop-blur-sm border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              Selecciona un agente
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full">
            <div className="grid gap-3 p-2">
              {Array.isArray(agentsData) &&
                agentsData
                  .filter((agent: any) => !nodes.find((n) => n.id === agent.id))
                  .map((agent: any) => (
                    <Button
                      key={agent.id}
                      variant="outline"
                      className="justify-start gap-3 h-auto p-4 border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                      onClick={() => {
                        const isFirst = nodes.length === 0;
                        addAgentNode(
                          agent.id,
                          isFirst ? `${agent.name} - Primer agente` : agent.name
                        );
                        setAgentModalOpen(false);
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium text-slate-900">
                          {agent.name}
                        </span>
                        {nodes.length === 0 && (
                          <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                            <Crown className="w-3 h-3" />
                            Será el líder del squad
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
              {Array.isArray(agentsData) &&
                agentsData.length === nodes.length && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Check className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">
                      No hay más agentes para añadir
                    </p>
                  </div>
                )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Agent Details Sheet */}
      <Sheet open={agentSheetOpen} onOpenChange={setAgentSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-white/95 backdrop-blur-sm">
          <SheetHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-xl font-bold text-slate-900">
                  {selectedAgentData?.name || "Agente"}
                </SheetTitle>
                <SheetDescription className="text-slate-600">
                  Configura la información del agente
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6 p-6">
            <Accordion type="single" className="w-full" collapsible>
              <AccordionItem value="destination-config">
                <AccordionTrigger className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configuración
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {hasOutgoing && (
                    <div className="flex items-center gap-2 bg-slate-100/60 p-3 rounded-lg text-sm text-slate-700">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>
                        Se conectará con
                        <span className="font-medium text-slate-900"> {selectedAgentTargetName}</span>
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Mensaje inicial del agente</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">Usar por defecto</span>
                        <Switch
                          checked={agentConfigs[selectedAgentId as string]?.useDefaultInitialMessage ?? false}
                          onCheckedChange={(checked) =>
                            selectedAgentId &&
                            setAgentConfigs((prev) => ({
                              ...prev,
                              [selectedAgentId as string]: {
                                ...(prev[selectedAgentId as string] ?? defaultAgentConfig),
                                useDefaultInitialMessage: checked,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <Textarea
                      placeholder="Mensaje de bienvenida o inicio"
                      disabled={agentConfigs[selectedAgentId as string]?.useDefaultInitialMessage}
                      className={agentConfigs[selectedAgentId as string]?.useDefaultInitialMessage ? "opacity-50" : ""}
                      value={agentConfigs[selectedAgentId as string]?.initialMessage ?? ""}
                      onChange={(e) =>
                        selectedAgentId &&
                        setAgentConfigs((prev) => ({
                          ...prev,
                          [selectedAgentId as string]: {
                            ...(prev[selectedAgentId as string] ?? defaultAgentConfig),
                            initialMessage: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  {hasOutgoing && (
                    <div className="space-y-2">
                      <Label>Mensaje que este agente dejará al siguiente</Label>
                      <Textarea
                        placeholder="Mensaje para el siguiente agente"
                        value={agentConfigs[selectedAgentId as string]?.leaveMessage ?? ""}
                        onChange={(e) =>
                          selectedAgentId &&
                          setAgentConfigs((prev) => ({
                            ...prev,
                            [selectedAgentId as string]: {
                              ...(prev[selectedAgentId as string] ?? defaultAgentConfig),
                              leaveMessage: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Prompt del agente</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">Usar por defecto</span>
                        <Switch
                          checked={agentConfigs[selectedAgentId as string]?.useDefaultAgentPrompt ?? false}
                          onCheckedChange={(checked) =>
                            selectedAgentId &&
                            setAgentConfigs((prev) => ({
                              ...prev,
                              [selectedAgentId as string]: {
                                ...(prev[selectedAgentId as string] ?? defaultAgentConfig),
                                useDefaultAgentPrompt: checked,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <Textarea
                      placeholder="Prompt personalizado para este agente"
                      disabled={agentConfigs[selectedAgentId as string]?.useDefaultAgentPrompt}
                      className={agentConfigs[selectedAgentId as string]?.useDefaultAgentPrompt ? "opacity-50" : ""}
                      value={agentConfigs[selectedAgentId as string]?.agentPrompt ?? ""}
                      onChange={(e) =>
                        selectedAgentId &&
                        setAgentConfigs((prev) => ({
                          ...prev,
                          [selectedAgentId as string]: {
                            ...(prev[selectedAgentId as string] ?? defaultAgentConfig),
                            agentPrompt: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
