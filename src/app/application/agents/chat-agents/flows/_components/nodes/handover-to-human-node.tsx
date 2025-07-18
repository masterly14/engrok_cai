import { memo } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "reactflow";
import { User, Settings, Trash2 } from "lucide-react";

const HandoverToHumanNode = ({ data, id }: NodeProps) => {
  const { setNodes, setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <div className="relative bg-amber-500 p-4 rounded-lg shadow-md w-64 text-white border-2 border-amber-600">
      {/* Toolbar */}
      <div className="absolute top-2 right-2 flex gap-1 z-20">
        <button className="bg-white/80 hover:bg-white p-1 rounded shadow" title="Configuración">
          <Settings className="w-4 h-4 text-gray-700" />
        </button>
        <button onClick={handleDelete} className="bg-white/80 hover:bg-red-100 p-1 rounded shadow" title="Eliminar">
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
      <div className="flex items-center mb-2">
        <User className="w-5 h-5 mr-2" />
        <strong
          className="text-sm truncate"
          title={data.name || "Handover to Agent"}
        >
          {data.name || "Handover to Agent"}
        </strong>
      </div>
      <p
        className="text-xs opacity-80 truncate"
        title={data.botResponse || "Mensaje al usuario..."}
      >
        Bot: {data.botResponse || "Configure..."}
      </p>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-300"
      />
    </div>
  );
};
export default memo(HandoverToHumanNode);
