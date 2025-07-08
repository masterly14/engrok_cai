"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCcw,
  Check,
  AlertCircle,
  FileText,
  ChevronDown,
  Lightbulb,
  Copy,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface JsonTemplate {
  name: string;
  description: string;
  content: object;
}

export const parseJsonSafely = (
  jsonString: string | object,
  fallback: object = {},
) => {
  try {
    return typeof jsonString === "string"
      ? JSON.parse(jsonString)
      : jsonString || fallback;
  } catch {
    return fallback;
  }
};

export const stringifyJsonSafely = (obj: any) => {
  try {
    return JSON.stringify(obj);
  } catch {
    return "{}";
  }
};

const commonTemplates: JsonTemplate[] = [
  {
    name: "Headers básicos",
    description: "Headers comunes para APIs",
    content: {
      "Content-Type": "application/json",
      Authorization: "Bearer {{token}}",
    },
  },
  {
    name: "Body de usuario",
    description: "Datos básicos de usuario",
    content: {
      name: "{{user.name}}",
      email: "{{user.email}}",
      id: "{{user.id}}",
    },
  },
  {
    name: "Parámetros de consulta",
    description: "Estructura para query parameters",
    content: {
      page: 1,
      limit: 10,
      search: "{{query}}",
    },
  },
  {
    name: "Respuesta de error",
    description: "Estructura típica de error",
    content: {
      error: true,
      message: "{{error.message}}",
      code: "{{error.code}}",
    },
  },
];

