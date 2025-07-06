import React from "react"
import { Handle, Position, NodeProps } from "reactflow"
import { Clock } from "lucide-react"

const ReminderNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`bg-white rounded-lg border-2 ${
        selected ? "border-blue-500" : "border-gray-300"
      } shadow-md overflow-hidden w-64`}
    >
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <div className="p-1 bg-yellow-100 rounded-md">
          <Clock className="h-4 w-4 text-yellow-600" />
        </div>
        <div className="font-bold text-sm text-gray-800">Nodo de Recordatorio</div>
      </div>
      <div className="p-3 text-xs text-gray-600">
        <p>Este nodo programa una acción para que se ejecute después de un tiempo determinado.</p>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
    </div>
  )
}

export default ReminderNode 