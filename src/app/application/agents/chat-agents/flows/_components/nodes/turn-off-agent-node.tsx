import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { PowerOff } from "lucide-react";

const TurnOffAgentNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-red-500 p-4 rounded-lg shadow-md w-64 text-white border-2 border-red-600">
      <div className="flex items-center mb-2">
        <PowerOff className="w-5 h-5 mr-2" />
        <strong
          className="text-sm truncate"
          title={data.name || "End Conversation"}
        >
          {data.name || "End Conversation"}
        </strong>
      </div>
      <p
        className="text-xs opacity-80 truncate"
        title={data.message || "Configure end message..."}
      >
        Message: {data.message || "Configure..."}
      </p>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-300"
      />
    </div>
  );
};
export default memo(TurnOffAgentNode);
