"use client";

import { useState, useEffect, useCallback } from "react";
import type { Node } from "reactflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  MessageSquare,
  Database,
  Plus,
  Info,
  Sparkles,
  FileText,
  Upload,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const FileUploader = dynamic(() => import("../file-uploader"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span className="ml-2 text-sm text-muted-foreground">Cargando...</span>
    </div>
  ),
});

interface AiNodeData {
  name?: string;
  prompt?: string;
  ragEnabled?: boolean;
  knowledgeBaseId?: string;
  extractVariables?: ExtractVariable[];
}

interface ExtractVariable {
  id: string;
  name: string;
  description: string;
}

interface AiNodeConfigProps {
  selectedNode: Node<AiNodeData>;
  updateNode: (nodeId: string, data: any) => void;
  knowledgeBases: any[];
}

export function AiNodeConfig({
  selectedNode,
  updateNode,
  knowledgeBases,
}: AiNodeConfigProps) {
  const [name, setName] = useState(selectedNode.data.name || "Asistente IA");
  const [prompt, setPrompt] = useState(selectedNode.data.prompt || "");
  const [ragEnabled, setRagEnabled] = useState(
    selectedNode.data.ragEnabled || false,
  );
  const [knowledgeBaseId, setKnowledgeBaseId] = useState(
    selectedNode.data.knowledgeBaseId || "",
  );
  const [extractVariables, setExtractVariables] = useState<ExtractVariable[]>(
    selectedNode.data.extractVariables || [],
  );
  const [kbList, setKbList] = useState<any[]>(knowledgeBases || []);
  const [isLoading, setIsLoading] = useState(false);

  const fetchKbs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/knowledge-bases");
      if (res.ok) {
        const json = await res.json();
        console.log("[AiNodeConfig] KBs fetched", json);
        setKbList(json);
      }
    } catch (err) {
      console.error("[AiNodeConfig] Error fetching KBs", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKbs();
  }, [fetchKbs]);

  const handleUpdateNodeData = (newData: Partial<AiNodeData>) => {
    const invalidVariable = extractVariables.find(
      (v) => !v.name || !v.description,
    );
    if (invalidVariable) {
      toast.error(
        "Todas las variables a extraer deben tener un nombre y una descripción.",
      );
      return;
    }

    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        ...newData,
        extractVariables: extractVariables,
      },
    });
    toast.success("Configuración del nodo AI guardada.");
  };

  const addVariable = () => {
    setExtractVariables([
      ...extractVariables,
      {
        id: Math.random().toString(36).substring(7),
        name: "",
        description: "",
      },
    ]);
  };

  const updateVariable = (
    id: string,
    field: "name" | "description",
    value: string,
  ) => {
    setExtractVariables(
      extractVariables.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

  const removeVariable = (id: string) => {
    setExtractVariables(extractVariables.filter((v) => v.id !== id));
  };

  const onBlurSave = () => {
    handleUpdateNodeData({
      name,
      prompt,
      ragEnabled,
      knowledgeBaseId,
      extractVariables,
    });
  };

  const selectedKb = kbList.find((kb) => kb.id === knowledgeBaseId);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configuración del Nodo IA</h3>
          <p className="text-sm text-muted-foreground">
            Personaliza el comportamiento de tu asistente inteligente
          </p>
        </div>
      </div>

      <Separator />

      {/* Basic Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-4 h-4" />
            Configuración Básica
          </CardTitle>
          <CardDescription>
            Define el nombre y comportamiento principal del asistente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-node-name" className="text-sm font-medium">
              Nombre del Asistente
            </Label>
            <Input
              id="ai-node-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={onBlurSave}
              placeholder="Ej: Asistente de Ventas, Soporte Técnico..."
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-node-prompt" className="text-sm font-medium">
              Instrucciones del Sistema (Prompt)
            </Label>
            <Textarea
              id="ai-node-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onBlur={onBlurSave}
              placeholder="Describe cómo debe comportarse el asistente, su personalidad, conocimientos específicos..."
              className="min-h-[100px] transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              rows={4}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              Las instrucciones claras mejoran significativamente las respuestas
              del asistente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            Base de Conocimiento
            {ragEnabled && (
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                Activa
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Conecta una base de conocimiento para respuestas más precisas y
            contextuales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Switch
                id="ai-node-rag-enabled"
                checked={ragEnabled}
                onCheckedChange={(value) => {
                  setRagEnabled(value);
                  handleUpdateNodeData({ ragEnabled: value });
                }}
              />
              <div>
                <Label
                  htmlFor="ai-node-rag-enabled"
                  className="text-sm font-medium cursor-pointer"
                >
                  Habilitar Base de Conocimiento
                </Label>
                <p className="text-xs text-muted-foreground">
                  Permite al asistente acceder a información específica de tu
                  negocio
                </p>
              </div>
            </div>
          </div>

          {ragEnabled && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Seleccionar Base de Conocimiento
                </Label>
                <Select
                  value={knowledgeBaseId}
                  onValueChange={(value) => {
                    setKnowledgeBaseId(value);
                    handleUpdateNodeData({ knowledgeBaseId: value });
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Selecciona una base de conocimiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {kbList && kbList.length > 0 ? (
                      kbList.map((kb: any) => (
                        <SelectItem
                          key={kb.id}
                          value={kb.id}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>{kb.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-kbs" disabled>
                        No hay bases de conocimiento disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedKb && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Database className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Base de conocimiento seleccionada:
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    {selectedKb.name}
                  </p>
                </div>
              )}

              <Dialog
                onOpenChange={(open) => {
                  if (!open) {
                    fetchKbs();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full transition-all duration-200 hover:bg-primary/5 bg-transparent"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Nueva Base de Conocimiento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Crear Base de Conocimiento
                    </DialogTitle>
                    <DialogDescription>
                      Sube documentos, PDFs o archivos de texto para crear una
                      base de conocimiento que mejorará las respuestas de tu
                      asistente IA.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <Tabs defaultValue="pdf" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                          value="pdf"
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Subir Archivos
                        </TabsTrigger>
                        <TabsTrigger
                          value="form"
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Formulario
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="pdf" className="mt-4">
                        <FileUploader onUploaded={() => fetchKbs()} />
                      </TabsContent>
                      <TabsContent value="form" className="mt-4">
                        <div className="flex items-center justify-center p-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                          <div className="text-center">
                            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">
                              Próximamente
                            </p>
                            <p className="text-sm text-muted-foreground/75">
                              Podrás crear bases de conocimiento mediante
                              formularios
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extract Variables */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            Extracción de Variables
          </CardTitle>
          <CardDescription>
            Define qué datos debe extraer el asistente de la conversación y
            guardarlos para su uso posterior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={addVariable}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Añadir Variable a Extraer
          </Button>
          <div className="space-y-3">
            {extractVariables.map((variable) => (
              <div
                key={variable.id}
                className="grid grid-cols-[1fr_1.5fr_auto] gap-3 items-end p-3 border rounded-lg bg-muted/20 animate-in fade-in-30"
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`var-name-${variable.id}`}
                    className="text-xs"
                  >
                    Nombre Variable
                  </Label>
                  <Input
                    id={`var-name-${variable.id}`}
                    placeholder="ej: nombre_completo"
                    value={variable.name}
                    onChange={(e) =>
                      updateVariable(variable.id, "name", e.target.value)
                    }
                    onBlur={onBlurSave}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`var-desc-${variable.id}`}
                    className="text-xs"
                  >
                    Descripción para la IA
                  </Label>
                  <Input
                    id={`var-desc-${variable.id}`}
                    placeholder="ej: Nombre y apellido del usuario"
                    value={variable.description}
                    onChange={(e) =>
                      updateVariable(variable.id, "description", e.target.value)
                    }
                    onBlur={onBlurSave}
                  />
                </div>
                <Button
                  onClick={() => removeVariable(variable.id)}
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Estado del Nodo</span>
            </div>
            <Badge variant="outline" className="bg-background">
              {ragEnabled ? "Con Base de Conocimiento" : "Configuración Básica"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {ragEnabled && selectedKb
              ? `Asistente configurado con acceso a "${selectedKb.name}"`
              : "Asistente configurado con instrucciones básicas"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
