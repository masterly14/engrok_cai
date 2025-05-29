"use client"

import { useState } from "react"
import { PlusCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import AgentList from "@/components/application/chat/agent-list"

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agentes de Chat</h1>
            <p className="text-muted-foreground mt-1">Gestione sus agentes de chat y sus conversaciones</p>
          </div>
          <Link href="/application/agents/chat/crear">
            <Button className="flex items-center gap-2">
              <PlusCircle size={18} />
              Crear Agente
            </Button>
          </Link>
        </div>

        <div className="relative mb-6 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="Buscar agentes..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <AgentList searchTerm={searchTerm} />
      </div>
    </div>
  )
}
