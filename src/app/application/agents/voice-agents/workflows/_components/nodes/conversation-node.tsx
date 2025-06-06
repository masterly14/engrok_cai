import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Handle, Position } from "reactflow";
import { NodeData } from "../flow-builder";

interface ConversationNodeProps {
  data: NodeData;
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
      style={{ minWidth: 220 }}
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
        <div className="text-sm text-gray-600">
          Configura el prompt para la conversación.
        </div>
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
