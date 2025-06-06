"use client";

import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock } from "lucide-react";

interface AgentOption {
  id: string;
  name: string;
  vapiId: string | null;
}

interface FormData {
  number: string;
  assistantId: string;
  workflowId: string;
  alternativeDestination: string;
  [key: string]: any;
}

interface Props {
  isCreatingNew: boolean;
  formData: FormData;
  handleInputChange: (field: keyof FormData, value: string) => void;
  agentsData: AgentOption[];
  selectedAgent: string | null;
  setSelectedAgent: React.Dispatch<React.SetStateAction<string | null>>;
  selectedWorkflow: string | null;
  setSelectedWorkflow: React.Dispatch<React.SetStateAction<string | null>>;
}

const InboundSettingsCard: React.FC<Props> = ({
  isCreatingNew,
  formData,
  handleInputChange,
  agentsData,
  selectedAgent,
  setSelectedAgent,
  selectedWorkflow,
  setSelectedWorkflow,
}) => {
  useEffect(() => {
    console.log("formData", formData)
    if (formData.assistantId) {
      setSelectedAgent(formData.assistantId);
    }
    if (formData.workflowId) {
      setSelectedWorkflow(formData.workflowId);
    }
  }, [formData.assistantId, formData.workflowId, setSelectedAgent, setSelectedWorkflow]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de llamadas entrantes</CardTitle>
        <CardDescription>
          Puede asignar un asistente al número de teléfono para que cada vez que
          alguien llame a este número de teléfono, el asistente se asigne
          automáticamente a la llamada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 w-full">
        <div className="space-y-3">
          <Label
            htmlFor="number"
            className="text-sm font-medium text-slate-900 flex items-center gap-2"
          >
            Número de teléfono
            {!isCreatingNew && <Lock className="h-4 w-4 text-slate-400" />}
          </Label>
          <Input
            id="number"
            placeholder="Ej: +1234567890"
            value={formData.number}
            onChange={(e) => handleInputChange("number", e.target.value)}
            readOnly={!isCreatingNew}
            className={`h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200 ${
              !isCreatingNew ? "bg-slate-50 cursor-not-allowed" : ""
            }`}
          />
        </div>
        <Separator orientation="horizontal" />
        <div className="flex gap-x-3 items-center">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">Agente</p>
            <Select
              value={formData.assistantId}
              disabled={!!selectedWorkflow}
              onValueChange={(value) => {
                handleInputChange("assistantId", value);
                setSelectedAgent(value);
              }}
            >
              <SelectTrigger className="h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200">
                <SelectValue placeholder="Selecciona un agente" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 w-full">
                {Array.isArray(agentsData) && agentsData.length > 0 ? (
                  <div className="max-h-[200px] overflow-y-auto flex flex-col">
                    {agentsData.map((agent) => (
                      <SelectItem
                        key={agent.vapiId}
                        value={agent.vapiId!}
                        className="py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-900 gap-x-4">
                            {agent.name}
                          </span>
                          <span className="text-slate-400 text-xs">
                            ({agent.vapiId})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-2 text-sm text-slate-500">
                    No tienes agentes creados
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          {selectedAgent && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAgent(null);
                handleInputChange("assistantId", "");
              }}
            >
              Deseleccionar
            </Button>
          )}
        </div>
        <Separator orientation="horizontal" />
        <div className="flex gap-x-3 items-center">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">
              Flujo de trabajo
            </p>
            <Select
              disabled={!!selectedAgent}
              value={formData.workflowId}
              onValueChange={(value) => {
                handleInputChange("workflowId", value);
                setSelectedWorkflow(value);
              }}
            >
              <SelectTrigger className="h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200">
                <SelectValue placeholder="Selecciona un flujo" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 w-full">
                <SelectItem value="1">Flujo 1</SelectItem>
                <SelectItem value="2">Flujo 2</SelectItem>
                <SelectItem value="3">Flujo 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedWorkflow && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedWorkflow(null);
                handleInputChange("workflowId", "");
              }}
            >
              Deseleccionar
            </Button>
          )}
        </div>
        <Separator orientation="horizontal" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">
            Destino alternativo
          </p>
          <p className="text-xs text-slate-600">
            Establezca un destino respaldo para llamadas entrantes cuando el
            asistente o el escuadrón no esté disponible.
          </p>
          <Input
            id="alternativeDestination"
            placeholder="Ingresa el número de teléfono con el código de área"
            value={formData.alternativeDestination}
            onChange={(e) =>
              handleInputChange("alternativeDestination", e.target.value)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default InboundSettingsCard;
