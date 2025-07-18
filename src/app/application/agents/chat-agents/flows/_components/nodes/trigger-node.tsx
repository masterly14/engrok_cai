import React from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import { Zap, Settings, Trash2 } from "lucide-react";

export default function TriggerNode({ data, id }: any) {
  const { setNodes, setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <div className="relative flex flex-col items-center justify-center bg-yellow-50 border border-yellow-300 rounded-md shadow p-2 min-w-[120px]">
      {/* Toolbar */}
      <div className="absolute top-1 right-1 flex gap-1 z-20">
        <button className="bg-white/80 hover:bg-white p-1 rounded shadow" title="Configuración">
          <Settings className="w-3 h-3 text-gray-700" />
        </button>
        <button onClick={handleDelete} className="bg-white/80 hover:bg-red-100 p-1 rounded shadow" title="Eliminar">
          <Trash2 className="w-3 h-3 text-red-600" />
        </button>
      </div>
      <div className="flex items-center gap-1 text-yellow-700 font-medium text-sm">
        <Zap className="w-4 h-4" />
        Trigger
      </div>
      {data?.name && (
        <div className="text-xs text-gray-600 mt-1 max-w-[100px] truncate text-center">
          {data.name}
        </div>
      )}
      {/* Este nodo no tiene handles entrantes: es punto inicial */}
      <Handle type="source" position={Position.Bottom} id="default" />
    </div>
  );
}
