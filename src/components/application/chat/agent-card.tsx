import { MessageSquare, Phone, Clock, BarChart2, CheckCircle, XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

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

interface AgentCardProps {
  agent: ChatAgent
}

export default function AgentCard({ agent }: AgentCardProps) {
  console.log(agent)
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className={`h-1.5 ${agent.isActive ? "bg-primary" : "bg-muted"}`}></div>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{agent.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 h-10">{agent.description || "Sin descripción"}</p>
          </div>
          <Badge variant={agent.isActive ? "default" : "outline"}>
            {agent.isActive ? (
              <CheckCircle className="mr-1 h-3 w-3" />
            ) : (
              <XCircle className="mr-1 h-3 w-3 text-muted-foreground" />
            )}
            {agent.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="h-4 w-4 mr-2 text-primary" />
            <span>{agent.phoneNumber}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 p-2 rounded-md">
            <MessageSquare className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Mensajes</p>
            <p className="font-semibold">{agent.totalMessages.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 p-2 rounded-md">
            <BarChart2 className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Chats Activos</p>
            <p className="font-semibold">{agent.activeChats}</p>
          </div>
          <div className="bg-muted/50 p-2 rounded-md">
            <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Tiempo Resp.</p>
            <p className="font-semibold">{agent.averageResponseTime}s</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 px-6 py-3">
        <Link href={`/application/agents/chat/conversaciones/${agent.id}`} className="w-full">
          <Button variant="outline" className="w-full flex items-center justify-center gap-2">
            Entrar a conversaciones
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
