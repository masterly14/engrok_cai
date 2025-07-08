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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Settings,
  MessageSquare,
  Code,
  Bot,
  GitBranch,
} from "lucide-react";
import { JsonEditorField } from "./json-editor";

interface ApiRequestNodeConfigProps {
  selectedNode: Node;
  updateNode: (nodeId: string, updates: any) => void;
}

export function ApiRequestNodeConfig({
  selectedNode,
  updateNode,
}: ApiRequestNodeConfigProps) {
  const data = selectedNode.data || {};

  const handleChange = (field: string, value: any) => {
    updateNode(selectedNode.id, { data: { ...data, [field]: value } });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800";
      case "POST":
        return "bg-blue-100 text-blue-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Nodo de API Request</CardTitle>
                <CardDescription>
                  Configura una petición HTTP a una API externa
                </CardDescription>
              </div>
            </div>
            <Badge className={getMethodColor(data.method || "GET")}>
              {data.method || "GET"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ConfigField
            id="node-name"
            label="Nombre del nodo"
            value={data.name || ""}
            onChange={(val: any) => handleChange("name", val)}
            placeholder="E.g., Obtener datos del usuario"
          />
        </CardContent>
      </Card>

      {/* Request Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuración de la petición
          </CardTitle>
          <CardDescription>
            Define los parámetros básicos de la petición HTTP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            id="url"
            label="URL del endpoint"
            value={data.url || ""}
            onChange={(val: any) => handleChange("url", val)}
            placeholder="https://api.ejemplo.com/users/{{user.id}}"
            type="url"
            description="Puedes usar variables como {{user.id}} en la URL"
          />

          <div className="space-y-1.5">
            <Label
              htmlFor="method"
              className="font-medium text-sm text-gray-700"
            >
              Método HTTP
            </Label>
            <Select
              value={data.method || "GET"}
              onValueChange={(val: any) => handleChange("method", val)}
            >
              <SelectTrigger
                id="method"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/30"
              >
                <SelectValue placeholder="Selecciona el método HTTP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      GET
                    </Badge>
                    <span>Obtener datos</span>
                  </div>
                </SelectItem>
                <SelectItem value="POST">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      POST
                    </Badge>
                    <span>Crear recurso</span>
                  </div>
                </SelectItem>
                <SelectItem value="PUT">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      PUT
                    </Badge>
                    <span>Actualizar recurso</span>
                  </div>
                </SelectItem>
                <SelectItem value="DELETE">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      DELETE
                    </Badge>
                    <span>Eliminar recurso</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Headers Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="w-4 h-4" />
            Headers HTTP
          </CardTitle>
          <CardDescription>
            Configura los headers que se enviarán con la petición
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JsonEditorField
            id="headers"
            label="Headers (JSON)"
            value={data.headers}
            onChange={(val: any) => handleChange("headers", val)}
            placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer {{token}}"\n}'
            rows={6}
            description="Headers comunes: Content-Type, Authorization, Accept, etc."
          />
        </CardContent>
      </Card>

      {/* Body Configuration */}
      {(data.method === "POST" ||
        data.method === "PUT" ||
        data.method === "PATCH") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="w-4 h-4" />
              Cuerpo de la petición
            </CardTitle>
            <CardDescription>
              Datos que se enviarán en el cuerpo de la petición {data.method}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JsonEditorField
              id="body"
              label="Body (JSON)"
              value={data.body}
              onChange={(val: any) => handleChange("body", val)}
              placeholder='{\n  "name": "{{user.name}}",\n  "email": "{{user.email}}",\n  "data": {\n    "key": "value"\n  }\n}'
              rows={8}
              description="Datos que se enviarán en el cuerpo de la petición. Usa variables para datos dinámicos."
            />
          </CardContent>
        </Card>
      )}

      {/* Trigger Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Configuración del disparador
          </CardTitle>
          <CardDescription>
            Define cuándo se ejecutará esta petición API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigField
            id="user-response"
            label="Respuesta del usuario (Disparador)"
            value={data.userResponse || ""}
            onChange={(val: any) => handleChange("userResponse", val)}
            placeholder="api, datos, consultar"
            description="Palabras clave que activarán esta petición API"
            as="textarea"
            rows={2}
            disabled={data.isUserResponseAuto}
          />
        </CardContent>
      </Card>

      {/* Response Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="w-4 h-4 text-gray-600" />
            Manejo de la Respuesta
          </CardTitle>
          <CardDescription>
            Define qué hacer con la respuesta de la API y cómo ramificar el
            flujo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigField
            id="agentResponse"
            label="Guardar respuesta en variable"
            value={data.agentResponse || ""}
            onChange={(val: any) => handleChange("agentResponse", val)}
            placeholder="E.g., datos_usuario_api"
            description="La respuesta JSON completa se guardará en esta variable."
          />
          <ConfigField
            id="dataPath"
            label="Ruta a los datos principales (opcional)"
            value={data.dataPath || ""}
            onChange={(val: any) => handleChange("dataPath", val)}
            placeholder="Ej: data, results.0, payload.user"
            description="Si la API anida los datos (ej: { data: [...] }), especifica la ruta para un acceso más fácil."
          />
          <div>
            <Label className="font-medium text-sm text-gray-700 flex items-center gap-1.5">
              <GitBranch className="w-3 h-3" />
              Ramificación del flujo
            </Label>
            <p className="text-xs text-gray-500 mb-2 mt-0.5">
              Define las etiquetas para las salidas de éxito y error del nodo.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ConfigField
                id="statusSuccess"
                label="Salida Éxito"
                value={data.statusSuccess || "success"}
                onChange={(val: any) => handleChange("statusSuccess", val)}
                placeholder="success"
              />
              <ConfigField
                id="statusError"
                label="Salida Error"
                value={data.statusError || "error"}
                onChange={(val: any) => handleChange("statusError", val)}
                placeholder="error"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-2">
                Resumen de la petición
              </h4>
              <div className="space-y-1 text-sm text-purple-700">
                <p>
                  <strong>Método:</strong> {data.method || "GET"}
                </p>
                <p>
                  <strong>URL:</strong> {data.url || "No configurada"}
                </p>
                {data.userResponse && (
                  <p>
                    <strong>Disparador:</strong> "{data.userResponse}"
                  </p>
                )}
                <p>
                  <strong>Headers:</strong>{" "}
                  {data.headers ? "Configurados" : "Ninguno"}
                </p>
                {(data.method === "POST" ||
                  data.method === "PUT" ||
                  data.method === "PATCH") && (
                  <p>
                    <strong>Body:</strong> {data.body ? "Configurado" : "Vacío"}
                  </p>
                )}
                <p>
                  <strong>Guarda respuesta en:</strong>{" "}
                  {data.agentResponse || "No especificado"}
                </p>
                <p>
                  <strong>Ruta de datos:</strong>{" "}
                  {data.dataPath || "Raíz del objeto"}
                </p>
                <p>
                  <strong>Mensaje post-llamada:</strong>{" "}
                  {data.botResponse ? "Configurado" : "Ninguno"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
