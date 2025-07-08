"use client";

import { useState } from "react";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  Phone,
  Workflow as WorkflowIcon,
  ListChecks,
} from "lucide-react";

// Utilidad para parsear CSV y extraer encabezados
const parseCsv = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/campaigns/parse-csv", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ headers: string[] }>;
};

type Workflow = {
  name: string;
  vapiId: string;
};

type Props = {
  phoneNumberId: string;
  phoneNumberVapiId: string;
  workflows: any[];
};

export default function CreateCampaign({
  phoneNumberId,
  phoneNumberVapiId,
  workflows,
}: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [phoneField, setPhoneField] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    try {
      const { headers } = await parseCsv(selected);
      setHeaders(headers);
      toast.success("CSV procesado. Selecciona la columna de teléfono.");
    } catch (err: any) {
      toast.error(err.message || "Error procesando CSV");
    }
  };

  const ready = file && phoneField && workflowId;

  const handleSubmit = async () => {
    if (!file) return;
    try {
      setSubmitting(true);
      const csvText = await file.text();

      const payload = {
        campaignName: `Campaña ${new Date().toISOString()}`,
        phoneNumberId,
        phoneNumberVapiId,
        workflowId,
        csvData: csvText,
        phoneField,
      };

      console.log("[UI] Payload → /api/campaigns", payload);

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Error creando campaña");
      }

      toast.success("¡Campaña creada con éxito!");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error creando campaña");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm">
          <UploadCloud className="h-4 w-4" /> Iniciar campaña
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gray-50">
          <DialogTitle className="text-xl font-semibold">
            Nueva campaña de llamadas
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* Paso 1: CSV */}
          <Card className="border-dashed border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <CardTitle>Archivo CSV</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input type="file" accept=".csv" onChange={handleFileChange} />
              {file && (
                <span className="text-sm text-green-700">{file.name}</span>
              )}
            </CardContent>
          </Card>

          {/* Paso 2: Columna de teléfono */}
          {headers.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-600" />
                  <CardTitle>Columna de teléfono</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Label className="text-sm">
                  Selecciona la columna que contiene los números
                </Label>
                <Select value={phoneField} onValueChange={setPhoneField}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Columna de teléfono" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Paso 3: Workflow */}
          {headers.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <WorkflowIcon className="h-5 w-5 text-purple-600" />
                  <CardTitle>Workflow</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Label className="text-sm">
                  Selecciona el workflow que ejecutará las llamadas
                </Label>
                <Select value={workflowId} onValueChange={setWorkflowId}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows && workflows.length > 0 ? (
                      workflows.map((w) => (
                        <SelectItem
                          key={w.vapiWorkflowId}
                          value={w.vapiWorkflowId}
                        >
                          {w.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No hay workflows disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
          <span className="text-sm">
            {ready ? "Listo para enviar" : "Completa los pasos"}
          </span>
          <Button
            disabled={!ready || submitting}
            onClick={handleSubmit}
            className="gap-2"
          >
            {submitting ? (
              "Enviando…"
            ) : (
              <>
                <ListChecks className="h-4 w-4" /> Crear campaña
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
