import { IntegrationNodeData } from "@/app/application/agents/voice-agents/workflows/types";
import { useMemo } from "react";
import { useReactFlow } from "reactflow";
import { Select, SelectTrigger } from "../ui/select";
import { ChevronDown } from "lucide-react";
import { SelectContent } from "../ui/select";
import { SelectItem } from "../ui/select";

export const HubspotActions = ({
  data,
  onDataChange,
  userId,
}: {
  data: IntegrationNodeData;
  onDataChange: (data: Partial<IntegrationNodeData>) => void;
  userId: string | null;
}) => {
  const reactFlowInstance = useReactFlow();

  const variablesList = useMemo(() => {
    const vars: string[] = [];
    reactFlowInstance.getNodes().forEach((n: any) => {
      if (n.data.type === "conversation") {
        (n.data.variables || []).forEach((v: any) => {
          if (v.name && !vars.includes(v.name)) vars.push(v.name);
        });
      }
    });
    return vars;
  }, [reactFlowInstance]);

  const VariableSelect = ({ onSelect }: { onSelect: (v: string) => void }) => {
    if (variablesList.length === 0) return null;
    return (
      <Select onValueChange={onSelect}>
        <SelectTrigger className="h-8 w-8 border-gray-300 ml-2 p-0 flex items-center justify-center">
          <ChevronDown className="h-4 w-4" />
        </SelectTrigger>
        <SelectContent>
          {variablesList.map((v) => (
            <SelectItem key={v} value={v} className="cursor-pointer">
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };
  return (
    <div>
      <h1>Hubspot Actions</h1>
    </div>
  );
};
