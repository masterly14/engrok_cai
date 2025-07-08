"use client";

import type { Node } from "reactflow";
import { ConfigField } from "../shared-config-components";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitBranch, Code, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React from "react";

interface ConditionNodeConfigProps {
  selectedNode: Node;
  updateNode: (nodeId: string, updates: any) => void;
  globalVariables: string[];
  onValidationChange?: (hasErrors: boolean) => void;
}

const CONDITION_OPERATORS = [
  {
    value: "==",
    label: "== (igual)",
    description: "Valores son exactamente iguales",
  },
  {
    value: "!=",
    label: "!= (no igual)",
    description: "Valores son diferentes",
  },
  {
    value: ">",
    label: "> (mayor)",
    description: "Primer valor es mayor que el segundo",
  },
  {
    value: ">=",
    label: ">= (mayor o igual)",
    description: "Primer valor es mayor o igual al segundo",
  },
  {
    value: "<",
    label: "< (menor)",
    description: "Primer valor es menor que el segundo",
  },
  {
    value: "<=",
    label: "<= (menor o igual)",
    description: "Primer valor es menor o igual al segundo",
  },
  {
    value: "contains",
    label: "contiene",
    description: "Primer valor contiene el segundo",
  },
  {
    value: "startsWith",
    label: "empieza con",
    description: "Primer valor empieza con el segundo",
  },
  {
    value: "endsWith",
    label: "termina con",
    description: "Primer valor termina con el segundo",
  },
  {
    value: "isEmpty",
    label: "está vacío",
    description: "El valor está vacío o no definido",
  },
  {
    value: "isNotEmpty",
    label: "no está vacío",
    description: "El valor tiene contenido",
  },
];

