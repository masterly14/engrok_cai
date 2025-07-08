"use client";

import useSWR from "swr";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Play,
  Pause,
  Plus,
  Mic,
  Settings,
  Eye,
  Phone,
  Bot,
  X,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";

interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
  description?: string;
  labels: {
    gender?: string;
    age?: string;
    accent?: string;
    [key: string]: string | undefined;
  };
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export default function VoiceWidgetsPage() {
  const { data: voicesData } = useSWR<{ voices: Voice[] }>(
    "/api/elevenlabs/voices",
    fetcher,
  );
  const { data: widgetsData, mutate } = useSWR<{ widgets: any[] }>(
    "/api/elevenlabs/widgets",
    fetcher,
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    firstMessage: "",
    systemPrompt: "",
    voiceId: "",
    actionText: "",
    startCallText: "",
    listeningText: "",
    speakingText: "",
    endCallText: "",
  });
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedWidgetForPreview, setSelectedWidgetForPreview] = useState<
    string | null
  >(null);
  const [copiedWidget, setCopiedWidget] = useState<string | null>(null);

  const safeVoices: Voice[] = Array.isArray(voicesData?.voices)
    ? voicesData.voices
    : [];
  const selectedVoice = safeVoices.find((v) => v.voice_id === form.voiceId);

  const handleCreate = async () => {
    const res = await fetch("/api/elevenlabs/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setOpen(false);
      setForm({
        name: "",
        firstMessage: "",
        systemPrompt: "",
        voiceId: "",
        actionText: "",
        startCallText: "",
        listeningText: "",
        speakingText: "",
        endCallText: "",
      });
      mutate();
    } else {
      alert("Error al crear widget");
    }
  };

  const handleVoicePreview = async (voiceId: string, previewUrl?: string) => {
    if (!previewUrl) return;

    if (playingVoice === voiceId) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingVoice(null);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    setPlayingVoice(voiceId);

    audio.onended = () => setPlayingVoice(null);
    audio.onerror = () => setPlayingVoice(null);

    try {
      await audio.play();
    } catch (err) {
      console.error("Error playing preview", err);
      setPlayingVoice(null);
    }
  };

  const handleCopyEmbedCode = async (widgetId: string) => {
    const embedCode = `<iframe
  src="data:text/html;charset=utf-8,%3C!DOCTYPE%20html%3E%3Chtml%3E%3Chead%3E%3Cstyle%3Ebody%7Bmargin%3A0%3Bpadding%3A0%3Bheight%3A100vh%3Boverflow%3Ahidden%7D%3C%2Fstyle%3E%3C%2Fhead%3E%3Cbody%3E%3Celevenlabs-convai%20agent-id%3D%22${widgetId}%22%3E%3C%2Felevenlabs-convai%3E%3Cscript%20src%3D%22https%3A%2F%2Funpkg.com%2F%40elevenlabs%2Fconvai-widget-embed%22%20async%20type%3D%22text%2Fjavascript%22%3E%3C%2Fscript%3E%3C%2Fbody%3E%3C%2Fhtml%3E"
  width="100%"
  height="600"
  frameborder="0"
  title="Voice Widget">
</iframe>`;

    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedWidget(widgetId);
      setTimeout(() => setCopiedWidget(null), 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Widgets de Voz
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crea y gestiona widgets de conversación con IA para integrar en tu
            sitio web
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex justify-center">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 shadow-lg">
                <Plus className="h-5 w-5" />
                Crear Nuevo Widget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Bot className="h-6 w-6 text-primary" />
                  Crear Nuevo Widget
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Información Básica
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Nombre del Widget
                      </label>
                      <Input
                        placeholder="Ej: Asistente de Ventas"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Primer Mensaje
                      </label>
                      <Input
                        placeholder="¡Hola! ¿En qué puedo ayudarte hoy?"
                        value={form.firstMessage}
                        onChange={(e) =>
                          setForm({ ...form, firstMessage: e.target.value })
                        }
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Prompt del Sistema
                      </label>
                      <Textarea
                        rows={4}
                        placeholder="Eres un asistente útil que ayuda a los usuarios con..."
                        value={form.systemPrompt}
                        onChange={(e) =>
                          setForm({ ...form, systemPrompt: e.target.value })
                        }
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Voice Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Selección de Voz
                  </h3>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Voz del Asistente
                    </label>
                    <Select
                      value={form.voiceId}
                      onValueChange={(v) => setForm({ ...form, voiceId: v })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecciona una voz" />
                      </SelectTrigger>
                      <SelectContent className="h-60 overflow-y-auto">
                        {safeVoices.length === 0 && (
                          <div className="p-4 text-center text-muted-foreground">
                            No hay voces disponibles
                          </div>
                        )}
                        {safeVoices.map((v) => (
                          <SelectItem key={v.voice_id} value={v.voice_id}>
                            <div className="flex items-center gap-2">
                              <span>{v.name}</span>
                              {v.labels?.gender && (
                                <Badge variant="outline" className="text-xs">
                                  {v.labels.gender}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Voice Preview */}
                  {selectedVoice && (
                    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <h4 className="font-semibold text-base flex items-center gap-2">
                              <Mic className="h-4 w-4" />
                              {selectedVoice.name}
                            </h4>
                            {selectedVoice.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {selectedVoice.description}
                              </p>
                            )}
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {selectedVoice.labels &&
                                Object.entries(selectedVoice.labels)
                                  .filter(([, value]) => value)
                                  .map(([key, value]) => (
                                    <Badge
                                      key={key}
                                      variant="secondary"
                                      className="text-xs capitalize"
                                    >
                                      {key}: {value}
                                    </Badge>
                                  ))}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleVoicePreview(
                                selectedVoice.voice_id,
                                selectedVoice.preview_url,
                              )
                            }
                            className="shrink-0 gap-2"
                          >
                            {playingVoice === selectedVoice.voice_id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            {playingVoice === selectedVoice.voice_id
                              ? "Pausar"
                              : "Escuchar"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Advanced Settings */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex justify-between px-0 h-auto"
                    >
                      <span className="text-lg font-semibold">
                        Personalización Avanzada
                      </span>
                      <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="grid gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Texto del Botón (CTA)
                        </label>
                        <Input
                          placeholder="¡Habla conmigo!"
                          value={form.actionText}
                          onChange={(e) =>
                            setForm({ ...form, actionText: e.target.value })
                          }
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Texto "Iniciando llamada"
                        </label>
                        <Input
                          placeholder="Conectando..."
                          value={form.startCallText}
                          onChange={(e) =>
                            setForm({ ...form, startCallText: e.target.value })
                          }
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Texto "Escuchando"
                        </label>
                        <Input
                          placeholder="Te escucho..."
                          value={form.listeningText}
                          onChange={(e) =>
                            setForm({ ...form, listeningText: e.target.value })
                          }
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Texto "Hablando"
                        </label>
                        <Input
                          placeholder="Hablando..."
                          value={form.speakingText}
                          onChange={(e) =>
                            setForm({ ...form, speakingText: e.target.value })
                          }
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Texto "Fin de llamada"
                        </label>
                        <Input
                          placeholder="¡Hasta pronto!"
                          value={form.endCallText}
                          onChange={(e) =>
                            setForm({ ...form, endCallText: e.target.value })
                          }
                          className="h-11"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Button
                  className="w-full h-12 text-base gap-2"
                  onClick={handleCreate}
                  disabled={!form.name || !form.systemPrompt}
                >
                  <Plus className="h-5 w-5" />
                  Crear Widget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Widgets Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Tus Widgets</h2>

          {widgetsData?.widgets && widgetsData.widgets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {widgetsData.widgets.map((widget) => (
                <Card
                  key={widget.id}
                  className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {widget.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            ID: {widget.agentId}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Eye className="h-3 w-3" />
                        Activo
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {widget.systemPrompt}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 bg-transparent"
                      >
                        <Settings className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant={
                          selectedWidgetForPreview === widget.agentId
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="flex-1 gap-2 bg-transparent"
                        onClick={() =>
                          setSelectedWidgetForPreview(widget.agentId)
                        }
                      >
                        <Eye className="h-4 w-4" />
                        {selectedWidgetForPreview === widget.agentId
                          ? "Previsualizando"
                          : "Previsualizar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyEmbedCode(widget.agentId)}
                        className="gap-2 bg-transparent"
                      >
                        {copiedWidget === widget.agentId ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Bot className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      No tienes widgets aún
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Crea tu primer widget de voz para comenzar
                    </p>
                    <Button onClick={() => setOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Crear mi primer widget
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Widget Preview Section */}
        {(selectedWidgetForPreview ||
          (typeof window !== "undefined" &&
            process.env.NEXT_PUBLIC_ELEVENLABS_REFERENCE_WIDGET_ID)) && (
          <div className="space-y-6">
            <Separator />
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Vista Previa del Widget
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedWidgetForPreview
                      ? `Previsualizando: ${widgetsData?.widgets.find((w) => w.agentId === selectedWidgetForPreview)?.name || "Widget seleccionado"}`
                      : "Widget por defecto desde configuración"}
                  </p>
                </div>
                {selectedWidgetForPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWidgetForPreview(null)}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Usar widget por defecto
                  </Button>
                )}
              </div>
            </div>
            <WidgetPreview
              id={
                selectedWidgetForPreview ||
                process.env.NEXT_PUBLIC_ELEVENLABS_REFERENCE_WIDGET_ID!
              }
              isCustomSelected={!!selectedWidgetForPreview}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface PreviewProps {
  id: string;
  isCustomSelected?: boolean;
}

function WidgetPreview({ id, isCustomSelected = false }: PreviewProps) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) setShow(true);
  }, [id]);

  if (!show) return null;

  const embedCode = `<iframe
  src="data:text/html;charset=utf-8,%3C!DOCTYPE%20html%3E%3Chtml%3E%3Chead%3E%3Cstyle%3Ebody%7Bmargin%3A0%3Bpadding%3A0%3Bheight%3A100vh%3Boverflow%3Ahidden%7D%3C%2Fstyle%3E%3C%2Fhead%3E%3Cbody%3E%3Celevenlabs-convai%20agent-id%3D%22${id}%22%3E%3C%2Felevenlabs-convai%3E%3Cscript%20src%3D%22https%3A%2F%2Funpkg.com%2F%40elevenlabs%2Fconvai-widget-embed%22%20async%20type%3D%22text%2Fjavascript%22%3E%3C%2Fscript%3E%3C%2Fbody%3E%3C%2Fhtml%3E"
  width="100%"
  height="600"
  frameborder="0"
  title="Voice Widget">
</iframe>`;

  const scriptCode = `<elevenlabs-convai agent-id="${id}"></elevenlabs-convai>
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>`;

  const handleCopy = async (code: string, type: "iframe" | "script") => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .demo-content {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
          }
          .demo-content h1 {
            color: #333;
            margin-bottom: 16px;
          }
          .demo-content p {
            color: #666;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="demo-content">
          <h1>¡Bienvenido a nuestro sitio!</h1>
          <p>Este es un ejemplo de cómo se verá tu widget de voz integrado en tu página web. El widget aparecerá en la esquina inferior derecha y permitirá a tus visitantes interactuar por voz.</p>
        </div>
        <elevenlabs-convai agent-id="${id}"></elevenlabs-convai>
        <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
      </body>
    </html>
  `;

  return (
    <div className="space-y-6">
      {/* Preview */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {isCustomSelected
              ? "Widget Personalizado - Demostración"
              : "Demostración Interactiva"}
          </CardTitle>
          <CardDescription>
            {isCustomSelected
              ? "Previsualizando tu widget personalizado - El widget aparece en la esquina inferior derecha"
              : "El widget aparece en la esquina inferior derecha de la página"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <iframe
            title="Widget preview"
            srcDoc={srcDoc}
            className="w-full h-[600px] border-0 rounded-b-lg"
          />
        </CardContent>
      </Card>

      {/* Embed Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Código de Integración
          </CardTitle>
          <CardDescription>
            Copia y pega este código en tu sitio web para integrar el widget
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Script Integration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                Integración Directa (Recomendado)
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(scriptCode, "script")}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-all">
                <code>{scriptCode}</code>
              </pre>
            </div>
            <p className="text-sm text-muted-foreground">
              Pega este código antes del cierre de la etiqueta {"</body>"} en tu
              HTML. El widget aparecerá automáticamente en la esquina inferior
              derecha.
            </p>
          </div>

          <Separator />

          {/* Iframe Integration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Integración con Iframe</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(embedCode, "iframe")}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-all">
                <code>{embedCode}</code>
              </pre>
            </div>
            <p className="text-sm text-muted-foreground">
              Usa este iframe si prefieres tener más control sobre la posición
              del widget en tu página.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
