import {
  MessageSquare,
  Phone,
  Clock,
  BarChart2,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Product } from "@prisma/client";
import AssignProductsModal from "@/components/application/chat/assign-products-modal";

// Tipo para los agentes de chat
type ChatAgent = {
  id: string;
  name: string;
  isActive: boolean;
  phoneNumber: string;
  type: string;
  totalMessages: number;
  activeChats: number;
  averageResponseTime: number;
  createdAt: Date;
  products: Product[];
};

interface AgentCardProps {
  agent: ChatAgent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div
        className={`h-1.5 ${agent.isActive ? "bg-primary" : "bg-muted"}`}
      ></div>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{agent.name}</h3>
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
            <p className="font-semibold">
              {agent.totalMessages.toLocaleString()}
            </p>
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
      <CardFooter className="bg-muted/20 px-6 py-3 flex flex-col gap-2">
        <Link
          href={`/application/agents/chat/conversaciones/${agent.id}`}
          className="w-full"
        >
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 bg-muted-foreground"
            disabled={agent.products.length === 0}
          >
            Entrar a conversaciones
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        {agent.type === "SALES" && (
          <div className="w-full space-y-2">
            {agent.products.length > 0 && (
              <Link
                href={`/application/agents/chat/products/${agent.id}`}
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  Mis productos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {agent.products.length === 0 && (
              <>
              <div className="flex items-center justify-center gap-2 border rounded-md p-2 border-b">
                <p className="text-xs text-muted-foreground">
                  Este agente no tiene productos asignados. Agrega prodouctos para que pueda empezar a vender. El proceso es muy sencillo, toca el siguiente boton para agregar productos.
                </p>
              </div>
                <AssignProductsModal
                  agentId={agent.id}
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 bg-blue-500"
                    >
                      Asignar productos
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  }
                />
              </>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
