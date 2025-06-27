import type { ChatAgentWithWorkflows } from "@/types/agent";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, RefreshCw, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAllChatAgents, useUpdateChatAgent } from "@/hooks/use-all-chat-agents";
import type { ChatAgentFormData } from "@/context/chat-agent-context";

interface AssignAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  onAgentAssigned?: (agentId: string) => void;
}

export const AssignAgentModal = ({ open, onOpenChange, workflowId, onAgentAssigned }: AssignAgentModalProps) => {
  const router = useRouter();
  const { data: agentsQuery, isLoading } = useAllChatAgents();
  const updateAgent = useUpdateChatAgent();

  const agents: ChatAgentWithWorkflows[] = agentsQuery || [];

  // Si el usuario no tiene agentes, redirigimos para que cree uno
  useEffect(() => {
    if (open && !isLoading && agents.length === 0) {
      toast.info("No tienes agentes de chat aún. Crea uno para poder asignarlo.");
      router.push("/application/agents/chat-agents/agents");
    }
  }, [open, isLoading, agents.length, router]);

  const handleAssign = (agent: ChatAgentWithWorkflows) => {
    // Construir payload
    const payload: ChatAgentFormData = {
      name: agent.name,
      isActive: agent.isActive,
      whatsappAccessToken: agent.whatsappAccessToken || "",
      whatsappBusinessAccountId: agent.whatsappBusinessAccountId || "",
      whatsappPhoneNumber: agent.whatsappPhoneNumber || "",
      whatsappPhoneNumberId: agent.whatsappPhoneNumberId || "",
      workflowId,
    };

    updateAgent.mutate(
      { id: agent.id, values: payload },
      {
        onSuccess: () => {
          toast.success(`Agente '${agent.name}' asignado correctamente.`);
          onOpenChange(false);
          onAgentAssigned?.(agent.id);
          router.refresh();
        },
        onError: () => {
          toast.error("Error al asignar el agente. Intenta de nuevo.");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar agente al flujo</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-80 mt-2 pr-4">
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-gray-500">Cargando agentes...</p>
            ) : (
              agents.map((agent) => {
                const assignedWorkflow = agent.workflows.find((w) => w.agentId === agent.id);
                const isAssignedToCurrent = assignedWorkflow?.id === workflowId;
                const isBusy = !!assignedWorkflow && !isAssignedToCurrent;

                return (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-gray-50"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{agent.name}</span>
                      <span className="text-xs text-gray-500 font-mono">{agent.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAssignedToCurrent ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Check className="h-3 w-3" /> Asignado
                        </Badge>
                      ) : isBusy ? (
                        <Badge variant="destructive">Ocupado</Badge>
                      ) : (
                        <Badge variant="outline">Disponible</Badge>
                      )}
                      {!isAssignedToCurrent && (
                        <Button
                          size="sm"
                          variant={isBusy ? "outline" : "default"}
                          onClick={() => handleAssign(agent)}
                          disabled={updateAgent.isPending}
                        >
                          {isBusy ? (
                            <RefreshCw className="h-4 w-4 mr-1.5" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-1.5" />
                          )}
                          {isBusy ? "Reasignar" : "Asignar"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 