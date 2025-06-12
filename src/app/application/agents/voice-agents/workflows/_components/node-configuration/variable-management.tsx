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
import { Edit, Plus, Trash2 } from "lucide-react";
import { Variable, VariableManagementProps } from "./types";

const VariableCard = ({
  variable,
  onUpdate,
  onDelete,
}: {
  variable: Variable;
  onUpdate: (variableId: string, updates: Partial<Variable>) => void;
  onDelete: (variableId: string) => void;
}) => {
  if (variable.isEditing) {
    return (
      <Card className="p-3 border-dashed border-blue-300 bg-blue-50">
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nombre de la variable</Label>
            <Input
              placeholder="nombre_variable"
              value={variable.title}
              onChange={(e) => onUpdate(variable.id, { title: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Tipo</Label>
            <Select
              value={variable.type}
              onValueChange={(
                value: "string" | "boolean" | "number" | "integer"
              ) => onUpdate(variable.id, { type: value })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">Texto</SelectItem>
                <SelectItem value="boolean">Booleano</SelectItem>
                <SelectItem value="number">Número</SelectItem>
                <SelectItem value="integer">Integer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Descripción</Label>
            <Textarea
              placeholder="Descripción de la variable"
              value={variable.description}
              onChange={(e) =>
                onUpdate(variable.id, { description: e.target.value })
              }
              className="h-16 text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onUpdate(variable.id, { isEditing: false })}
              className="flex-1 h-8 text-xs"
            >
              Guardar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(variable.id)}
              className="h-8 text-xs"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-2 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {variable.title || "Variable sin nombre"}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {variable.type === "string"
              ? "Texto"
              : variable.type === "boolean"
              ? "Booleano"
              : variable.type === "number"
              ? "Número"
              : "Integer"}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onUpdate(variable.id, { isEditing: true })}
            className="h-6 w-6 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(variable.id)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export function VariableManagement({
  variables,
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
}: VariableManagementProps) {
  return (
    <div>
      <Label className="text-sm font-medium">Extracción de variables</Label>
      <div className="space-y-2 mt-2">
        <Button
          onClick={onAddVariable}
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs border-dashed"
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar variable
        </Button>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {variables?.map((variable: Variable) => (
            <VariableCard
              key={variable.id}
              variable={variable}
              onUpdate={onUpdateVariable}
              onDelete={onDeleteVariable}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 