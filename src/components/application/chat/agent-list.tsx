"use client"
import { useAllChatAgents } from "@/hooks/use-all-chat-agents"
import AgentCard from "./agent-card"

// Tipo para los agentes de chat
type ChatAgent = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  phoneNumber: string
  totalMessages: number
  activeChats: number
  averageResponseTime: number
  createdAt: Date
}

interface AgentListProps {
  searchTerm: string
}

export default function AgentList({ searchTerm }: AgentListProps) {
  // Datos de ejemplo - en una aplicación real, estos vendrían de una API
  const { chatAgentsData } =  useAllChatAgents();

  // Filtrar agentes según el término de búsqueda
  const filteredAgents = chatAgentsData?.data?.filter((agent) => agent.name.toLowerCase().includes(searchTerm.toLowerCase())) ?? []

  return (
    <>
      {filteredAgents.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <p className="text-muted-foreground">No se encontraron agentes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </>
  )
}
