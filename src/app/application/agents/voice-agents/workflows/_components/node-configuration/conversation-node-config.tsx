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
import { NodeConfigurationProps, Variable } from "./types";

export function ConversationNodeConfig({
  selectedNode,
  updateNode,
}: NodeConfigurationProps) {
  const { agentsData } = useAllAgents();

  const handlePromptChange = (value: string) => {
    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, prompt: value },
    });
  };

  const handleAgentChange = (agentId: string) => {
    // You might want to handle agent selection logic here
    console.log("Selected agent:", agentId);
  };

  // Variable management functions
  const addVariable = () => {
    const newVariable: Variable = {
      id: `var_${Date.now()}`,
      title: "",
      description: "",
      type: "string",
      enum: [],
      isEditing: true,
    };

    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        variableExtractionPlan: {
          output: [
            ...(selectedNode.data.variableExtractionPlan?.output || []),
            newVariable,
          ],
        },
      },
    });
  };

  const updateVariable = (variableId: string, updates: Partial<Variable>) => {
    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        variableExtractionPlan: {
          output: (selectedNode.data.variableExtractionPlan?.output || []).map(
            (variable: Variable) =>
              variable.id === variableId
                ? { ...variable, ...updates }
                : variable
          ),
        },
      },
    });
  };

  const deleteVariable = (variableId: string) => {
    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        variableExtractionPlan: {
          output: (selectedNode.data.variableExtractionPlan?.output || []).filter(
            (variable: Variable) => variable.id !== variableId
          ),
        },
      },
    });
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <Label className="text-sm font-medium">Prompt</Label>
        <Textarea
          value={selectedNode.data.prompt || ""}
          onChange={(e) => handlePromptChange(e.target.value)}
          className="h-40 mt-1"
          placeholder="Ingresa el prompt para este nodo de conversación..."
        />
      </div>

      <div>
        <Label className="text-sm font-medium">Agentes</Label>
        <Select onValueChange={handleAgentChange}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Selecciona un agente" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(agentsData) &&
              agentsData.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <VariableManagement
        selectedNode={selectedNode}
        variables={selectedNode.data.variableExtractionPlan?.output || []}
        onAddVariable={addVariable}
        onUpdateVariable={updateVariable}
        onDeleteVariable={deleteVariable}
      />
    </div>
  );
}