export function JsonEditorField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 8,
  description,
  disabled = false,
}: {
  id: string;
  label: string;
  value: object | string | undefined;
  onChange: (value: object | undefined) => void;
  placeholder?: string;
  rows?: number;
  description?: string;
  disabled?: boolean;
}) {
  const [internalValue, setInternalValue] = useState("");
  const [isValidJson, setIsValidJson] = useState(true);
  const [wasFormatted, setWasFormatted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const formatted =
        typeof value === "object"
          ? JSON.stringify(value, null, 2)
          : value || "";
      setInternalValue(formatted);
      setIsValidJson(true);
      setValidationError("");
    } catch {
      setInternalValue(String(value || ""));
    }
  }, [value]);

  const validateJson = useCallback((text: string) => {
    if (text.trim() === "") {
      setIsValidJson(true);
      setValidationError("");
      return true;
    }

    // Reemplaza variables con placeholders válidos
    const tempText = text.replace(/{{\s*[\w.]+\s*}}/g, '"__PLACEHOLDER__"');

    try {
      JSON.parse(tempText);
      setIsValidJson(true);
      setValidationError("");
      return true;
    } catch (error) {
      setIsValidJson(false);
      setValidationError(
        error instanceof Error ? error.message : "JSON inválido",
      );
      return false;
    }
  }, []);

  const handleChange = (text: string) => {
    setInternalValue(text);
    setIsTyping(true);

    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Validar después de que el usuario deje de escribir
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const isValid = validateJson(text);

      if (isValid) {
        try {
          if (text.trim() === "") {
            onChange(undefined);
            return;
          }

          const tempText = text.replace(
            /{{\s*[\w.]+\s*}}/g,
            '"__PLACEHOLDER__"',
          );
          const parsed = JSON.parse(tempText);

          // Restaurar variables en el objeto parseado
          const jsonString = JSON.stringify(parsed);
          let i = 0;
          const matches = [...text.matchAll(/{{\s*[\w.]+\s*}}/g)];
          const restoredString = jsonString.replace(
            /"__PLACEHOLDER__"/g,
            () => {
              const match = matches[i++];
              return match ? `"${match[0]}"` : '"__PLACEHOLDER__"';
            },
          );

          onChange(JSON.parse(restoredString));
        } catch {
          // Si falla la restauración, usar el objeto parseado simple
          const tempText = text.replace(
            /{{\s*[\w.]+\s*}}/g,
            '"__PLACEHOLDER__"',
          );
          try {
            const parsed = JSON.parse(tempText);
            onChange(parsed);
          } catch {
            // No hacer nada si no se puede parsear
          }
        }
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir
  };

  const formatJson = () => {
    try {
      const tempText = internalValue.replace(
        /{{\s*[\w.]+\s*}}/g,
        '"__PLACEHOLDER__"',
      );
      const parsed = JSON.parse(tempText);
      const formatted = JSON.stringify(parsed, null, 2);

      // Restaurar variables originales
      let i = 0;
      const matches = [...internalValue.matchAll(/{{\s*[\w.]+\s*}}/g)];
      const restored = formatted.replace(
        /"__PLACEHOLDER__"/g,
        () => matches[i++]?.[0] || '"__PLACEHOLDER__"',
      );

      setInternalValue(restored);
      setIsValidJson(true);
      setValidationError("");
      setWasFormatted(true);
      setTimeout(() => setWasFormatted(false), 1500);
      toast.success("JSON formateado correctamente");
    } catch (error) {
      toast.error("No se pudo formatear: JSON inválido");
    }
  };

  const insertTemplate = (template: JsonTemplate) => {
    const formattedContent = JSON.stringify(template.content, null, 2);
    setInternalValue(formattedContent);
    handleChange(formattedContent);
    toast.success(`Plantilla "${template.name}" insertada`);
  };

  const clearContent = () => {
    setInternalValue("");
    onChange(undefined);
    setIsValidJson(true);
    setValidationError("");
    toast.success("Contenido limpiado");
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(internalValue);
      toast.success("Contenido copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el contenido");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;

    // Auto-completar llaves y corchetes
    if (e.key === "{") {
      e.preventDefault();
      const before = internalValue.substring(0, selectionStart);
      const after = internalValue.substring(selectionEnd);
      const newValue = before + "{}" + after;
      setInternalValue(newValue);
      handleChange(newValue);

      // Posicionar cursor entre las llaves
      setTimeout(() => {
        textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
      }, 0);
    } else if (e.key === "[") {
      e.preventDefault();
      const before = internalValue.substring(0, selectionStart);
      const after = internalValue.substring(selectionEnd);
      const newValue = before + "[]" + after;
      setInternalValue(newValue);
      handleChange(newValue);

      setTimeout(() => {
        textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
      }, 0);
    } else if (e.key === '"') {
      e.preventDefault();
      const before = internalValue.substring(0, selectionStart);
      const after = internalValue.substring(selectionEnd);
      const newValue = before + '""' + after;
      setInternalValue(newValue);
      handleChange(newValue);

      setTimeout(() => {
        textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
      }, 0);
    }
    // Formatear con Ctrl+Shift+F
    else if (e.ctrlKey && e.shiftKey && e.key === "F") {
      e.preventDefault();
      formatJson();
    }
    // Insertar variable con Ctrl+Shift+V
    else if (e.ctrlKey && e.shiftKey && e.key === "V") {
      e.preventDefault();
      const before = internalValue.substring(0, selectionStart);
      const after = internalValue.substring(selectionEnd);
      const newValue = before + "{{variable}}" + after;
      setInternalValue(newValue);
      handleChange(newValue);

      setTimeout(() => {
        textarea.setSelectionRange(selectionStart + 2, selectionStart + 10); // Seleccionar "variable"
      }, 0);
    }
  };

  const getStatusColor = () => {
    if (isTyping) return "border-yellow-300";
    if (!isValidJson) return "border-red-500";
    return "border-gray-300 focus:border-blue-500";
  };

  const getStatusIcon = () => {
    if (isTyping)
      return (
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
      );
    if (!isValidJson) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isValidJson && internalValue.trim())
      return <Check className="w-4 h-4 text-green-500" />;
    return null;
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor={id} className="font-medium text-sm text-gray-700">
              {label}
            </Label>
            {getStatusIcon()}
          </div>

          <div className="flex gap-1">
            {/* Plantillas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  className="h-8 px-2"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Plantillas
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {commonTemplates.map((template) => (
                  <DropdownMenuItem
                    key={template.name}
                    onClick={() => insertTemplate(template)}
                    className="flex flex-col items-start p-3"
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {template.description}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Copiar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={copyContent}
                  disabled={disabled || !internalValue.trim()}
                  className="h-8 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Copiar contenido</TooltipContent>
            </Tooltip>

            {/* Limpiar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={clearContent}
                  disabled={disabled || !internalValue.trim()}
                  className="h-8 px-2"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Limpiar contenido</TooltipContent>
            </Tooltip>

            {/* Formatear */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={formatJson}
                  disabled={disabled || !internalValue.trim()}
                  className="h-8 px-2"
                >
                  {wasFormatted ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <RefreshCcw className="w-3 h-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Formatear JSON (Ctrl+Shift+F)
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="relative">
          <Textarea
            ref={textareaRef}
            id={id}
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              placeholder ||
              'Ej: {\n  "nombre": "{{user.name}}",\n  "email": "{{user.email}}"\n}'
            }
            rows={rows}
            className={`font-mono text-xs transition-all resize-none ${getStatusColor()} focus:ring-blue-500/30`}
            disabled={disabled}
          />

          {/* Indicador de estado en la esquina */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {isTyping && (
              <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                Escribiendo...
              </div>
            )}
          </div>
        </div>

        {/* Mensajes de estado */}
        {!isValidJson && validationError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-red-700">JSON inválido</p>
              <p className="text-xs text-red-600 mt-1">{validationError}</p>
            </div>
          </div>
        )}

        {/* Ayuda y descripción */}
        <div className="space-y-2">
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}

          <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <Lightbulb className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Consejos:</p>
              <ul className="space-y-0.5 text-blue-600">
                <li>
                  • Usa{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    {"{{variable}}"}
                  </code>{" "}
                  para variables dinámicas
                </li>
                <li>
                  •{" "}
                  <kbd className="bg-blue-100 px-1 rounded text-xs">
                    Ctrl+Shift+F
                  </kbd>{" "}
                  para formatear
                </li>
                <li>
                  •{" "}
                  <kbd className="bg-blue-100 px-1 rounded text-xs">
                    Ctrl+Shift+V
                  </kbd>{" "}
                  para insertar variable
                </li>
                <li>
                  • Las llaves, corchetes y comillas se completan
                  automáticamente
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
