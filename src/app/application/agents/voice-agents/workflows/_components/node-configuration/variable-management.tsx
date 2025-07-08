import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { Variable } from "../../types";

interface VariableManagementProps {
  variables: Variable[];
  onAddVariable: () => void;
  onUpdateVariable: (variableId: string, updates: Partial<Variable>) => void;
  onDeleteVariable: (variableId: string) => void;
}

const VariableCard = ({
  variable,
  onUpdate,
  onDelete,
}: {
  variable: Variable;
  onUpdate: (variableId: string, updates: Partial<Variable>) => void;
  onDelete: (variableId: string) => void;
}) => {
  return (
    <Card className="p-3 bg-gray-50">
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium text-gray-700">Nombre</Label>
          <Input
            placeholder="nombre_de_variable"
            value={variable.name}
            onChange={(e) => onUpdate(variable.id, { name: e.target.value })}
            className="h-8 text-sm font-mono"
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-700">
            Descripción
          </Label>
          <Textarea
            placeholder="Describe qué información almacena esta variable..."
            value={variable.description}
            onChange={(e) =>
              onUpdate(variable.id, { description: e.target.value })
            }
            className="h-16 text-sm resize-none"
          />
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(variable.id)}
            className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">Extracción de variables</Label>
        <Button
          onClick={onAddVariable}
          variant="outline"
          size="sm"
          className="h-8 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Añadir
        </Button>
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Define los datos que quieres que el asistente extraiga de la
        conversación.
      </p>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {variables?.map((variable: Variable) => (
          <VariableCard
            key={variable.id}
            variable={variable}
            onUpdate={onUpdateVariable}
            onDelete={onDeleteVariable}
          />
        ))}
        {variables.length === 0 && (
          <div className="text-center py-6 text-sm text-gray-400 border border-dashed rounded-lg">
            No hay variables definidas.
          </div>
        )}
      </div>
    </div>
  );
}
