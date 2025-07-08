import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { GitBranch, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ConditionNode = ({
  data,
}: NodeProps<{
  name?: string;
  condition?: string;
  statusSuccess?: string;
  statusError?: string;
}>) => {
  return (
    <Card className="w-72 shadow-lg border-gray-200/80 bg-white">
      <CardHeader className="p-4 flex flex-row items-center gap-3 space-y-0 bg-gray-50/70 rounded-t-lg">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <GitBranch className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <CardTitle className="text-sm font-semibold text-gray-900">
            {data.name || "Condition"}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-4 text-sm text-gray-700">
        <p className="line-clamp-3">
          {data.condition || "Configure la condición..."}
        </p>
      </CardContent>

      {/* Handles de salida para Éxito y Error */}
      <div className="border-t border-gray-200 px-4 py-2 space-y-2 bg-gray-50/50 rounded-b-lg">
        <p className="text-xs font-medium text-gray-500 mb-2">
          Salidas Condicionales:
        </p>

        {/* Handle de Éxito */}
        <div className="relative flex items-center justify-between bg-white p-2 rounded-md border border-gray-200 group">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span
              className="text-xs font-medium text-gray-800 truncate"
              title={data.statusSuccess || "Success"}
            >
              {data.statusSuccess || "Cumplido"}
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
              {data.statusError || "No cumplido"}
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

export default memo(ConditionNode);
