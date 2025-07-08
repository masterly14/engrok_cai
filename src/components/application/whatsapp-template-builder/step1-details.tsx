"use client";

import type React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type TemplateFormData,
  SUPPORTED_LANGUAGES,
  type Language,
} from "./types";
import type { TemplateCategory } from "@/actions/whatsapp/templates";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Step1DetailsProps {
  formData: TemplateFormData;
  onFormChange: (field: keyof TemplateFormData, value: any) => void;
  nameValidationMessage?: string;
}

const CATEGORIES: {
  value: TemplateCategory;
  label: string;
  description: string;
}[] = [
  {
    value: "UTILITY",
    label: "Utilidad (Utility)",
    description:
      "Transacciones específicas, acordadas o solicitadas por el cliente (ej. confirmaciones de pedido, alertas).",
  },
  {
    value: "AUTHENTICATION",
    label: "Autenticación (Authentication)",
    description:
      "Contraseñas de un solo uso para verificar usuarios (ej. verificación de cuenta, recuperación de cuenta).",
  },
  {
    value: "MARKETING",
    label: "Marketing",
    description:
      "Promociones, ofertas, actualizaciones informativas o invitaciones a responder/actuar.",
  },
];

export default function Step1Details({
  formData,
  onFormChange,
  nameValidationMessage,
}: Step1DetailsProps) {
  const selectedCategoryInfo = CATEGORIES.find(
    (c) => c.value === formData.category,
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toLowerCase().replace(/\s+/g, "_");
    value = value.replace(/[^a-z0-9_]/g, "");
    if (value.length > 512) {
      value = value.substring(0, 512);
    }
    onFormChange("name", value);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="template-name">Nombre de la Plantilla</Label>
        <Input
          id="template-name"
          placeholder="ejemplo_de_plantilla_123"
          value={formData.name}
          onChange={handleNameChange}
          maxLength={512}
          className={nameValidationMessage ? "border-destructive" : ""}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Solo minúsculas, números y guiones bajos. Máx 512 caracteres. Debe ser
          único.
        </p>
        {nameValidationMessage && (
          <p className="text-sm text-destructive mt-1">
            {nameValidationMessage}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="template-category">Categoría</Label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            onFormChange("category", value as TemplateCategory)
          }
        >
          <SelectTrigger id="template-category">
            <SelectValue placeholder="Seleccionar categoría..." />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCategoryInfo && (
          <Alert variant="default" className="mt-2 bg-muted/30">
            <Info className="h-4 w-4" />
            <AlertTitle className="text-sm font-medium">
              {selectedCategoryInfo.label}
            </AlertTitle>
            <AlertDescription className="text-xs">
              {selectedCategoryInfo.description}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div>
        <Label htmlFor="template-language">Idioma Principal</Label>
        <Select
          value={formData.language}
          onValueChange={(value) => onFormChange("language", value)}
        >
          <SelectTrigger id="template-language">
            <SelectValue placeholder="Seleccionar idioma..." />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {SUPPORTED_LANGUAGES.map((lang: Language) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name} ({lang.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-1">
          Este será el idioma por defecto de tu plantilla. Puedes añadir más
          traducciones después.
        </p>
      </div>

      {/* Parameter Format is not a direct setting in WhatsApp API for template creation. 
          It's inferred from {{n}} (positional) vs {{name}} (named - not standard for WhatsApp).
          WhatsApp primarily uses positional placeholders.
          Keeping it commented out as per spec, but might not be needed for API call.
      <div>
        <Label htmlFor="parameter-format">Formato de Parámetros</Label>
        <Select
          value={formData.parameterFormat}
          onValueChange={(value) => onFormChange("parameterFormat", value)}
        >
          <SelectTrigger id="parameter-format">
            <SelectValue placeholder="Seleccionar formato..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POSITIONAL">Posicional (ej. {{1}}, {{2}})</SelectItem>
            <SelectItem value="NAMED">Nombrado (ej. {{nombre_cliente}}) - No estándar</SelectItem>
          </SelectContent>
        </Select>
         <p className="text-sm text-muted-foreground mt-1">
          WhatsApp recomienda usar el formato posicional para la mayoría de los casos.
        </p>
      </div>
      */}
    </div>
  );
}
