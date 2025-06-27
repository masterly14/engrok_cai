import React from "react";
import { Handle, Position } from "reactflow";
import { Zap } from "lucide-react";

export default function TriggerNode({ data }: any) {
  return (
    <div className="flex flex-col items-center justify-center bg-yellow-50 border border-yellow-300 rounded-md shadow p-2 min-w-[120px]">
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