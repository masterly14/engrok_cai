import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Save } from "lucide-react";

const CaptureResponseNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-green-500 p-4 rounded-lg shadow-md w-64 text-white border-2 border-green-600">
      <div className="flex items-center mb-2">
        <Save className="w-5 h-5 mr-2" />
        <strong
          className="text-sm truncate"
          title={data.name || "Capturar respuesta"}
        >
          {data.name || "Capturar respuesta"}
        </strong>
      </div>
      <p
        className="text-xs opacity-80 truncate"
        title={data.variableName || "Configurar variable..."}
      >
        Var: {data.variableName || "Configurar variable..."}
      </p>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-300"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-300"
      />
    </div>
  );
};
export default memo(CaptureResponseNode);
