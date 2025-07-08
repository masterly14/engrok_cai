"use client";

import * as React from "react";
import { Plus, Search, Bot, MessageSquare, Users } from "lucide-react";
import type { ChatAgentWithWorkflows } from "@/types/agent";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useChatAgent } from "@/context/chat-agent-context";
import { cn } from "@/lib/utils";
import { useAllChatAgents } from "@/hooks/use-all-chat-agents";

export function Sidebar({
  agents: initialAgents,
}: {
  agents: ChatAgentWithWorkflows[];
}) {
  const { selectedChatAgent, setSelectedChatAgent, setIsCreatingNew } =
    useChatAgent();
  const { data: agents, isLoading } = useAllChatAgents();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredAgents = React.useMemo(() => {
    if (!Array.isArray(agents)) return [];
    return agents.filter((agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [agents, searchTerm]);

  const handleAgentSelect = (agent: ChatAgentWithWorkflows) => {
    setSelectedChatAgent(agent);
    setIsCreatingNew(false);
  };

  const handleNewAgent = () => {
    setSelectedChatAgent(null);
    setIsCreatingNew(true);
  };

  return (
    <div className="h-screen w-[280px] border-r bg-card shadow-xl">
      <div className="flex flex-col h-full">
        <div className="border-b backdrop-blur-sm">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-sky-700 to-slate-800 shadow-lg ring-1 ring-slate-600/50">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold">Agentes de Chat</h2>
              <p className="text-xs text-muted-foreground">
                Gestiona tus chatbots
              </p>
            </div>
          </div>

          <div className="px-4 pb-4">
            <Button
              onClick={handleNewAgent}
              className="w-full bg-gradient-to-r from-blue-700 to-sky-800 hover:from-blue-800 hover:to-sky-900 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Nuevo Agente
            </Button>
          </div>

          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Buscar agentes..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Tus Agentes ({filteredAgents?.length || 0})
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <LoadingSpinner />
                  <p className="text-sm text-muted-foreground mt-3">
                    Cargando agentes...
                  </p>
                </div>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <p className="text-sm font-medium text-center mb-2">
                  {searchTerm
                    ? "No se encontraron agentes"
                    : "No tienes agentes aún"}
                </p>
                <p className="text-xs text-muted-foreground text-center mb-4">
                  {searchTerm
                    ? "Intenta con otro término de búsqueda"
                    : "Crea tu primer agente de chat para comenzar"}
                </p>
              </div>
            ) : (
              filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent)}
                  className={cn(
                    "group relative p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                    selectedChatAgent?.id === agent.id
                      ? "bg-muted border-blue-600/50 shadow-lg"
                      : "border-transparent hover:border-border hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                        selectedChatAgent?.id === agent.id
                          ? "bg-gradient-to-br from-blue-600 to-sky-700 shadow-lg"
                          : "bg-muted group-hover:bg-background",
                      )}
                    >
                      <Bot
                        className={cn(
                          "h-5 w-5 transition-colors",
                          selectedChatAgent?.id === agent.id
                            ? "text-white"
                            : "text-muted-foreground",
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {agent.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        ID: {agent.id}
                      </p>
                    </div>
                    {agent.isActive && (
                      <div
                        className="h-2 w-2 rounded-full bg-green-400 shadow-sm"
                        title="Activo"
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
