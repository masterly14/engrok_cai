"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createVoiceTrigger } from "@/actions/voiceTriggers"; // Asegúrate de que la ruta sea correcta
import { Loader2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreateTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
}

export function CreateTriggerModal({
  isOpen,
  onClose,
  workflowId,
}: CreateTriggerModalProps) {
  const [provider, setProvider] = useState("");
  const [phoneMapping, setPhoneMapping] = useState("");
  const [nameMapping, setNameMapping] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleCreateTrigger = async () => {
    if (!provider.trim() || !phoneMapping.trim()) {
      toast.error(
        "Por favor, completa el nombre del proveedor y el mapeo del teléfono.",
      );
      return;
    }

    setIsCreating(true);
    try {
      const mapping = {
        phone: phoneMapping,
        vars: {
          ...(nameMapping.trim() && { name: nameMapping.trim() }),
        },
      };

      const result = await createVoiceTrigger(workflowId, provider, mapping);

      if (result.status === 201 && result.trigger?.token) {
        const url = `${window.location.origin}/api/voice/trigger/${result.trigger.token}`;
        setGeneratedUrl(url);
        toast.success("¡Trigger creado con éxito!");
      } else {
        throw new Error("No se pudo crear el trigger.");
      }
    } catch (error) {
      console.error("Error creating trigger:", error);
      toast.error("Hubo un error al crear el trigger.");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      toast.success("¡URL copiada al portapapeles!");
    }
  };

  const resetAndClose = () => {
    setProvider("");
    setPhoneMapping("");
    setNameMapping("");
    setGeneratedUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear un Nuevo Trigger (Webhook)</DialogTitle>
          <DialogDescription>
            Genera una URL única para iniciar este workflow desde un servicio
            externo.
          </DialogDescription>
        </DialogHeader>

        {generatedUrl ? (
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Usa la siguiente URL en tu servicio externo (ej. Zapier, HubSpot)
              para disparar este workflow.
            </p>
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={generatedUrl}
                className="flex-1 bg-gray-100"
              />
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Badge variant="destructive">
              Guarda esta URL en un lugar seguro. No podrás verla de nuevo.
            </Badge>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Nombre del Proveedor</Label>
              <Input
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="Ej: HubSpot, Zapier, Formulario Web"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone-mapping">Mapeo del Teléfono</Label>
              <Input
                id="phone-mapping"
                value={phoneMapping}
                onChange={(e) => setPhoneMapping(e.target.value)}
                placeholder="Ej: contact.phone o data.telefono"
              />
              <p className="text-xs text-gray-500">
                La ruta en el JSON del webhook donde se encuentra el número de
                teléfono.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name-mapping">Mapeo del Nombre (Opcional)</Label>
              <Input
                id="name-mapping"
                value={nameMapping}
                onChange={(e) => setNameMapping(e.target.value)}
                placeholder="Ej: contact.name o data.nombre_completo"
              />
              <p className="text-xs text-gray-500">
                La ruta para la variable `name`, que puedes usar en tus prompts.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            {generatedUrl ? "Cerrar" : "Cancelar"}
          </Button>
          {!generatedUrl && (
            <Button onClick={handleCreateTrigger} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Generar URL del Webhook"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
