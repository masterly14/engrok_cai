"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Phone,
  Mic,
  Clock,
  MessageSquare,
  Globe,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Database,
  User,
  Plus,
  Grid3X3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInboundAgents } from "@/hooks/use-inbound-agents";
import { Button } from "@/components/ui/button";
import { useOutboundAgents } from "@/hooks/use-outbound-agents";
import { useAllAgents } from "@/hooks/use-all-agents";
import ConfigureAgentDialog from "./configure-dialog";
import { Agent } from "@prisma/client";
import { useWidgetAgents } from "@/hooks/use-widget-agents";
import { CallPhoneDialog } from "./phone-dialog";

type AgentType = "inbound" | "outbound" | "widget";

export function AgentsList({ type, all }: { type?: AgentType; all?: boolean }) {
  let data;
  if (type === "inbound") {
    const { agentsData } = useInboundAgents();
    data = agentsData;
  } else if (type === "outbound") {
    const { agentsData } = useOutboundAgents();
    data = agentsData;
  } else if (all) {
    const { agentsData } = useAllAgents();
    data = agentsData;
  } else if (type === "widget") {
    const { agentsData } = useWidgetAgents();
    data = agentsData;
  }
  const agents = data?.data || [];

  console.log("Datos iniciales: ", agents);
  if (agents.length === 0) {
    return <EmptyStateView />;
  } else if (agents.length === 1) {
    return <SingleAgentView agent={agents[0]} />;
  } else {
    return <MultipleAgentsView agents={agents} />;
  }
}

function EmptyStateView() {
  return (
    <Card className="w-[100%] flex flex-col items-center justify-center text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <Mic className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-medium mb-2">No se encontraron agentes</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Crea tu primer agente de voz para empezar a manejar llamadas y conversaciones automáticamente.
      </p>
      <Button className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Crear agente de voz
      </Button>
    </Card>
  );
}

function SingleAgentView({ agent }: { agent: any }) {
  const needsConfiguration =
    agent.type !== "widget" &&
    (agent.phoneNumber === null || !agent.addedKnowledgeBase);

  return (
    <Card className="w-full max-w-md mx-auto border shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl font-semibold">{agent.name}</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {agent.type === "inbound" ? (
                <ArrowDownLeft className="h-3 w-3" />
              ) : (
                <ArrowUpRight className="h-3 w-3" />
              )}
              {agent.type === "inbound"
                ? "Inbound"
                : agent.type === "widget"
                ? "Widget"
                : "Outbound"}
            </Badge>
          </div>
        </div>
        <Badge
          variant={agent.activated ? "default" : "outline"}
          className={cn(
            agent.activated
              ? "bg-green-500 hover:bg-green-500/80"
              : "text-muted-foreground"
          )}
        >
          {agent.activated ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {needsConfiguration && (
          <Alert className="bg-destructive/40 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuración necesaria</AlertTitle>
            <AlertDescription>
              Por favor, agrega un número de teléfono y una base de conocimientos para completar la configuración de este agente.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {agent.type != "widget" ? (
              <>
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Teléfono:</span>
                <span className="text-muted-foreground">
                  {agent.phoneNumber || "Not configured"}
                </span>
              </>
            ) : (
              <>
                <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Tipo:</span>
                <span className="text-muted-foreground">Widget</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Lenguaje:</span>
            <span className="text-muted-foreground">{agent.language}</span>
          </div>

          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Voz Id:</span>
            <span className="text-muted-foreground text-sm truncate">
              {agent.voice_id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Usuario Id:</span>
            <span className="text-muted-foreground text-sm truncate">
              {agent.userId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Base de conocimiento:</span>
            <span className="text-muted-foreground">
              {agent.addedKnowledgeBase ? "Agregada" : "No configurada"}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">Instrucciones:</div>
          <div className="text-sm bg-muted p-3 rounded-md max-h-24 overflow-y-auto">
            {agent.prompt}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {agent.conversations} conversaciones
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="sm">
            Editar
          </Button>
          <ConfigureAgentDialog
            agentId={agent.id}
            userId={agent.userId}
            first_message={agent.first_message}
            language={agent.language}
            name={agent.name}
            prompt={agent.prompt}
            voice_id={agent.voice_id}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MultipleAgentsView({ agents }: { agents: any[] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const needsConfiguration =
    agent.phoneNumber === null && !agent.addedKnowledgeBase;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{agent.name}</CardTitle>
          <Badge
            variant={agent.activated ? "default" : "outline"}
            className={cn(
              "ml-2",
              agent.activated
                ? "bg-green-500 hover:bg-green-500/80"
                : "text-muted-foreground"
            )}
          >
            {agent.activated ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="flex items-center gap-1">
            {agent.type === "inbound" ? (
              <ArrowDownLeft className="h-3 w-3" />
            ) : (
              <ArrowUpRight className="h-3 w-3" />
            )}
            {agent.type === "inbound" ? "Inbound" : "Outbound"}
          </Badge>
          {agent.isWidget && (
            <Badge variant="secondary" className="text-xs">
              Widget
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {needsConfiguration && (
          <Alert className="bg-destructive/30 text-muted-foreground mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuración necesaria</AlertTitle>
            <AlertDescription>
              Por favor, agrega un número de teléfono y una base de conocimientos para completar la configuración de este agente.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Teléfono:</span>
            <span>{agent.phoneNumber || "No configurado"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Lenguaje:</span>
            <span>{agent.language}</span>
          </div>

          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-2">Instrucciones:</div>
            <div className="text-sm bg-muted p-2 rounded-md max-h-20 overflow-y-auto line-clamp-3">
              {agent.prompt.length > 50
                ? agent.prompt.slice(0, 50) + "........."
                : agent.prompt}
            </div>
          </div>

          <div className="flex justify-between mt-2 pt-2 border-t">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>{agent.conversations} conversaciones</span>
            </div>
          </div>
          {agent.phoneNumber === "" ||
            (!agent.addedKnowledgeBase ? (
              <div className="w-full flex justify-end gap-2 pt-4">
                <Button variant="outline" size="sm">
                  Editar
                </Button>
                <ConfigureAgentDialog
                  agentId={agent.id}
                  userId={agent.userId}
                  first_message={agent.first_message}
                  language={agent.language}
                  name={agent.name}
                  prompt={agent.prompt}
                  voice_id={agent.voice_id}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button className="w-[30%]">Editar</Button>
                <CallPhoneDialog prompt={agent.prompt} first_message={agent.first_message}/>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
