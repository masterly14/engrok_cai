import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { User } from "lucide-react"

const HandoverToHumanNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-amber-500 p-4 rounded-lg shadow-md w-64 text-white border-2 border-amber-600">
      <div className="flex items-center mb-2">
        <User className="w-5 h-5 mr-2" />
        <strong className="text-sm truncate" title={data.name || "Handover to Agent"}>
          {data.name || "Handover to Agent"}
        </strong>
      </div>
      <p className="text-xs opacity-80 truncate" title={data.botResponse || "Mensaje al usuario..."}>
        Bot: {data.botResponse || "Configure..."}
      </p>
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-300" />
    </div>
  )
}
export default memo(HandoverToHumanNode) 