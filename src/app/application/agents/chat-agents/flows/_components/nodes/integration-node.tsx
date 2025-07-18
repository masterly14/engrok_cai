import { memo } from "react";
import Image from "next/image";
import { Handle, Position, useReactFlow, type NodeProps } from "reactflow";
import {
  Database,
  CheckCircle,
  XCircle,
  CreditCard,
  Calendar,
  Settings,
  Trash2,
} from "lucide-react";

const integrationDetails = {
  WOMPI: {
    name: "Wompi",
    img: "/integrations-logos-providers/wompi.jpg",
    icon: <CreditCard className="w-5 h-5 text-white" />,
    color: "bg-green-500",
    headerBg: "bg-gradient-to-r from-green-50 to-green-100",
    headerBorder: "border-green-200",
    successLabel: "Link Generado",
    errorLabel: "Error al Generar",
  },
  GOOGLE_CALENDAR: {
    name: "Google Calendar",
    img: "/integrations-logos-providers/google-calendar.png",
    icon: <Calendar className="w-5 h-5 text-white" />,
    color: "bg-blue-500",
    headerBg: "bg-gradient-to-r from-blue-50 to-blue-100",
    headerBorder: "border-blue-200",
    successLabel: "Disponibilidad Obtenida",
    errorLabel: "Error al Obtener",
  },
  DEFAULT: {
    name: "Integración",
    img: null,
    icon: <Database className="w-5 h-5 text-white" />,
    color: "bg-orange-500",
    headerBg: "bg-gradient-to-r from-orange-50 to-orange-100",
    headerBorder: "border-orange-200",
    successLabel: "Éxito",
    errorLabel: "Error",
  },
};

const IntegrationNode = ({ data, id }: NodeProps) => {
  const { setNodes, setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  const statusSuccess = data.statusSuccess || "success";
  const statusError = data.statusError || "error";
  const statusPaymentSuccess = "success_payment";

  const details =
    integrationDetails[data.provider as keyof typeof integrationDetails] ||
    integrationDetails.DEFAULT;

  return (
    <div className="relative bg-white rounded-xl shadow-lg w-80 border-2 border-stone-200/80 font-sans overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-2 right-2 flex gap-1 z-20">
        <button className="bg-white/80 hover:bg-white p-1 rounded shadow" title="Configuración">
          <Settings className="w-4 h-4 text-gray-700" />
        </button>
        <button onClick={handleDelete} className="bg-white/80 hover:bg-red-100 p-1 rounded shadow" title="Eliminar">
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
      {/* Header */}
      <div
        className={`${details.headerBg} p-4 border-b ${details.headerBorder}`}
      >
        <div className="flex items-center">
          <div
            className={`p-2 ${details.color} rounded-lg mr-3 flex items-center justify-center`}
          >
            {details.img ? (
              <Image
                src={details.img}
                alt={details.name}
                width={20}
                height={20}
                className="w-5 h-5"
              />
            ) : (
              details.icon
            )}
          </div>
          <div className="flex-grow min-w-0">
            <strong
              className="text-sm font-semibold text-stone-800 truncate block"
              title={data.name || details.name}
            >
              {data.name || details.name}
            </strong>
            <p className="text-xs text-stone-600 truncate" title={details.name}>
              {data.provider ? details.name : "No configurado"}
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
        style={{ top: "50%", transform: "translateY(-50%)" }}
      />

      {/* Main Content */}
      <div className="p-4 space-y-3">
        {/* Success Output */}
        <div className="relative">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">
              {details.successLabel}
            </span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id={statusSuccess}
            className="w-3 h-3 !bg-green-500 !border-2 !border-white"
          />
        </div>

        {/* Error Output */}
        <div className="relative">
          <div className="flex items-center">
            <XCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">
              {details.errorLabel}
            </span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id={statusError}
            className="w-3 h-3 !bg-red-500 !border-2 !border-white"
          />
        </div>
      </div>

      {/* Payment Success Section - Only for Wompi */}
      {data.provider === "WOMPI" && (
        <div className="border-t border-stone-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="p-4">
            <div className="flex items-center justify-between group">
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 text-amber-600 mr-2" />
                <span className="text-sm font-semibold text-amber-800">
                  Pago Exitoso
                </span>
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
  );
};

export default memo(IntegrationNode);
