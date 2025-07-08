import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NodeConfigurationProps } from "./types";

export function EndCallNodeConfig({
  selectedNode,
  updateNode,
}: NodeConfigurationProps) {
  const handleMessageChange = (value: string) => {
    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, message: value },
    });
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <Label className="text-sm font-medium">Mensaje de Fin de Llamada</Label>
        <Textarea
          placeholder="Ingresa mensaje que se hablará al cliente antes de finalizar la llamada"
          value={selectedNode.data.message || ""}
          onChange={(e) => handleMessageChange(e.target.value)}
          className="h-24 mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Este mensaje se reproducirá antes de terminar la llamada
          automáticamente.
        </p>
      </div>
    </div>
  );
}
