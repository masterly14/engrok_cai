import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Database } from "lucide-react"

const IntegrationNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-orange-500 p-4 rounded-lg shadow-md w-64 text-white border-2 border-orange-600">
      <div className="flex items-center mb-2">
        <Database className="w-5 h-5 mr-2" />
        <strong className="text-sm truncate" title={data.name || "Integración"}>
          {data.name || "Integración"}
        </strong>
      </div>
      <p className="text-xs opacity-80 truncate" title={data.name || "Configurar integración..."}>
        Integration: {data.name || "Configurar..."}
      </p>
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-gray-300" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-gray-300" />
    </div>
  )
}
export default memo(IntegrationNode)
