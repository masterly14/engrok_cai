"use client";

import { Handle, Position } from "reactflow";
import { PhoneForwarded } from "lucide-react";
import { motion } from "framer-motion";
import type { TransferCallNodeData } from "../../types";

interface TransferCallNodeProps {
  data: TransferCallNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

export function TransferCallNode({
  data,
  isConnectable,
  selected,
}: TransferCallNodeProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`rounded-lg overflow-hidden shadow-lg transition-shadow ${selected ? "ring-2 ring-green-500 ring-offset-2" : ""}`}
      style={{ minWidth: 220 }}
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-md">
            <PhoneForwarded className="h-5 w-5 text-white" />
          </div>
          <span className="font-medium text-white">{data.label}</span>
        </div>
      </div>
      <div className="bg-white border-x border-b border-gray-200 p-3 rounded-b-lg">
        <div className="text-sm text-gray-600">
          Transfiere la llamada a otro destino
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-600 border-2 border-white top-0"
      />
    </motion.div>
  );
}
