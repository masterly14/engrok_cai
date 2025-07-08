"use client";

import type { Node } from "reactflow";
import {
  ConfigField,
  InteractiveButtonsConfig,
} from "../shared-config-components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  Settings,
  MessageSquare,
  MousePointer,
  Database,
  Tag,
  User,
  FileText,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { parseJsonSafely, stringifyJsonSafely } from "./json-editor";
import { useAllLeads } from "@/hooks/use-all-leads";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CrmNodeConfigProps {
  selectedNode: Node;
  updateNode: (nodeId: string, updates: any) => void;
}

export function CrmNodeConfig({
  selectedNode,
  updateNode,
}: CrmNodeConfigProps) {
  const data = selectedNode.data || {};
  const [openAccordionItem, setOpenAccordionItem] = useState<
    string | undefined
  >("basic-config");

  /*
   * Obtener las etapas (stages) y etiquetas (tags) que el usuario ya tiene configuradas
   * en su CRM utilizando el mismo endpoint que se usa en el dashboard de leads.
   * Activamos el fetch inmediatamente de forma que cuando se monta el nodo tengamos
   * las opciones disponibles. Si por alguna razón no hay datos todavía se mostrará
   * un fallback al campo de texto normal.
   */
  const { stagesData = [], tagsData = [] } = useAllLeads(true);

  const handleChange = (field: string, value: any) => {
    updateNode(selectedNode.id, { data: { ...data, [field]: value } });
  };

  // Manejo mejorado del body con validación
  const handleBodyChange = (field: string, value: any) => {
    try {
      const currentBody = parseJsonSafely(data.body, {});
      const updatedBody = { ...currentBody, [field]: value };
      handleChange("body", stringifyJsonSafely(updatedBody));
    } catch (e) {
      console.error("Error updating CRM body:", e);
    }
  };

  const getBodyFieldValue = (field: string) => {
    const currentBody = parseJsonSafely(data.body, {});
    return currentBody[field] || "";
  };

  // Validar si los campos requeridos están completos
  const getRequiredFieldsStatus = () => {
    const requiredFields = {
      name: getBodyFieldValue("name"),
      phone: getBodyFieldValue("phone"),
      nodeName: data.name,
      userResponse: data.userResponse,
    };

    const completed = Object.values(requiredFields).filter(Boolean).length;
    const total = Object.keys(requiredFields).length;

    return { completed, total, isComplete: completed === total };
  };

  const { completed, total, isComplete } = getRequiredFieldsStatus();

  // Asegurar que la URL tenga el accessToken como query param una sola vez al montar
  useEffect(() => {
    const ensureAccessTokenInUrl = async () => {
      try {
        // Evitar ejecutar en SSR
        if (typeof window === "undefined") return;
        // Comprobar si ya existe
        const currentUrl: string | undefined = data.url;
        let hasToken = false;
        if (currentUrl) {
          try {
            const u = new URL(currentUrl, window.location.origin);
            hasToken = u.searchParams.has("accessToken");
          } catch {
            // URL relativa sin dominio, continuar
          }
        }

        if (!hasToken) {
          const res = await fetch("/api/crm/access-token");
          if (!res.ok) throw new Error("No se pudo obtener el accessToken");
          const { accessToken } = await res.json();

          // Construir la base
          const base = process.env.NEXT_PUBLIC_BASE_URL
            ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/crm/contacts`
            : "/api/crm/contacts";

          const newUrl = `${base}?accessToken=${accessToken}`;
          handleChange("url", newUrl);
        }
      } catch (err) {
        console.error("[CRM Node] Error asegurando accessToken:", err);
      }
    };

    ensureAccessTokenInUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 p-1">
      {/* Header Section */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Nodo CRM</CardTitle>
                <CardDescription>
                  Crea o actualiza contactos en tu sistema CRM
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isComplete ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {isComplete ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {completed}/{total} campos
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ConfigField
            id="node-name"
            label="Nombre del nodo"
            value={data.name || ""}
            onChange={(val: any) => handleChange("name", val)}
            placeholder="E.j: Crear nuevo contacto, Actualizar lead"
          />
        </CardContent>
      </Card>

      {/* Accordion Configuration */}
      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={openAccordionItem}
        onValueChange={setOpenAccordionItem}
      >
        {/* Contact Information */}
        <AccordionItem value="contact-config">
          <AccordionTrigger className="text-base font-medium px-4 py-3 hover:bg-muted/50 rounded-t-lg data-[state=closed]:rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Información del Contacto
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 px-4 space-y-4 border-x border-b rounded-b-lg">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Datos básicos del contacto
                </CardTitle>
                <CardDescription>
                  Información principal que se guardará en el CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={data.useInfoWhatsApp}
                    onCheckedChange={(val: any) =>
                      handleChange("useInfoWhatsApp", val)
                    }
                  />
                  <Label htmlFor="crm-contact-name">
                    Obtener información de contacto desde WhatsApp
                  </Label>
                </div>
                {!data.useInfoWhatsApp && (
                  <>
                    <ConfigField
                      id="crm-contact-name"
                      label="Nombre del contacto"
                      value={getBodyFieldValue("name")}
                      onChange={(val: any) => handleBodyChange("name", val)}
                      placeholder="{{user.name}} o nombre estático"
                      description="Usa variables como {{user.name}} para datos dinámicos"
                    />

                    <ConfigField
                      id="crm-phone"
                      label="Número de teléfono"
                      value={getBodyFieldValue("phone")}
                      onChange={(val: any) => handleBodyChange("phone", val)}
                      placeholder="{{user.phone}} o +1234567890"
                      description="Número de teléfono del contacto"
                    />
                  </>
                )}
                {data.useInfoWhatsApp && (
                  <>
                    <p className="text-sm text-gray-500">
                      Se obtendrá el número y el nombre del contacto desde
                      WhatsApp. Ahora solo configura el correo electrónico.
                    </p>
                    <ConfigField
                      id="crm-email"
                      label="Correo electrónico"
                      value={getBodyFieldValue("email")}
                      onChange={(val: any) => handleBodyChange("email", val)}
                      placeholder="{{user.email}} o email@ejemplo.com"
                      type="text"
                      description="Dirección de correo electrónico del contacto"
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Clasificación y seguimiento
                </CardTitle>
                <CardDescription>
                  Organiza y categoriza el contacto en tu CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Select para Etapa (Stage) */}
                {stagesData.length > 0 ? (
                  <div className="space-y-1.5 max-w-xs">
                    <Label
                      htmlFor="crm-stage"
                      className="font-medium text-gray-700"
                    >
                      Etapa del contacto
                    </Label>
                    <Select
                      value={getBodyFieldValue("stage")}
                      onValueChange={(val) => handleBodyChange("stage", val)}
                    >
                      <SelectTrigger id="crm-stage" className="w-full">
                        <SelectValue placeholder="Selecciona una etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {stagesData.map((stage: any) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Etapa actual del contacto en tu pipeline de ventas
                    </p>
                  </div>
                ) : (
                  <ConfigField
                    id="crm-stage"
                    label="Etapa del contacto"
                    value={getBodyFieldValue("stage")}
                    onChange={(val: any) => handleBodyChange("stage", val)}
                    placeholder="Lead, Prospect, Cliente, Oportunidad"
                    description="Etapa actual del contacto en tu pipeline de ventas"
                  />
                )}

                {/* Select para Etiqueta (Tag) */}
                {tagsData.length > 0 ? (
                  <div className="space-y-1.5 max-w-xs">
                    <Label
                      htmlFor="crm-tag"
                      className="font-medium text-gray-700"
                    >
                      Etiqueta
                    </Label>
                    <Select
                      value={getBodyFieldValue("tag")}
                      onValueChange={(val) => handleBodyChange("tag", val)}
                    >
                      <SelectTrigger id="crm-tag" className="w-full">
                        <SelectValue placeholder="Selecciona una etiqueta" />
                      </SelectTrigger>
                      <SelectContent>
                        {tagsData.map((tag: any) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Etiqueta para categorizar el contacto
                    </p>
                  </div>
                ) : (
                  <ConfigField
                    id="crm-tag"
                    label="Etiquetas"
                    value={getBodyFieldValue("tag")}
                    onChange={(val: any) => handleBodyChange("tag", val)}
                    placeholder="Newsletter, Demo Request, Webinar"
                    description="Etiquetas para categorizar el contacto"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Información adicional
                </CardTitle>
                <CardDescription>
                  Notas y detalles extra sobre el contacto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConfigField
                  id="crm-notes"
                  label="Notas"
                  value={getBodyFieldValue("notes")}
                  onChange={(val: any) => handleBodyChange("notes", val)}
                  placeholder="Información adicional sobre el contacto, intereses, comentarios..."
                  as="textarea"
                  rows={4}
                  description="Cualquier información relevante sobre el contacto"
                />
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Summary Footer */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-orange-900 mb-2">
                Resumen del contacto CRM
              </h4>
              <div className="space-y-1 text-sm text-orange-700">
                <p>
                  <strong>Nombre del nodo:</strong> {data.name || "Sin nombre"}
                </p>
                {getBodyFieldValue("name") && (
                  <div className="flex items-center gap-2">
                    <p>
                      <strong>Nombre del contacto:</strong>{" "}
                      {getBodyFieldValue("name")}
                    </p>
                  </div>
                )}
                {getBodyFieldValue("phone") && (
                  <p>
                    <strong>Teléfono:</strong> {getBodyFieldValue("phone")}
                  </p>
                )}
                {getBodyFieldValue("stage") && (
                  <p>
                    <strong>Etapa:</strong> {getBodyFieldValue("stage")}
                  </p>
                )}
                {getBodyFieldValue("tag") && (
                  <p>
                    <strong>Etiquetas:</strong> {getBodyFieldValue("tag")}
                  </p>
                )}
                {data.userResponse && (
                  <p>
                    <strong>Disparador:</strong> "{data.userResponse}"
                  </p>
                )}
                {data.interactiveButtons &&
                  data.interactiveButtons.length > 0 && (
                    <p>
                      <strong>Botones interactivos:</strong>{" "}
                      {data.interactiveButtons.length} configurados
                    </p>
                  )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
