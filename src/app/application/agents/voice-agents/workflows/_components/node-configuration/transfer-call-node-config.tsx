import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { NodeConfigurationProps, TransferDestination } from "./types";

export function TransferCallNodeConfig({
  selectedNode,
  updateNode,
}: NodeConfigurationProps) {
  const addDestination = () => {
    const newDestination: TransferDestination = {
      type: "number",
      message: "",
      description: "",
      number: "",
      numberE164CheckEnabled: true,
      transferPlan: {
        mode: "blind_transfer",
      },
    };

    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        tool: {
          ...selectedNode.data.tool,
          destinations: [
            ...(selectedNode.data.tool?.destinations || []),
            newDestination,
          ],
        },
      },
    });
  };

  const updateDestination = (
    index: number,
    field: keyof TransferDestination,
    value: any,
  ) => {
    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        tool: {
          ...selectedNode.data.tool,
          destinations:
            selectedNode.data.tool?.destinations?.map(
              (dest: TransferDestination, i: number) =>
                i === index ? { ...dest, [field]: value } : dest,
            ) || [],
        },
      },
    });
  };

  const deleteDestination = (index: number) => {
    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        tool: {
          ...selectedNode.data.tool,
          destinations:
            selectedNode.data.tool?.destinations?.filter(
              (_: any, i: number) => i !== index,
            ) || [],
        },
      },
    });
  };

  const updateTransferMode = (mode: "blind_transfer" | "blind_summary_sip") => {
    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        tool: {
          ...selectedNode.data.tool,
          destinations:
            selectedNode.data.tool?.destinations?.map((dest: any) => ({
              ...dest,
              transferPlan: { mode },
            })) || [],
        },
      },
    });
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="border-b border-gray-200 pb-2">
        <Button
          onClick={addDestination}
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs border-dashed"
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar Destino
        </Button>
        <p className="text-xs text-gray-600 mt-1">
          Configura destinos para transferencias de llamadas
        </p>
      </div>

      {/* Transfer Plan */}
      <div>
        <Label className="text-sm font-medium">Plan de Transferencia</Label>
        <div className="mt-1">
          <Label className="text-xs text-gray-600">Modo de Transferencia</Label>
          <Select
            value={
              selectedNode.data.tool?.destinations?.[0]?.transferPlan?.mode ||
              "blind_transfer"
            }
            onValueChange={updateTransferMode}
          >
            <SelectTrigger className="h-8 text-sm mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blind_transfer">
                Transferencia Ciega
              </SelectItem>
              <SelectItem value="blind_summary_sip">
                Transferencia Ciega con Resumen en Encabezado SIP
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Destinations List */}
      <div className="space-y-3">
        {selectedNode.data.tool?.destinations?.map(
          (destination: TransferDestination, index: number) => (
            <Card key={index} className="p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">
                  Número de Teléfono
                </Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteDestination(index)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-3">
                {/* Phone Number */}
                <div>
                  <Label className="text-xs">Número de Teléfono</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Ingresa número de teléfono (ej. +14155551234)"
                      value={destination.number}
                      onChange={(e) =>
                        updateDestination(index, "number", e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={destination.numberE164CheckEnabled}
                        onChange={(e) =>
                          updateDestination(
                            index,
                            "numberE164CheckEnabled",
                            e.target.checked,
                          )
                        }
                        className="h-3 w-3"
                      />
                      <Label className="text-xs">Forzar formato E164</Label>
                    </div>
                  </div>
                </div>

                {/* Message to Customer */}
                <div>
                  <Label className="text-xs">Mensaje al Cliente</Label>
                  <Textarea
                    placeholder="Ingresa mensaje que se hablará al cliente antes de la transferencia"
                    value={destination.message}
                    onChange={(e) =>
                      updateDestination(index, "message", e.target.value)
                    }
                    className="h-16 text-sm resize-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs">Descripción</Label>
                  <Input
                    placeholder="Descripción del destino"
                    value={destination.description}
                    onChange={(e) =>
                      updateDestination(index, "description", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </Card>
          ),
        )}
      </div>
    </div>
  );
}
