import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllAgents } from "@/hooks/use-all-agents";
import { VariableManagement } from "./variable-management";
import { NodeConfigurationProps } from "./types";
import { ConversationNodeData, Variable } from "../../types";
import { v4 as uuidv4 } from 'uuid';
import { Input } from "@/components/ui/input";

export function ConversationNodeConfig({
  selectedNode,
  updateNode,
}: NodeConfigurationProps) {
  const { agentsData } = useAllAgents();
  const nodeData = selectedNode.data as ConversationNodeData;

  const handleDataChange = (updates: Partial<ConversationNodeData>) => {
    updateNode(selectedNode.id, updates);
  };

  const addVariable = () => {
    const newVariable: Variable = {
      id: uuidv4(),
      name: `var_${(nodeData.variables?.length || 0) + 1}`,
      description: "",
    };
    handleDataChange({ variables: [...(nodeData.variables || []), newVariable] });
  };

  const updateVariable = (variableId: string, updates: Partial<Variable>) => {
    handleDataChange({
      variables: (nodeData.variables || []).map((v) =>
        v.id === variableId ? { ...v, ...updates } : v
      ),
    });
  };

  const deleteVariable = (variableId: string) => {
    handleDataChange({
      variables: (nodeData.variables || []).filter((v) => v.id !== variableId),
    });
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <Label className="text-sm font-medium">Prompt</Label>
        <Textarea
          value={nodeData.prompt || ""}
          onChange={(e) => handleDataChange({ prompt: e.target.value })}
          className="h-40 mt-1"
          placeholder="Ingresa el prompt para este nodo de conversación..."
        />
      </div>

      <div>
        <Label className="text-sm font-medium">Voz (ElevenLabs)</Label>
        <Input
            value={nodeData.voice?.voiceId || ""}
            onChange={(e) => handleDataChange({ voice: { ...nodeData.voice, voiceId: e.target.value } })}
            placeholder="ID de la voz de ElevenLabs"
            className="mt-1"
        />
      </div>

      <VariableManagement
        variables={nodeData.variables || []}
        onAddVariable={addVariable}
        onUpdateVariable={updateVariable}
        onDeleteVariable={deleteVariable}
      />
    </div>
  );
}