export function ConditionNodeConfig({
  selectedNode,
  updateNode,
  globalVariables,
  onValidationChange,
}: ConditionNodeConfigProps) {
  const data = selectedNode.data || {};

  // ---------- Variable validation helpers ----------
  const isVariable = (val: string) => /\{\{\s*[^{}]+\s*\}\}/.test(val);
  const extractVariableName = (val: string) => {
    const match = val.match(/\{\{\s*([^{}]+)\s*\}\}/);
    return match ? match[1].trim() : "";
  };

  // Validation state
  const [leftError, setLeftError] = React.useState<string>("");
  const [rightError, setRightError] = React.useState<string>("");

  // Function to validate variable usage
  const validateVariable = (value: string, setError: (msg: string) => void) => {
    if (!isVariable(value)) {
      setError("");
      return;
    }

    if (globalVariables.length === 0) {
      setError(
        "Este flujo no contiene variables disponibles para comparación. Agrega un nodo de captura de respuesta primero.",
      );
      return;
    }

    const varName = extractVariableName(value);
    if (!globalVariables.includes(varName)) {
      setError(`La variable "${varName}" no existe en el flujo.`);
    } else {
      setError("");
    }
  };

  // Parse existing condition or set defaults
  const parseCondition = (condition: string) => {
    if (!condition) return { leftValue: "", operator: "==", rightValue: "" };

    // Try to parse existing condition format like "{{orderStatus}} == 'shipped'"
    const patterns = [
      { regex: /^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/, hasRightValue: true },
      {
        regex: /^(.+?)\s*(contains|startsWith|endsWith)\s*(.+)$/,
        hasRightValue: true,
      },
      { regex: /^(.+?)\s*(isEmpty|isNotEmpty)$/, hasRightValue: false },
    ];

    for (const pattern of patterns) {
      const match = condition.match(pattern.regex);
      if (match) {
        return {
          leftValue: match[1].trim(),
          operator: match[2].trim(),
          rightValue: pattern.hasRightValue ? match[3].trim() : "",
        };
      }
    }

    // If no pattern matches, return the condition as leftValue
    return { leftValue: condition, operator: "==", rightValue: "" };
  };

  const conditionParts = parseCondition(data.condition || "");

  const handleChange = (field: string, value: any) => {
    updateNode(selectedNode.id, { data: { ...data, [field]: value } });
  };

  const handleConditionPartChange = (
    part: "leftValue" | "operator" | "rightValue",
    value: string,
  ) => {
    const newParts = { ...conditionParts, [part]: value };

    // Build the condition string
    let conditionString = "";
    if (newParts.leftValue) {
      conditionString = newParts.leftValue;
      if (newParts.operator) {
        if (
          newParts.operator === "isEmpty" ||
          newParts.operator === "isNotEmpty"
        ) {
          conditionString += ` ${newParts.operator}`;
        } else if (newParts.rightValue) {
          conditionString += ` ${newParts.operator} ${newParts.rightValue}`;
        }
      }
    }

    // Validate variable usage on the changed part
    if (part === "leftValue") validateVariable(value, setLeftError);
    if (part === "rightValue") validateVariable(value, setRightError);

    handleChange("condition", conditionString);
  };

  const selectedOperator = CONDITION_OPERATORS.find(
    (op) => op.value === conditionParts.operator,
  );
  const needsRightValue = !["isEmpty", "isNotEmpty"].includes(
    conditionParts.operator,
  );

  // Revalidate when globalVariables list changes
  React.useEffect(() => {
    validateVariable(conditionParts.leftValue, setLeftError);
    validateVariable(conditionParts.rightValue, setRightError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalVariables]);

  // Notify parent whenever error state changes
  React.useEffect(() => {
    const hasErrors = leftError !== "" || rightError !== "";
    onValidationChange?.(hasErrors);
  }, [leftError, rightError, onValidationChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <GitBranch className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Condition Node</CardTitle>
                <CardDescription>
                  Configure logical conditions to branch your flow
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Code className="w-3 h-3" />
              Logic
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ConfigField
            id="node-name"
            label="Nombre del nodo"
            value={data.name}
            onChange={(val: any) => handleChange("name", val)}
            placeholder="E.j: Verificar estado del pedido"
          />
        </CardContent>
      </Card>

      {/* Condition Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="w-4 h-4" />
            Constructor de Condición
          </CardTitle>
          <CardDescription>
            Construye tu condición lógica usando los campos a continuación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Left Value */}
          <div className="space-y-2">
            <Label htmlFor="left-value" className="font-medium text-gray-700">
              Primer Valor
            </Label>
            <Input
              id="left-value"
              value={conditionParts.leftValue}
              onChange={(e) =>
                handleConditionPartChange("leftValue", e.target.value)
              }
              placeholder="E.j: {{orderStatus}}, {{userName}}, 'texto'"
              className="bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/30"
            />
            <p className="text-xs text-gray-500">
              Usa {"{{variableName}}"} para variables o 'texto' para valores
              literales
            </p>
            {leftError && (
              <p className="text-xs text-red-500 font-medium">{leftError}</p>
            )}
          </div>

          {/* Operator */}
          <div className="space-y-2">
            <Label htmlFor="operator" className="font-medium text-gray-700">
              Operador de Comparación
            </Label>
            <Select
              value={conditionParts.operator}
              onValueChange={(value) =>
                handleConditionPartChange("operator", value)
              }
            >
              <SelectTrigger
                id="operator"
                className="bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/30"
              >
                <SelectValue placeholder="Selecciona un operador" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPERATORS.map((operator) => (
                  <SelectItem key={operator.value} value={operator.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{operator.label}</span>
                      <span className="text-xs text-gray-500">
                        {operator.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOperator && (
              <p className="text-xs text-gray-500">
                {selectedOperator.description}
              </p>
            )}
          </div>

          {/* Right Value */}
          {needsRightValue && (
            <div className="space-y-2">
              <Label
                htmlFor="right-value"
                className="font-medium text-gray-700"
              >
                Segundo Valor
              </Label>
              <Input
                id="right-value"
                value={conditionParts.rightValue}
                onChange={(e) =>
                  handleConditionPartChange("rightValue", e.target.value)
                }
                placeholder="E.j: 'shipped', {{otherVariable}}, 100"
                className="bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/30"
              />
              <p className="text-xs text-gray-500">
                Valor a comparar con el primer valor
              </p>
              {rightError && (
                <p className="text-xs text-red-500 font-medium">{rightError}</p>
              )}
            </div>
          )}

          {/* Condition Preview */}
          {data.condition && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <Label className="text-xs font-medium text-gray-600 mb-1 block">
                Condición Generada:
              </Label>
              <code className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border">
                {data.condition}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración Adicional</CardTitle>
          <CardDescription>
            Configuraciones opcionales para el comportamiento del nodo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            id="bot-response"
            label="Respuesta del bot (Opcional)"
            value={data.botResponse}
            onChange={(val: any) => handleChange("botResponse", val)}
            placeholder="Condición evaluada."
            as="textarea"
            description="Un mensaje que el bot podría enviar o registrar después de la evaluación."
          />
          <ConfigField
            id="user-response"
            label="Respuesta del usuario (Disparador)"
            value={data.userResponse}
            onChange={(val: any) => handleChange("userResponse", val)}
            placeholder="Palabra clave o frase para activar este nodo"
            as="textarea"
            disabled={data.isUserResponseAuto}
            description="Deja vacío si este nodo se activa automáticamente desde otro nodo"
          />
        </CardContent>
      </Card>
    </div>
  );
}
