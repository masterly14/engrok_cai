import { memo } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "reactflow";
import { Globe, CheckCircle, XCircle, Settings, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ApiRequestNode = ({
  data,
  id,
}: NodeProps<{
  name?: string;
  url?: string;
  statusSuccess?: string;
  statusError?: string;
}>) => {
  const { setNodes, setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <Card className="relative w-72 shadow-lg border-gray-200/80 bg-white">
      {/* Toolbar */}
      <div className="absolute top-2 right-2 flex gap-1 z-20">
        <button className="bg-white/80 hover:bg-white p-1 rounded shadow" title="Configuración">
          <Settings className="w-4 h-4 text-gray-700" />
        </button>
        <button onClick={handleDelete} className="bg-white/80 hover:bg-red-100 p-1 rounded shadow" title="Eliminar">
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>

      <CardHeader className="p-4 flex flex-row items-center gap-3 space-y-0 bg-gray-50/70 rounded-t-lg">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Globe className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <CardTitle className="text-sm font-semibold text-gray-900">
            {data.name || "API Request"}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-4 text-sm text-gray-700">
        <p className="line-clamp-3">
          {data.url || "Configure la URL de la API..."}
        </p>
      </CardContent>

      {/* Handles de salida para Éxito y Error */}
      <div className="border-t border-gray-200 px-4 py-2 space-y-2 bg-gray-50/50 rounded-b-lg">
        <p className="text-xs font-medium text-gray-500 mb-2">
          Salidas de Respuesta:
        </p>

        {/* Handle de Éxito */}
        <div className="relative flex items-center justify-between bg-white p-2 rounded-md border border-gray-200 group">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span
              className="text-xs font-medium text-gray-800 truncate"
              title={data.statusSuccess || "Success"}
            >
              {data.statusSuccess || "Success"}
            </span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="success" // ID fijo para la salida de éxito
            className="!w-4 !h-4 !bg-green-500 group-hover:!bg-green-600 transition-colors !border-2 !border-white !shadow-md"
          />
        </div>

        {/* Handle de Error */}
        <div className="relative flex items-center justify-between bg-white p-2 rounded-md border border-gray-200 group">
          <div className="flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span
              className="text-xs font-medium text-gray-800 truncate"
              title={data.statusError || "Failure"}
            >
              {data.statusError || "Failure"}
            </span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="error" // ID fijo para la salida de error
            className="!w-4 !h-4 !bg-red-500 group-hover:!bg-red-600 transition-colors !border-2 !border-white !shadow-md"
          />
        </div>
      </div>

      {/* Handle de entrada (target) para el nodo */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gray-400"
      />
    </Card>
  );
};
export default memo(ApiRequestNode);
