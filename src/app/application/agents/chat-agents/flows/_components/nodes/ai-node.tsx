"use client";

import { memo } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "reactflow";
import { Bot, Settings, Trash2 } from "lucide-react";

// Interfaz para los datos específicos del nodo de IA (sin condiciones)
export interface AiNodeData {
  name: string;
  prompt: string;
  ragEnabled: boolean;
  knowledgeBaseId: string;
}

// El componente del nodo de IA rediseñado
const AINode = memo(({ data, isConnectable, id }: NodeProps<AiNodeData>) => {
  const { setNodes, setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };
  const { name = "Nodo de IA", prompt = "Sin prompt" } = data;

  return (
    <div className="relative bg-white border-2 border-purple-500 shadow-lg rounded-lg w-64 font-sans overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-2 right-2 flex gap-1 z-20">
        <button className="bg-white/80 hover:bg-white p-1 rounded shadow" title="Configuración">
          <Settings className="w-4 h-4 text-gray-700" />
        </button>
        <button onClick={handleDelete} className="bg-white/80 hover:bg-red-100 p-1 rounded shadow" title="Eliminar">
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
      {/* Header */}
      <div className="bg-purple-500 text-white p-3 flex items-center gap-2">
        <Bot className="h-5 w-5 flex-shrink-0" />
        <h3 className="font-bold text-sm truncate">{name}</h3>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!bg-gray-400 !w-3 !h-3"
        isConnectable={isConnectable}
      />

      {/* Main Content */}
      <div className="p-3 text-xs text-gray-700 border-b border-gray-200">
        <p className="line-clamp-3">{prompt || "Prompt no configurado."}</p>
      </div>

      {/* Outputs Section */}
      <div className="bg-gray-50/50">
        {/* Conditional Output */}
        <div className="group relative flex items-center justify-between px-3 h-10 border-b border-gray-200">
          <span className="text-xs text-gray-600 group-hover:text-purple-700 transition-colors">
            Salida Condicional
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="condition"
            className="!bg-purple-500 !w-3 !h-3"
            isConnectable={isConnectable}
          />
        </div>

        {/* Fallback Output */}
        <div className="group relative flex items-center justify-between px-3 h-10">
          <span className="text-xs text-gray-500 italic group-hover:text-black transition-colors">
            Fallback
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="fallback"
            className="!bg-gray-600 !w-3 !h-3"
            isConnectable={isConnectable}
          />
        </div>
      </div>
    </div>
  );
});

AINode.displayName = "AINode";

export default AINode;
