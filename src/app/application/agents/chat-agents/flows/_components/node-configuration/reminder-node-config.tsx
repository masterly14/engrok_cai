"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Node } from "reactflow";

interface ReminderNodeConfigProps {
  selectedNode: Node;
  updateNode: (nodeId: string, data: any) => void;
}

export function ReminderNodeConfig({
  selectedNode,
  updateNode,
}: ReminderNodeConfigProps) {
  const [delay, setDelay] = useState<number>(selectedNode.data.delay || 60);
  const [unit, setUnit] = useState<string>(
    selectedNode.data.delayUnit || "seconds",
  );

  useEffect(() => {
    // Debounce or directly update node data on change
    const newDelay = Number.isNaN(delay) ? 0 : delay;
    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        delay: newDelay,
        delayUnit: unit,
      },
    });
  }, [delay, unit, selectedNode.id, updateNode]);

  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setDelay(value >= 0 ? value : 0);
  };

  const handleUnitChange = (value: string) => {
    setUnit(value);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">
          Configuración de Recordatorio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-500">
          Define el tiempo de espera antes de que el flujo continúe.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="delay">Tiempo de Espera</Label>
            <Input
              id="delay"
              type="number"
              value={delay}
              onChange={handleDelayChange}
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unidad</Label>
            <Select value={unit} onValueChange={handleUnitChange}>
              <SelectTrigger id="unit">
                <SelectValue placeholder="Selecciona unidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seconds">Segundos</SelectItem>
                <SelectItem value="minutes">Minutos</SelectItem>
                <SelectItem value="hours">Horas</SelectItem>
                <SelectItem value="days">Días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
