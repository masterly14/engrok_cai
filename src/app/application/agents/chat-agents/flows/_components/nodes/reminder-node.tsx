import React from "react";
import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import { Clock, Settings, Trash2 } from "lucide-react";

const ReminderNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  const { setNodes, setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <div
      className={`relative bg-white rounded-lg border-2 ${
        selected ? "border-blue-500" : "border-gray-300"
      } shadow-md overflow-hidden w-64`}
    >
      {/* Toolbar */}
      <div className="absolute top-2 right-2 flex gap-1 z-20">
        <button className="bg-white/80 hover:bg-white p-1 rounded shadow" title="Configuración">
          <Settings className="w-4 h-4 text-gray-700" />
        </button>
        <button onClick={handleDelete} className="bg-white/80 hover:bg-red-100 p-1 rounded shadow" title="Eliminar">
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <div className="p-1 bg-yellow-100 rounded-md">
          <Clock className="h-4 w-4 text-yellow-600" />
        </div>
        <div className="font-bold text-sm text-gray-800">
          Nodo de Recordatorio
        </div>
      </div>
      <div className="p-3 text-xs text-gray-600">
        <p>
          Este nodo programa una acción para que se ejecute después de un tiempo
          determinado.
        </p>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400"
      />
    </div>
  );
};

export default ReminderNode;
