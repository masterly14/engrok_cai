import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Handle, Position } from "reactflow";
import { ConversationNodeData, Variable } from "../../types";

interface ConversationNodeProps {
  data: ConversationNodeData;
  isConnectable: boolean;
  selected: boolean;
}

export function ConversationNode({
  data,
  isConnectable,
  selected,
}: ConversationNodeProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`rounded-lg overflow-hidden shadow-lg transition-shadow ${
        selected ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
      style={{ minWidth: 220, maxWidth: 300 }}
    >
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-md">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <span className="font-medium text-white">{data.label}</span>
        </div>
      </div>
      <div className="bg-white border-x border-b border-gray-200 p-3 rounded-b-lg">
        <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
          {data.prompt && data.prompt.trim().length > 0
            ? data.prompt
            : "Configura el prompt para la conversación."}
        </div>
        {data.variables?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 font-medium mb-1">Variables:</div>
            <div className="flex flex-wrap gap-1">
              {data.variables.map((variable: Variable, index: number) => (
                <span
                  key={variable.id || index}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-md font-mono"
                >
                  {`{{${variable.name || 'sin_nombre'}}}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-600 border-2 border-white top-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-600 border-2 border-white bottom-0"
      />
    </motion.div>
  );
}
