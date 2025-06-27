import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Link } from "lucide-react"

const UrlButtonNode = ({ data }: NodeProps) => {
  return (
    <div className="bg-sky-500 p-4 rounded-lg shadow-md w-64 text-white border-2 border-sky-600">
      <div className="flex items-center mb-2">
        <Link className="w-5 h-5 mr-2" />
        <strong className="text-sm truncate" title={data.name || "URL Button"}>
          {data.name || "URL Button"}
        </strong>
      </div>
      <p className="text-xs opacity-80 truncate" title={data.message || "Configure message..."}>
        Msg: {data.message || "Configure..."}
      </p>
      <p className="text-xs opacity-70 mt-1 truncate" title={data.url || "Configure URL..."}>
        URL: {data.url || "Configure..."}
      </p>
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-300" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-gray-300" />
    </div>
  )
}
export default memo(UrlButtonNode)
