import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Check, Edit2, Pencil, PercentCircle, X } from "lucide-react";
import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, EdgeProps, useReactFlow } from "reactflow";

function getStraightEdgePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
) {
  const midY = sourceY + (targetY - sourceY) / 2;

  const path = `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`;

  const labelX = sourceX + (targetX - sourceX) / 2;
  const labelY = midY;

  return [path, labelX, labelY];
}

export function conditionEdges({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [condition, setCondition] = useState(data?.condition?.prompt || "Condition");
  const [tempCondition, setTempCondition] = useState(condition);

  const [edgePath, labelX, labelY] = getStraightEdgePath(
    sourceX,
    sourceY,
    targetX,
    targetY
  );

  const handleSave = () => {
    setIsEditing(false);
    setCondition(tempCondition);

    // Actualizar los datos del edge en el estado de React Flow
    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            data: {
              ...edge.data,
              condition: { ...edge.data?.condition, prompt: tempCondition },
            },
          };
        }
        return edge;
      })
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempCondition(condition);
  };

  return (
    <>
      <BaseEdge
        path={edgePath as string}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? "#3b82f6" : "#64748b",
          fill: "none",
          transition: "stroke 0.2s, stroke-width 0.2s",
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            fontSize: 12,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-lg min-w-[200px]">
                <div className="flex flex-col gap-2">
                  <Input
                    value={tempCondition}
                    onChange={(e) => setTempCondition(e.target.value)}
                    className="text-xs h-8 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                    placeholder="Condición"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-7 px-3 bg-red-500 text-white hover:bg-red-600"
                      onClick={handleCancel}
                    >
                      {" "}
                      <X className="w-4 h-4" /> Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 px-3 bg-green-500 text-white hover:bg-green-600"
                      onClick={handleSave}
                    >
                      {" "}
                      <Check className="w-4 h-4" /> Guardar
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Card
                className={`px-3 py-1.5 cursor-pointer transition-all duration-200 shadow-md ${
                  selected
                    ? "bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300"
                    : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:from-amber-100 hover:to-orange-100"
                }`}
                onClick={() => setIsEditing(true)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      selected ? "text-amber-800" : "text-amber-700"
                    }`}
                  >
                    {condition}
                  </span>
                  <Edit2
                    className={`h-3 w-3 ${
                      selected ? "text-amber-600" : "text-amber-500"
                    }`}
                  />
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Este componente es para crear las aristas de las condiciones
// Se puede editar el texto de la condición
