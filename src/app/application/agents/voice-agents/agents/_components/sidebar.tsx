"use client"

import * as React from "react"
import { User, Plus, Search, Bot, Sparkles, Users } from "lucide-react"
import type { Agent } from "@/types/agent"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AgentWithTools, useAgent } from "@/context/agent-context"
import { cn } from "@/lib/utils"

export function Sidebar({ agents: initialAgents }: { agents: Agent[] }) {
  const { selectedAgent, setSelectedAgent, setIsCreatingNew } = useAgent()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [agents, setAgents] = React.useState<Agent[]>(initialAgents)

  // Actualizar los agentes cuando cambien los initialAgents
  React.useEffect(() => {
    setAgents(initialAgents)
  }, [initialAgents])

  // Filtrar agentes basado en el término de búsqueda
  const filteredAgents = React.useMemo(() => {
    if (!Array.isArray(agents)) return []
    return agents.filter((agent) => agent.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [agents, searchTerm])

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent as AgentWithTools)
    setIsCreatingNew(false)
  }

  const handleNewAgent = () => {
    setSelectedAgent(null)
    setIsCreatingNew(true)
    if (typeof window !== "undefined" && window.openVoiceAgentTemplateDialog) {
      window.openVoiceAgentTemplateDialog()
    }
  }

  // Suscribirse a los cambios del agente seleccionado
  React.useEffect(() => {
    if (selectedAgent) {
      setAgents(prevAgents => 
        prevAgents.map(agent => 
          agent.id === selectedAgent.id ? selectedAgent : agent
        )
      )
    }
  }, [selectedAgent])

  return (
    <div className="h-screen w-[280px] border-r border-slate-300 shadow-xl">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-slate-300 backdrop-blur-sm">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-800 shadow-lg ring-1 ring-slate-600/50">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold">Agentes de Voz</h2>
              <p className="text-xs text-slate-400">Gestiona tus asistentes IA</p>
            </div>
          </div>

          {/* Botón Nuevo */}
          <div className="px-4 pb-4">
            <Button
              onClick={handleNewAgent}
              className="w-full bg-gradient-to-r from-indigo-700 to-purple-800 hover:from-indigo-800 hover:to-purple-900 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Nuevo Agente
            </Button>
          </div>

          {/* Buscador */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Buscar agentes..."
                className="pl-9 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-sm rounded-lg text-white placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                Tus Agentes ({filteredAgents.length})
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {!agents ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-sm text-slate-400 mt-3">Cargando agentes...</p>
                  </div>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <p className="text-sm font-medium text-slate-600 text-center mb-2">
                    {searchTerm ? "No se encontraron agentes" : "No tienes agentes aún"}
                  </p>
                  <p className="text-xs text-slate-400 text-center mb-4">
                    {searchTerm ? "Intenta con otro término de búsqueda" : "Crea tu primer agente de voz para comenzar"}
                  </p>
                </div>
              ) : (
                filteredAgents.map((agent: Agent) => (
                  <div
                    key={agent.id}
                    onClick={() => handleAgentSelect(agent)}
                    className={cn(
                      "group relative p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                      selectedAgent?.id === agent.id
                        ? "border-indigo-600/50 shadow-lg ring-1 ring-indigo-500/30"
                        : "hover:border-slate-600 hover:shadow-md",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                          selectedAgent?.id === agent.id
                            ? "bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg ring-1 ring-indigo-500/50"
                            : "bg-slate-700 group-hover:bg-slate-600",
                        )}
                      >
                        <Sparkles
                          className={cn(
                            "h-5 w-5 transition-colors",
                            selectedAgent?.id === agent.id ? "text-white" : "text-slate-300",
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium truncate transition-colors",
                          )}
                        >
                          {agent.name}
                        </p>
                        <p
                          className={cn(
                            "text-xs truncate transition-colors",
                            selectedAgent?.id === agent.id ? "text-slate-300" : "text-slate-400",
                          )}
                        >
                          ID: {agent.id}
                        </p>
                      </div>
                      {selectedAgent?.id === agent.id && (
                        <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm animate-pulse" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
