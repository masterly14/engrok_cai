"use client";

import React, { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AgentOption {
  id: string;
  name: string;
  vapiId: string | null;
}

interface WorkflowOption {
  id: string;
  name: string;
  vapiWorkflowId: string | null;
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
  workflowsData: WorkflowOption[];
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
  workflowsData,
  setSelectedAgent,
  setSelectedWorkflow,
}) => {
  const [assignmentType, setAssignmentType] = useState("assistant");

  useEffect(() => {
    if (formData.workflowId) {
      setAssignmentType("workflow");
      setSelectedWorkflow(formData.workflowId);
      setSelectedAgent(null);
    } else if (formData.assistantId) {
      setAssignmentType("assistant");
      setSelectedAgent(formData.assistantId);
      setSelectedWorkflow(null);
    }
  }, [
    formData.assistantId,
    formData.workflowId,
    setSelectedAgent,
    setSelectedWorkflow,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de llamadas entrantes</CardTitle>
        <CardDescription>
          Asigna un asistente de voz o un flujo de trabajo a este número de
          teléfono.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 w-full">
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

        <RadioGroup
          value={assignmentType}
          onValueChange={(value) => {
            setAssignmentType(value);
            // Clear selections when changing type
            handleInputChange("assistantId", "");
            handleInputChange("workflowId", "");
            setSelectedAgent(null);
            setSelectedWorkflow(null);
          }}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="assistant" id="r-assistant" />
            <Label htmlFor="r-assistant">Asignar Asistente</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="workflow" id="r-workflow" />
            <Label htmlFor="r-workflow">Asignar Workflow</Label>
          </div>
        </RadioGroup>

        {assignmentType === "assistant" && (
          <div className="space-y-2">
            <Label>Asistente</Label>
            <Select
              value={formData.assistantId}
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
                  agentsData.map((agent) => (
                    <SelectItem
                      key={agent.id}
                      value={agent.id}
                      className="py-3"
                    >
                      {agent.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-slate-500">
                    No tienes agentes creados
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {assignmentType === "workflow" && (
          <div className="space-y-2">
            <Label>Flujo de trabajo</Label>
            <Select
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
                {Array.isArray(workflowsData) && workflowsData.length > 0 ? (
                  workflowsData.map((workflow) => (
                    <SelectItem
                      key={workflow.id}
                      value={workflow.id}
                      className="py-3"
                    >
                      {workflow.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-slate-500">
                    No tienes workflows creados
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <Separator orientation="horizontal" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">
            Destino alternativo
          </p>
          <p className="text-xs text-slate-600">
            Establezca un destino respaldo para llamadas entrantes cuando el
            asistente o el flujo no esté disponible.
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
