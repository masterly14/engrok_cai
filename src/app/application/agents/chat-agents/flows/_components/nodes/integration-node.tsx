import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Database, Zap, AlertCircle, CheckCircle } from "lucide-react"

const IntegrationNode = ({ data }: NodeProps) => {
  const statusSuccess = data.statusSuccess || "success"
  const statusError = data.statusError || "error"
  const statusPaymentSuccess = "success_payment"

  return (
    <div className="bg-white p-3 rounded-xl shadow-lg w-72 border-2 border-stone-200/80 font-sans">
      <div className="flex items-center mb-2 border-b border-stone-200/70 pb-2">
        <div className="p-2 bg-orange-100 rounded-lg mr-3">
          <Database className="w-5 h-5 text-orange-500" />
        </div>
        <div className="flex-grow min-w-0">
          <strong className="text-sm font-semibold text-stone-700 truncate block" title={data.name || "Integración"}>
            {data.name || "Integración"}
          </strong>
          <p className="text-xs text-stone-500 truncate" title={data.provider || "Configurar integración..."}>
            {data.provider || "No configurado"}
          </p>
        </div>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 !bg-stone-400"
      />
      
      {/* Output Handles Area */}
      <div className="mt-2 space-y-2 text-xs">
        {/* Success Handle */}
        <div className="flex items-center justify-between group">
          <span className="text-stone-600 group-hover:text-green-600 transition-colors">Link Generado</span>
          <Handle
              type="source"
              position={Position.Right}
              id={statusSuccess}
              className="w-2.5 h-2.5 !bg-green-500 !border-white transition-all group-hover:scale-125"
          />
        </div>
        
        {/* Error Handle */}
        <div className="flex items-center justify-between group">
          <span className="text-stone-600 group-hover:text-red-600 transition-colors">Error al Generar</span>
           <Handle
              type="source"
              position={Position.Right}
              id={statusError}
              className="w-2.5 h-2.5 !bg-red-500 !border-white transition-all group-hover:scale-125"
          />
        </div>
        
        {/* Payment Success Handle (Wompi only) */}
        {data.provider === 'WOMPI' && (
           <div className="flex items-center justify-between group">
              <span className="text-stone-600 group-hover:text-amber-600 transition-colors">Pago Exitoso</span>
              <Handle
                  type="source"
                  position={Position.Right}
                  id={statusPaymentSuccess}
                  className="w-2.5 h-2.5 !bg-amber-500 !border-white transition-all group-hover:scale-125"
              />
           </div>
        )}
      </div>
    </div>
  )
}

export default memo(IntegrationNode)
