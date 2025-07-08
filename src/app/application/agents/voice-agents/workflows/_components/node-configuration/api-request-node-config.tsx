"use client";

import type { NodeConfigurationProps } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JsonEditorField } from "@/app/application/agents/chat-agents/flows/_components/shared-config-components";
import type { ApiRequestNodeData } from "../../types";

export function ApiRequestNodeConfig({
  selectedNode,
  updateNode,
}: NodeConfigurationProps) {
  const nodeData = selectedNode.data as ApiRequestNodeData;

  const handleChange = (field: keyof ApiRequestNodeData, value: any) => {
    updateNode(selectedNode.id, { [field]: value });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50/50 rounded-lg">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Configuración API Request
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Define la URL, método y cuerpo de la petición HTTP.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>URL</Label>
          <Input
            value={nodeData.url}
            onChange={(e) => handleChange("url", e.target.value)}
            placeholder="https://api.example.com/endpoint"
          />
        </div>

        <div className="space-y-2">
          <Label>Método HTTP</Label>
          <Select
            value={nodeData.method}
            onValueChange={(v) =>
              handleChange("method", v as ApiRequestNodeData["method"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Headers JSON Editor */}
        <JsonEditorField
          id="headers-json"
          label="Headers"
          value={nodeData.headers || {}}
          onChange={(val) => handleChange("headers", val)}
          placeholder='{"Content-Type": "application/json"}'
          rows={4}
        />

        {/* Body JSON Editor */}
        <JsonEditorField
          id="body-json"
          label="Body (JSON)"
          value={nodeData.body || {}}
          onChange={(val) => handleChange("body", val)}
          placeholder='{"name": "Juan"}'
          rows={6}
        />
      </div>
    </div>
  );
}
