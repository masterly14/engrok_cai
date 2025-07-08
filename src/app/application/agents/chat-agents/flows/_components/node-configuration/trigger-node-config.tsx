"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { Node } from "reactflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus, Trash, Loader2, Copy } from "lucide-react";
import IntegrationComponent from "@/components/nango/integrationComponent";
import GoogleSheetsActions from "@/components/integrations/google-sheets-actions";

interface TriggerNodeConfigProps {
  selectedNode: Node;
  updateNode: (nodeId: string, updates: any) => void;
  workflowId?: string;
}

/* --------------------------- Integrations list --------------------------- */
const INTEGRATIONS = [
  {
    id: "webhook",
    name: "Webhook genérico",
    logo: "/file.svg",
    color: "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300",
    textColor: "text-blue-700",
  },
];

/* ------------------------------------------------------------------------ */
export function TriggerNodeConfig({
  selectedNode,
  updateNode,
  workflowId,
}: TriggerNodeConfigProps) {
  const data = (selectedNode.data || {}) as any;
  console.log(data);
  /* --------------------------- Local states --------------------------- */
  const [provider, setProvider] = useState<string>(data.provider || "");
  const [connected, setConnected] = useState<boolean>(!!data.connectionId);
  const [userId, setUserId] = useState<string | null>(null);

  /* Sync local states with external data changes */
  useEffect(() => {
    setProvider(data.provider || "");
    setConnected(!!data.connectionId);
  }, [data.provider, data.connectionId, selectedNode.id]);

  /* Fetch userId once */
  useEffect(() => {
    fetch("/api/users/current")
      .then((r) => r.json())
      .then((d) => setUserId(d.id))
      .catch(() => {});
  }, []);

  /* Helper to update node.data while preserving rest */
  const mergeNodeData = useCallback(
    (updates: Record<string, any>) => {
      updateNode(selectedNode.id, { data: { ...data, ...updates } });
    },
    [data, selectedNode.id, updateNode],
  );

  /* Provider selection */
  const handleProviderSelect = (id: string) => {
    setProvider(id);
    mergeNodeData({ provider: id });
  };

  const selectedIntegration = INTEGRATIONS.find((i) => i.id === provider);

  /* Mapping (phone & vars) */
  const mapping = data.mapping || { phone: "phone", vars: {} };
  const { phone = "phone", vars = {} } = mapping;

  const setPhoneField = (value: string) => {
    mergeNodeData({
      mapping: {
        phone: value.trim(),
        vars,
      },
    });
  };

  const addVariable = () => {
    mergeNodeData({
      mapping: {
        phone,
        vars: { ...vars, nueva: "columna" },
      },
    });
  };

  const updateVarKey = (oldKey: string, newKey: string) => {
    const v: Record<string, string> = { ...vars };
    const val = v[oldKey];
    delete v[oldKey];
    v[newKey] = val;
    mergeNodeData({ mapping: { phone, vars: v } });
  };

  const updateVarVal = (key: string, value: string) => {
    mergeNodeData({
      mapping: {
        phone,
        vars: { ...vars, [key]: value },
      },
    });
  };

  const deleteVar = (key: string) => {
    const v: Record<string, string> = { ...vars };
    delete v[key];
    mergeNodeData({ mapping: { phone, vars: v } });
  };

  /* ------------------ Webhook generation ------------------ */
  const [isGenerating, setIsGenerating] = useState(false);

  const generateWebhook = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/chat/trigger/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: data.workflowId || workflowId }),
      });

      if (res.ok) {
        const json = await res.json();
        mergeNodeData({ token: json.token, url: json.url });
      } else {
        const j = await res.json().catch(() => ({}));
        console.error("Error generating webhook", j?.error || res.statusText);
        window.alert(j?.error || "Error generando webhook");
      }
    } catch (e) {
      console.error(e);
      window.alert("Error generando webhook");
    } finally {
      setIsGenerating(false);
    }
  };

  /* ------------------------------ JSX ------------------------------ */
  return (
    <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Configuración de Trigger
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Selecciona un proveedor y mapea los datos que ingresarán al flujo.
        </p>
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-2 gap-3">
        {INTEGRATIONS.map((integration) => (
          <Button
            key={integration.id}
            variant="outline"
            onClick={() => handleProviderSelect(integration.id)}
            className={`relative flex flex-col items-center justify-center p-4 h-24 transition-all duration-200 ease-in-out ${
              integration.color
            } ${
              provider === integration.id
                ? "ring-2 ring-blue-500 ring-offset-2 shadow-md"
                : "hover:shadow-sm"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src={integration.logo || "/placeholder.svg"}
                  alt={integration.name}
                  width={60}
                  height={60}
                  className="object-cover rounded-sm"
                  style={{ objectFit: "contain", objectPosition: "center" }}
                />
              </div>
              <span
                className={`text-xs font-medium text-center leading-tight ${integration.textColor}`}
              >
                {integration.name}
              </span>
            </div>
          </Button>
        ))}
      </div>

      {/* Google Sheets specific sub-wizard */}
      {provider === "google-sheet" && connected && (
        <div className="mt-4">
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader>
              <CardTitle className="text-base">
                Acciones de Google Sheets
              </CardTitle>
              <CardDescription>
                Selecciona documento, pestaña y columnas a usar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleSheetsActions
                data={data}
                onDataChange={(updates) => mergeNodeData(updates)}
                userId={userId}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mapping section */}

      {/* ------------------ Webhook section ------------------ */}
      {provider === "webhook" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhook</CardTitle>
            <CardDescription>
              Genera una URL para disparar este flujo desde Zapier, Make, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.token ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input readOnly value={data.url || ""} className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      navigator.clipboard.writeText(data.url || "")
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Envíe un POST JSON a esta URL con los campos{" "}
                  <code>phone</code> y<code>variables</code>.
                </p>
              </div>
            ) : (
              <Button
                type="button"
                onClick={generateWebhook}
                disabled={isGenerating || !workflowId}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Generar URL
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
