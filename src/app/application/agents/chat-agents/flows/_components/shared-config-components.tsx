"use client";

import { useEffect } from "react";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  PlusCircle,
  Check,
  RefreshCcw,
  GripVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EmojiPickerInput } from "../../_components/emoji-picker-input";

interface InteractiveButton {
  id: string;
  type: "reply" | "url" | "call";
  title: string;
  payload?: string; // for reply
  url?: string; // for url
  phoneNumber?: string; // for call
}

interface InteractiveButtonsConfigProps {
  buttons: InteractiveButton[];
  onChange: (buttons: InteractiveButton[]) => void;
}

export function InteractiveButtonsConfig({
  buttons = [],
  onChange,
}: InteractiveButtonsConfigProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAddButton = () => {
    const newButton: InteractiveButton = {
      id: uuidv4(),
      type: "reply",
      title: "New Button",
      payload: "PAYLOAD",
    };
    onChange([...buttons, newButton]);
  };

  const handleRemoveButton = (id: string) => {
    onChange(buttons.filter((btn) => btn.id !== id));
  };

  const handleButtonChange = (
    id: string,
    field: keyof InteractiveButton,
    value: string,
  ) => {
    onChange(
      buttons.map((btn) => (btn.id === id ? { ...btn, [field]: value } : btn)),
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = buttons.findIndex((b) => b.id === active.id);
      const newIndex = buttons.findIndex((b) => b.id === over.id);
      onChange(arrayMove(buttons, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      <Label>Interactive Buttons</Label>
      <div className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={buttons}
            strategy={verticalListSortingStrategy}
          >
            {buttons.map((button) => (
              <SortableButton
                key={button.id}
                button={button}
                onTitleChange={(id, title) =>
                  handleButtonChange(id, "title", title)
                }
                onRemove={handleRemoveButton}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <Button
        variant="outline"
        onClick={handleAddButton}
        className="w-full text-sm"
      >
        <PlusCircle className="h-4 w-4 mr-2" /> Add Button (Max 3)
      </Button>
      <p className="text-xs text-gray-500">
        WhatsApp allows up to 3 interactive buttons.
      </p>
    </div>
  );
}

function SortableButton({
  button,
  onTitleChange,
  onRemove,
}: {
  button: InteractiveButton;
  onTitleChange: (id: string, title: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: button.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-lg bg-background"
    >
      <div {...attributes} {...listeners} className="cursor-grab p-1">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <EmojiPickerInput
        value={button.title}
        onChange={(value: string) => onTitleChange(button.id, value)}
        placeholder="Título del botón"
        className="flex-grow"
        as="textarea"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(button.id)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Generic field component for reuse
interface ConfigFieldProps {
  id: string;
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  type?: "text" | "number" | "url";
  placeholder?: string;
  as?: "input" | "textarea";
  rows?: number;
  description?: string;
  disabled?: boolean;
}

export function ConfigField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  as = "input",
  rows = 3,
  description,
  disabled = false,
}: ConfigFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="font-medium text-gray-700">
        {label}
      </Label>
      {as === "input" ? (
        <Input
          id={id}
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/30 max-w-xs"
          disabled={disabled}
        />
      ) : (
        <Textarea
          id={id}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/30 max-w-xs"
          disabled={disabled}
        />
      )}
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
}

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

  useEffect(() => {
    try {
      const formatted =
        typeof value === "object"
          ? JSON.stringify(value, null, 2)
          : value || "";
      setInternalValue(formatted);
    } catch {
      setInternalValue(String(value || ""));
    }
  }, [value]);

  const handleChange = (text: string) => {
    setInternalValue(text);

    const tempText = text.replace(/{{\s*[\w.]+\s*}}/g, '"__PLACEHOLDER__"'); // Reemplaza {{nombre}} por string válido

    try {
      if (text.trim() === "") {
        onChange(undefined);
        setIsValidJson(true);
        return;
      }

      const parsed = JSON.parse(tempText); // Intentamos parsear con los placeholders
      onChange(parsed); // Retornamos el texto original, no el modificado
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  };

  const formatJson = () => {
    try {
      const tempText = internalValue.replace(
        /{{\s*[\w.]+\s*}}/g,
        '"__PLACEHOLDER__"',
      );
      const parsed = JSON.parse(tempText);

      const formatted = JSON.stringify(parsed, null, 2);

      // Restauramos las variables originales en el string formateado
      let i = 0;
      const matches = [...internalValue.matchAll(/{{\s*[\w.]+\s*}}/g)];
      const restored = formatted.replace(
        /"__PLACEHOLDER__"/g,
        () => matches[i++]?.[0] || '"__PLACEHOLDER__"',
      );

      setInternalValue(restored);
      setIsValidJson(true);
      setWasFormatted(true);
      setTimeout(() => setWasFormatted(false), 1500);
    } catch {
      setIsValidJson(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className="font-medium text-sm text-gray-700">
          {label}
        </Label>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={formatJson}
                disabled={disabled}
              >
                {wasFormatted ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <RefreshCcw className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Formatear JSON automáticamente
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Textarea
        id={id}
        value={internalValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder || 'Ej: { "nombre": "Juan" }'}
        rows={rows}
        className={`font-mono text-xs border transition-all ${
          isValidJson
            ? "border-gray-300 focus:border-blue-500 focus:ring-blue-500/30"
            : "border-red-500 focus:ring-red-500/30"
        }`}
        disabled={disabled}
      />

      {!isValidJson && (
        <p className="text-xs text-red-500">
          El contenido no es un JSON válido.
        </p>
      )}
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
}
