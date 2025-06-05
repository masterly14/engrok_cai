"use client";

import React from "react";
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

interface AgentOption {
  id: string;
  name: string;
}

interface FormData {
  assistantId: string;
  squadId: string;
  workflowId: string;
  alternativeDestination: string;
  [key: string]: any;
}

interface Props {
  formData: FormData;
  handleInputChange: (field: keyof FormData, value: string) => void;
  agentsData: AgentOption[];
}

const OutboundSettingsCard: React.FC<Props> = ({
  formData,
  handleInputChange,
  agentsData,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de llamadas salientes</CardTitle>
        <CardDescription>
          Puede asignar un número de teléfono saliente, configurar un respaldo y
          configurar un escuadrón para llamar si el asistente no está
          disponible.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 w-full">
        <Separator orientation="horizontal" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">Asistente</p>
          <Select
            value={formData.assistantId}
            onValueChange={(value) => handleInputChange("assistantId", value)}
          >
            <SelectTrigger className="h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200">
              <SelectValue placeholder="Selecciona un asistente" />
            </SelectTrigger>
            <SelectContent className="border-slate-200 w-full">
              {Array.isArray(agentsData) &&
                agentsData.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900 gap-x-4">
                        {agent.name}
                      </span>
                      <span className="text-slate-400 text-xs">({agent.id})</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Separator orientation="horizontal" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">Escuadron de agentes</p>
          <Select
            value={formData.squadId}
            onValueChange={(value) => handleInputChange("squadId", value)}
          >
            <SelectTrigger className="h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200">
              <SelectValue placeholder="Selecciona un escuadron" />
            </SelectTrigger>
            <SelectContent className="border-slate-200 w-full">
              <SelectItem value="1">Escuadrón 1</SelectItem>
              <SelectItem value="2">Escuadrón 2</SelectItem>
              <SelectItem value="3">Escuadrón 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator orientation="horizontal" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">Flujo de trabajo</p>
          <Select
            value={formData.workflowId}
            onValueChange={(value) => handleInputChange("workflowId", value)}
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
        <Separator orientation="horizontal" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">Destino alternativo</p>
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

export default OutboundSettingsCard; 