"use client";

import { useEffect, useState } from "react";
import ManagerCalls from "./_components/manager-calls";
import { getAllCalls } from "@/actions/vapi/calls";
import { useAllAgents } from "@/hooks/use-all-agents";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

// Datos de ejemplo con múltiples llamadas

export default function CallHistoryPage() {
  /* Estado para el agente seleccionado */
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  /* Estados para las llamadas */
  const [calls, setCalls] = useState<any[]>([]);
  const [callsLoading, setCallsLoading] = useState(false);

  /* Hook para obtener todos los agentes del usuario */
  const { agentsData, agentsLoading, agentsError } = useAllAgents();

  /* Efecto: cuando cambia el agente seleccionado, obtenemos sus llamadas */
  useEffect(() => {
    const fetchCalls = async () => {
      if (!selectedAgentId) return;
      setCallsLoading(true);
      try {
        const agentCalls = await getAllCalls(selectedAgentId);
        setCalls(agentCalls);
      } finally {
        setCallsLoading(false);
      }
    };

    fetchCalls();
  }, [selectedAgentId]);

  /* Loading de agentes */
  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  /* Error al cargar agentes */
  if (agentsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center gap-2 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <span>Error al cargar los agentes. Inténtalo de nuevo.</span>
      </div>
    );
  }

  /* Si aún no se ha seleccionado agente, mostrar selector */
  if (!selectedAgentId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Selecciona un agente</CardTitle>
          </CardHeader>
          <CardContent>
            {(!Array.isArray(agentsData) || agentsData.length === 0) && (
              <p className="text-sm text-muted-foreground">
                No tienes agentes disponibles.
              </p>
            )}

            {Array.isArray(agentsData) && agentsData.length > 0 && (
              <Select onValueChange={(value) => setSelectedAgentId(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige un agente" />
                </SelectTrigger>
                <SelectContent>
                  {agentsData.map((agent: any) => (
                    <SelectItem key={agent.id} value={agent.vapiId}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  /* Una vez seleccionado el agente, mostrar la tabla de llamadas */
  return <ManagerCalls llamadas={calls} loading={callsLoading} />;
}
