import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Database, CheckCircle, XCircle, CreditCard } from "lucide-react"

const IntegrationNode = ({ data }: NodeProps) => {
  const statusSuccess = data.statusSuccess || "success"
  const statusError = data.statusError || "error"
  const statusPaymentSuccess = "success_payment"

  return (
    <div className="bg-white rounded-xl shadow-lg w-80 border-2 border-stone-200/80 font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 border-b border-orange-200">
        <div className="flex items-center">
          <div className="p-2 bg-orange-500 rounded-lg mr-3">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div className="flex-grow min-w-0">
            <strong className="text-sm font-semibold text-stone-800 truncate block" title={data.name || "Integración"}>
              {data.name || "Integración"}
            </strong>
            <p className="text-xs text-stone-600 truncate" title={data.provider || "Configurar integración..."}>
              {data.provider || "No configurado"}
            </p>
          </div>
        </div>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 !bg-stone-400 !border-2 !border-white"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />
      
      {/* Main Content */}
      <div className="p-4">
        {/* Success Output */}
        <div className="mb-3">
          <div className="flex items-center justify-between group">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm font-medium text-stone-700">Link Generado</span>
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={statusSuccess}
              className="w-3 h-3 !bg-green-500 !border-2 !border-white transition-all group-hover:scale-110"
            />
          </div>
        </div>
        
        {/* Error Output */}
        <div className="mb-3">
          <div className="flex items-center justify-between group">
            <div className="flex items-center">
              <XCircle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-sm font-medium text-stone-700">Error al Generar</span>
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={statusError}
              className="w-3 h-3 !bg-red-500 !border-2 !border-white transition-all group-hover:scale-110"
            />
          </div>
        </div>
      </div>

      {/* Payment Success Section - Only for Wompi */}
      {data.provider === 'WOMPI' && (
        <div className="border-t border-stone-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="p-4">
            <div className="flex items-center justify-between group">
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 text-amber-600 mr-2" />
                <span className="text-sm font-semibold text-amber-800">Pago Exitoso</span>
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={statusPaymentSuccess}
                className="w-3 h-3 !bg-amber-500 !border-2 !border-white transition-all group-hover:scale-110"
              />
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Se ejecuta cuando el pago se confirma
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(IntegrationNode)
