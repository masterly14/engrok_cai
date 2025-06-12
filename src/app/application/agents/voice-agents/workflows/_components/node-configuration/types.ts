import { Node } from 'reactflow';

export type Variable = {
  id: string;
  title: string;
  description: string;
  type: "string" | "boolean" | "number" | "integer";
  enum: string[];
  isEditing?: boolean;
};

export type TransferDestination = {
  type: "number";
  message: string;
  description: string;
  number: string;
  numberE164CheckEnabled: boolean;
  transferPlan: {
    mode: "blind_transfer" | "blind_summary_sip";
  };
};

export interface NodeConfigurationProps {
  selectedNode: Node;
  updateNode: (nodeId: string, updates: any) => void;
}

export interface VariableManagementProps {
  selectedNode: Node;
  variables: Variable[];
  onAddVariable: () => void;
  onUpdateVariable: (variableId: string, updates: Partial<Variable>) => void;
  onDeleteVariable: (variableId: string) => void;
} 