"use client"

import type React from "react"
import { MousePointer } from "lucide-react"

import { useState, useRef, useEffect, useMemo } from "react"
import type { Node } from "reactflow"
import { InteractiveButtonsConfig } from "../shared-config-components"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  UploadCloud,
  Mic,
  StopCircle,
  Loader2,
  CheckCircle,
  MessageSquare,
  Settings,
  FileAudio,
  ImageIcon,
  ChevronRight,
  AlertCircle,
  Info,
} from "lucide-react"

import { getCloudinarySignature, uploadAudioAction, uploadFile, deleteCloudinaryFile } from "@/actions/upload-audio"
import { useAssets } from "@/hooks/use-assets"
import { saveUserAsset } from "@/actions/chat-agents"
import { toast } from "sonner"
import { updateChatWorkflowMedia } from "@/actions/chat-agents"
import { useMessageTemplates } from "@/hooks/use-message-templates"
import { Select, SelectItem, SelectContent, SelectValue, SelectTrigger } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { v4 as uuidv4 } from "uuid"
import Link from "next/link"
import { EmojiPickerInput } from "../../../_components/emoji-picker-input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ConversationNodeConfigProps {
  selectedNode: Node
  updateNode: (nodeId: string, updates: any) => void
  workflowId: string
  agentId: string
  globalVariables?: string[]
}

type ResponseType = "text" | "audio" | "template"

export function ConversationNodeConfig({
  selectedNode,
  updateNode,
  workflowId,
  agentId,
  globalVariables = [],
}: ConversationNodeConfigProps) {
  const data = selectedNode.data || {}
  const isInitialNode = !!data.initialMessage
  const isLimitedToTemplate = isInitialNode && !!data.acceptAnyMessage

  const [responseType, setResponseType] = useState<ResponseType>(data.responseType || "text")
  const [currentStep, setCurrentStep] = useState<number>(1)

  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(data.audioUrl || null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  const { assetsData, assetsLoading, assetsError, refetchAssets } = useAssets(true)

  const audioAssets = assetsData.filter((a: any) => a.type === "audio")
  const mediaAssets = assetsData.filter((a: any) => a.type !== "audio")

  useEffect(() => {
    setResponseType(data.responseType || "text")
    setAudioPreviewUrl(data.audioUrl || null)
    setAudioBlob(null)
  }, [selectedNode.id, data.responseType, data.audioUrl])

  // 🔐 Enforce template response on the very first node
  useEffect(() => {
    if (isLimitedToTemplate && data.responseType !== "template") {
      setResponseType("template")
      handleChange("responseType", "template")
      toast.warning("El primer nodo que acepta cualquier mensaje ha sido configurado como plantilla.")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialNode, data.acceptAnyMessage])

  // Single-field helper (existing use cases)
  const handleChange = (field: string, value: any) => {
    updateNode(selectedNode.id, { data: { ...data, [field]: value } })
  }

  // Multi-field helper to avoid successive overwrites
  const applyChanges = (updates: Record<string, any>) => {
    updateNode(selectedNode.id, { data: { ...data, ...updates } })
  }

  const handleResponseTypeChange = (value: ResponseType) => {
    // If this is the first node, only 'template' is allowed
    if (isLimitedToTemplate && value !== "template") {
      toast.error("El primer nodo que acepta cualquier mensaje debe ser un mensaje plantilla.")
      return
    }

    setResponseType(value)
    handleChange("responseType", value)
    setCurrentStep(2) // Move to content configuration
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const completeAudioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        })
        setAudioBlob(completeAudioBlob)
        setAudioPreviewUrl(URL.createObjectURL(completeAudioBlob))
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setAudioBlob(null)
      setAudioPreviewUrl(null)
      handleChange("audioUrl", null)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      toast.error("No se pudo acceder al micrófono. Verifica los permisos.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast.error("Por favor, selecciona un archivo de audio válido.")
        return
      }
      setAudioBlob(file)
      setAudioPreviewUrl(URL.createObjectURL(file))
      handleChange("audioUrl", null)
    }
  }

  const submitAudio = async () => {
    if (!audioBlob) {
      toast.error("No hay audio para subir. Graba o selecciona un archivo primero.")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("audioFile", audioBlob, `audio_${selectedNode.id}.aac`)

    try {
      const result = await uploadAudioAction(formData)
      if (result.success && result.url) {
        handleChange("audioUrl", result.url)
        setAudioPreviewUrl(result.url)
        refetchAssets()
        toast.success("Audio subido y guardado exitosamente!")
      } else {
        toast.error(`Error al subir audio: ${result.error || "Desconocido"}`)
      }
    } catch (error) {
      console.error("Error submitting audio:", error)
      toast.error("Ocurrió un error inesperado al subir el audio.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type.startsWith("video/") && file.size > 16 * 1024 * 1024) {
      toast.error("El archivo de video no puede superar los 16 MB. Por favor, selecciona un archivo más pequeño.")
      return
    }

    setIsUploadingMedia(true)

    try {
      let uploadedUrl: string | undefined
      let publicId: string | undefined
      let resourceType: "raw" | "image" | "video" | undefined

      const isLargeFile = file.size > 10 * 1024 * 1024

      if (isLargeFile) {
        const timestamp = Math.floor(Date.now() / 1000)
        resourceType = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "raw"

        const folder =
          resourceType === "video" ? "whatsapp_videos" : resourceType === "image" ? "whatsapp_images" : "whatsapp_files"

        const { signature, apiKey, cloudName, error } = await getCloudinarySignature({
          resourceType,
          folder,
          timestamp,
        })

        if (error) {
          toast.error(`Error obteniendo firma: ${error}`)
          return
        }

        const uploadData = new FormData()
        uploadData.append("file", file)
        uploadData.append("api_key", apiKey)
        uploadData.append("timestamp", timestamp.toString())
        uploadData.append("signature", signature)
        uploadData.append("folder", folder)

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
          method: "POST",
          body: uploadData,
        })

        const result = await res.json()
        if (result.secure_url) {
          uploadedUrl = result.secure_url
          publicId = result.public_id
          resourceType = result.resource_type as any
          applyChanges({
            fileOrImageUrl: uploadedUrl,
            filePublicId: publicId,
            fileResourceType: resourceType,
            isUploadingMedia: false,
          })
          toast.success("Archivo subido exitosamente!")
        } else {
          toast.error(`Error subiendo archivo: ${result.error?.message || "Desconocido"}`)
        }
      } else {
        const formData = new FormData()
        if (file.type.startsWith("video/")) {
          formData.append("video", file)
        } else if (file.type.startsWith("image/")) {
          formData.append("image", file)
        } else {
          formData.append("file", file)
        }

        const result = await uploadFile(formData)
        if (result.success && result.url) {
          uploadedUrl = result.url
          publicId = result.publicId
          resourceType = result.resourceType
          applyChanges({
            fileOrImageUrl: uploadedUrl,
            filePublicId: publicId,
            fileResourceType: resourceType,
            isUploadingMedia: false,
          })
          toast.success("Archivo subido exitosamente!")
        } else {
          toast.error(`Error al subir archivo: ${result.error || "Desconocido"}`)
        }
      }

      if (uploadedUrl) {
        if (isLargeFile) {
          await saveUserAsset({
            name: file.name,
            type: resourceType || "raw",
            url: uploadedUrl,
          })
        }
        refetchAssets()
        await updateChatWorkflowMedia({
          workflowId,
          nodeId: selectedNode.id,
          data: {
            fileOrImageUrl: uploadedUrl,
            filePublicId: publicId,
            fileResourceType: resourceType,
          },
        })
      }
    } catch (error) {
      console.error("Error uploading media:", error)
      toast.error("Ocurrió un error inesperado al subir el archivo.")
    } finally {
      setIsUploadingMedia(false)
    }
  }

  const handleDeleteMedia = async () => {
    if (!data.filePublicId) return
    setIsUploadingMedia(true)
    try {
      const delRes = await deleteCloudinaryFile(data.filePublicId, data.fileResourceType || "raw")
      if (!delRes.success) {
        toast.error(`Error eliminando archivo: ${delRes.error}`)
        return
      }

      await updateChatWorkflowMedia({
        workflowId,
        nodeId: selectedNode.id,
        data: {
          fileOrImageUrl: null,
          filePublicId: null,
          fileResourceType: null,
        },
      })

      handleChange("fileOrImageUrl", null)
      handleChange("filePublicId", null)
      handleChange("fileResourceType", null)

      toast.success("Archivo eliminado correctamente")
    } catch (error) {
      console.error("Error deleting media:", error)
      toast.error("Ocurrió un error al eliminar el archivo.")
    } finally {
      setIsUploadingMedia(false)
    }
  }

  const isTextMode = responseType === "text"
  const hasButtons = Array.isArray(data.interactiveButtons) && data.interactiveButtons.length > 0
  const isTemplateWithButtons = responseType === "template" && hasButtons
  const isTemplateWithoutButtons = responseType === "template" && !hasButtons

  // Keep jumpToNextNode in sync with template button rules
  useEffect(() => {
    if (responseType !== "template") return

    if (isTemplateWithButtons && data.jumpToNextNode) {
      // Force disable automatic jump when template has buttons
      applyChanges({ jumpToNextNode: false })
    }

    if (isTemplateWithoutButtons && !data.jumpToNextNode) {
      // Enable automatic jump by default when template has no buttons
      applyChanges({ jumpToNextNode: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseType, hasButtons])

  const hasInteractiveButtons = hasButtons

  const { templatesData, templatesLoading, templatesError } = useMessageTemplates(agentId)

  // Utilidad para extraer placeholders {{1}}, {{ 2 }}
  const extractPlaceholders = (text: string | undefined) => {
    if (!text) return [] as string[]
    const regex = /\{\{\s*(\d+)\s*\}\}/g
    const matches = new Set<string>()
    let m
    while ((m = regex.exec(text)) !== null) {
      matches.add(m[1]) // solo el número
    }
    return Array.from(matches)
  }

  // Placeholders actuales de la plantilla
  const templatePlaceholders = useMemo(() => extractPlaceholders(data.templateBody), [data.templateBody])

  // Sync: si aparecen nuevos placeholders, asegura que existan en templateVariableValues
  useEffect(() => {
    if (responseType !== "template" || templatePlaceholders.length === 0) return

    const existingValues: Record<string, string> = data.templateVariableValues || {}
    let hasChanges = false
    templatePlaceholders.forEach((ph) => {
      if (!(ph in existingValues)) {
        existingValues[ph] = ""
        hasChanges = true
      }
    })
    // Remove extras no longer present
    Object.keys(existingValues).forEach((key) => {
      if (!templatePlaceholders.includes(key)) {
        delete existingValues[key]
        hasChanges = true
      }
    })
    if (hasChanges) {
      applyChanges({ templateVariableValues: { ...existingValues } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templatePlaceholders.join(",")])

  const handleTemplateVarChange = (ph: string, value: string) => {
    const newVals = { ...(data.templateVariableValues || {}), [ph]: value }
    applyChanges({ templateVariableValues: newVals })
  }

  const variableOptions = globalVariables || []

  const stripBraces = (val: string) => val.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "")

  const isVariableVal = (val: string) => /\{\{\s*[^{}]+\s*\}\}/.test(val)

  const hasUnfilledTemplateVars = useMemo(() => {
    if (responseType !== "template") return false
    return templatePlaceholders.some((ph) => !(data.templateVariableValues?.[ph] ?? "").trim())
  }, [responseType, templatePlaceholders, data.templateVariableValues])

  // Step navigation
  const steps = [
    { id: 1, title: "Configuración básica", icon: Settings },
    { id: 2, title: "Contenido", icon: MessageSquare },
    { id: 3, title: "Interacciones", icon: MousePointer },
  ]

  const getCurrentStepTitle = () => {
    const step = steps.find((s) => s.id === currentStep)
    return step?.title || "Configuración"
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Configurar nodo de conversación</h1>
            <p className="text-sm text-gray-600 mt-1">{getCurrentStepTitle()}</p>
          </div>
          <Badge variant="outline" className="bg-white">
            {responseType === "text" ? "Texto" : responseType === "audio" ? "Audio" : "Plantilla"}
          </Badge>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : isCompleted
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{step.title}</span>
                </button>
                {index < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Special Notice for Limited Template */}
      {isLimitedToTemplate && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Este es el primer nodo de conversación del flujo y acepta cualquier mensaje, por lo que debe ser un mensaje
            plantilla.
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Basic Configuration */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Configuración básica</h2>
                <p className="text-sm text-gray-600">Define el nombre y comportamiento del nodo</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Node Name */}
              <div>
                <Label htmlFor="node-name" className="text-sm font-medium text-gray-700 mb-2 block">
                  Nombre del nodo
                </Label>
                <Input
                  id="node-name"
                  value={responseType === "template" ? data.templateName : data.name}
                  disabled={responseType === "template"}
                  onChange={(e) =>
                    responseType === "template"
                      ? handleChange("name", data.templateName || "")
                      : handleChange("name", e.target.value)
                  }
                  placeholder="E.g., Bienvenida, Información del producto"
                  className="w-full"
                />
              </div>

              {/* Response Type Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Tipo de respuesta</Label>
                <RadioGroup
                  value={responseType}
                  onValueChange={(val: string) => handleResponseTypeChange(val as ResponseType)}
                  className="grid grid-cols-1 gap-3"
                >
                  <div
                    className={`flex items-center space-x-3 border rounded-lg p-4 transition-all hover:shadow-sm ${
                      responseType === "text" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    } ${isLimitedToTemplate ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => !isLimitedToTemplate && handleResponseTypeChange("text")}
                  >
                    <RadioGroupItem value="text" id="r-text" disabled={isLimitedToTemplate} />
                    <div className="flex-1">
                      <Label htmlFor="r-text" className="font-medium cursor-pointer">
                        Mensaje de texto
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Envía un mensaje de texto con botones y media opcionales
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center space-x-3 border rounded-lg p-4 transition-all hover:shadow-sm ${
                      responseType === "audio" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    } ${isLimitedToTemplate ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => !isLimitedToTemplate && handleResponseTypeChange("audio")}
                  >
                    <RadioGroupItem value="audio" id="r-audio" disabled={isLimitedToTemplate} />
                    <div className="flex-1">
                      <Label htmlFor="r-audio" className="font-medium cursor-pointer">
                        Mensaje de audio
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Envía un mensaje de audio o un archivo de audio</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center space-x-3 border rounded-lg p-4 transition-all hover:shadow-sm ${
                      responseType === "template" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    } cursor-pointer`}
                    onClick={() => handleResponseTypeChange("template")}
                  >
                    <RadioGroupItem value="template" id="r-template" />
                    <div className="flex-1">
                      <Label htmlFor="r-template" className="font-medium cursor-pointer">
                        Mensaje plantilla
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Envía un mensaje plantilla para iniciar una conversación
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Trigger Configuration */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Activación del nodo</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Aceptar cualquier mensaje</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Este nodo se activará con cualquier mensaje del usuario si no hay otro nodo que coincida
                      </p>
                    </div>
                    <Switch
                      checked={data.acceptAnyMessage || false}
                      onCheckedChange={(checked) => handleChange("acceptAnyMessage", checked)}
                    />
                  </div>

                  {!data.acceptAnyMessage && (
                    <div>
                      <Label htmlFor="user-response" className="text-sm font-medium text-gray-700 mb-2 block">
                        Palabras clave de activación
                      </Label>
                      <Textarea
                        id="user-response"
                        value={data.userResponse || ""}
                        onChange={(e) => handleChange("userResponse", e.target.value)}
                        placeholder="e.g., 'hello', 'start', 'help'"
                        rows={2}
                        disabled={data.isUserResponseAuto}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">Palabras o frases que activarán este nodo</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Behavior Configuration */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Comportamiento</h3>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Saltar al siguiente nodo</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Saltar automáticamente al siguiente nodo después de enviar la respuesta
                    </p>
                  </div>
                  <Switch
                    checked={data.jumpToNextNode || false}
                    onCheckedChange={(checked) => handleChange("jumpToNextNode", checked)}
                    disabled={isTemplateWithButtons}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setCurrentStep(2)} className="px-6">
                  Siguiente: Configurar contenido
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Content Configuration */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Text Content */}
          {isTextMode && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Contenido del mensaje</h2>
                  <p className="text-sm text-gray-600">Configura el texto que enviará el bot</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="bot-response" className="text-sm font-medium text-gray-700 mb-2 block">
                    Mensaje del bot
                  </Label>
                  <EmojiPickerInput
                    id="bot-response"
                    as="textarea"
                    value={data.botResponse || ""}
                    onChange={(val: string) => handleChange("botResponse", val)}
                    placeholder="¡Hola! ¿Cómo puedo ayudarte hoy?"
                    rows={4}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">El mensaje que será enviado al usuario</p>
                </div>

                {/* Media Upload Section */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Adjunto multimedia (opcional)</Label>

                  {!data.fileOrImageUrl ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-3">Arrastra un archivo aquí o haz clic para seleccionar</p>
                      <Button
                        onClick={() => mediaInputRef.current?.click()}
                        variant="outline"
                        disabled={isUploadingMedia}
                      >
                        {isUploadingMedia ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UploadCloud className="h-4 w-4 mr-2" />
                        )}
                        {isUploadingMedia ? "Subiendo..." : "Seleccionar archivo"}
                      </Button>
                      <Input
                        type="file"
                        ref={mediaInputRef}
                        onChange={handleMediaUpload}
                        className="hidden"
                        accept="image/*,video/*,application/*"
                        disabled={isUploadingMedia}
                      />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium">Archivo adjunto</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeleteMedia}
                          disabled={isUploadingMedia}
                          className="text-red-600 hover:text-red-700 bg-transparent"
                        >
                          Eliminar
                        </Button>
                      </div>

                      {data.fileResourceType === "image" ? (
                        <img
                          src={data.fileOrImageUrl || "/placeholder.svg"}
                          alt="Preview"
                          className="max-w-full h-auto rounded-lg border max-h-48 object-cover"
                        />
                      ) : data.fileResourceType === "video" ? (
                        <video src={data.fileOrImageUrl} controls className="max-w-full rounded-lg border max-h-48" />
                      ) : (
                        <div className="flex items-center p-3 bg-white rounded border">
                          <FileAudio className="h-6 w-6 text-gray-400 mr-3" />
                          <span className="text-sm text-gray-700 truncate">{data.fileOrImageUrl.split("/").pop()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing Media Assets */}
                  {mediaAssets && mediaAssets.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        O selecciona de tus archivos existentes
                      </Label>
                      <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                        {mediaAssets.map((asset: any) => (
                          <div
                            key={asset.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                              data.fileOrImageUrl === asset.url ? "border-blue-500 bg-blue-50" : "border-gray-200"
                            }`}
                            onClick={() => {
                              applyChanges({
                                fileOrImageUrl: asset.url,
                                filePublicId: asset.publicId,
                                fileResourceType: asset.type,
                              })
                            }}
                          >
                            <p className="font-medium text-xs truncate">{asset.name}</p>
                            <p className="text-xs text-gray-500">{new Date(asset.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Audio Content */}
          {responseType === "audio" && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileAudio className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Configuración de audio</h2>
                  <p className="text-sm text-gray-600">Graba o sube un mensaje de audio</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Recording Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "outline"}
                    className="h-12"
                    disabled={isUploading}
                  >
                    {isRecording ? <StopCircle className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                    {isRecording ? "Detener grabación" : "Grabar audio"}
                  </Button>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="h-12"
                    disabled={isUploading || isRecording}
                  >
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Subir archivo
                  </Button>

                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="audio/*"
                    disabled={isUploading || isRecording}
                  />
                </div>

                {/* Recording Status */}
                {isRecording && (
                  <Alert className="border-red-200 bg-red-50">
                    <div className="flex items-center text-red-600">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                      <Mic className="h-4 w-4 mr-2" />
                      Grabación en progreso...
                    </div>
                  </Alert>
                )}

                {/* Audio Preview */}
                {(audioPreviewUrl || data.audioUrl) && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Vista previa de audio</Label>
                    <audio
                      key={audioPreviewUrl || data.audioUrl}
                      src={audioPreviewUrl || data.audioUrl || ""}
                      controls
                      className="w-full mb-4"
                    />

                    {audioBlob && !data.audioUrl && (
                      <Button onClick={submitAudio} disabled={isUploading || !audioBlob} className="w-full">
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UploadCloud className="h-4 w-4 mr-2" />
                        )}
                        {isUploading ? "Subiendo..." : "Guardar audio"}
                      </Button>
                    )}

                    {data.audioUrl && !audioBlob && (
                      <div className="flex items-center text-sm text-green-600 p-3 bg-green-50 border border-green-200 rounded-md">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Audio guardado. Graba o sube uno nuevo para reemplazar.
                      </div>
                    )}
                  </div>
                )}

                {/* Existing Audio Assets */}
                {audioAssets && audioAssets.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Seleccionar de audios existentes
                    </Label>
                    <div className="grid gap-3 max-h-40 overflow-y-auto">
                      {audioAssets.map((asset: any) => (
                        <div
                          key={asset.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                            data.audioUrl === asset.url ? "border-blue-500 bg-blue-50" : "border-gray-200"
                          }`}
                          onClick={() => {
                            handleChange("audioUrl", asset.url)
                            setAudioPreviewUrl(asset.url)
                            setAudioBlob(null)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-sm truncate">{asset.name}</h5>
                            {data.audioUrl === asset.url && (
                              <Badge variant="default" className="text-xs">
                                Seleccionado
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{new Date(asset.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Template Content */}
          {responseType === "template" && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Configuración de plantilla</h2>
                  <p className="text-sm text-gray-600">Selecciona y configura una plantilla de mensaje</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Template Selection */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Seleccionar plantilla</Label>
                  <Select
                    onValueChange={(value) => {
                      const tpl = Array.isArray(templatesData?.data)
                        ? templatesData.data.find((t: any) => t.id === value)
                        : undefined
                      handleChange("templateId", value)
                      if (tpl) {
                        const components =
                          typeof tpl.components === "string" ? JSON.parse(tpl.components) : tpl.components

                        // BODY
                        let previewBody = ""
                        const bodyComp = components?.find((c: any) => c.type === "BODY")

                        if (tpl.category === "AUTHENTICATION") {
                          previewBody = "Tu código de verificación es {{1}}"
                          if (bodyComp?.add_security_recommendation) {
                            previewBody += "\nNo compartas este código con nadie."
                          }
                        } else {
                          previewBody = bodyComp?.text || ""
                        }

                        // Extract TEMPLATE BUTTONS -> interactiveButtons
                        let extractedButtons: { id: string; title: string }[] = []
                        const btnComp = components?.find((c: any) => c.type === "BUTTONS")
                        if (btnComp?.buttons && Array.isArray(btnComp.buttons)) {
                          extractedButtons = btnComp.buttons.map((b: any) => ({
                            id: uuidv4(),
                            title: b.text || "Botón",
                          }))
                        }

                        // OTP button text (AUTHENTICATION has exactly 1)
                        let otpButtonText: string | undefined
                        if (tpl.category === "AUTHENTICATION") {
                          const otpBtn = btnComp?.buttons?.find((b: any) => b.type === "OTP")
                          otpButtonText = otpBtn?.text || "Copiar código"
                        }

                        applyChanges({
                          templateName: tpl.name,
                          templateBody: previewBody,
                          templateJson: tpl,
                          templateCategory: tpl.category,
                          templateOtpButtonText: otpButtonText,
                          templateLanguage: tpl.language,
                          interactiveButtons: extractedButtons,
                        })
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una plantilla" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {Array.isArray(templatesData?.data) &&
                        templatesData.data.map((template: any) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* No Templates Warning */}
                {!templatesLoading && (Array.isArray(templatesData?.data) ? templatesData.data.length === 0 : true) && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <Info className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Aún no tienes plantillas de mensaje creadas. Debes crear una antes de poder usar este flujo.
                      <Button asChild className="mt-2 ml-2" size="sm">
                        <Link href="/application/agents/chat-agents/templates">Crear Plantilla</Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Template Preview */}
                {data.templateBody && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Vista previa del mensaje</Label>
                    <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">{data.templateBody}</p>
                  </div>
                )}

                {/* Template Variables */}
                {templatePlaceholders.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Configurar variables de la plantilla
                    </Label>
                    <div className="space-y-4">
                      {templatePlaceholders.map((ph) => {
                        const currentVal = data.templateVariableValues?.[ph] || ""
                        const isVar = isVariableVal(currentVal)
                        const selectedOption = isVar ? stripBraces(currentVal) : "__custom__"

                        return (
                          <div key={ph} className="border rounded-lg p-4">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              {`Variable {{${ph}}}`}
                            </Label>
                            <Select
                              value={selectedOption}
                              onValueChange={(val) => {
                                if (val === "__custom__") {
                                  handleTemplateVarChange(ph, "")
                                } else {
                                  handleTemplateVarChange(ph, `{{${val}}}`)
                                }
                              }}
                            >
                              <SelectTrigger className="w-full mb-2">
                                <SelectValue placeholder="Selecciona una variable" />
                              </SelectTrigger>
                              <SelectContent>
                                {variableOptions.map((v) => (
                                  <SelectItem key={v} value={v}>
                                    {v}
                                  </SelectItem>
                                ))}
                                <SelectItem value="__custom__">Texto personalizado…</SelectItem>
                              </SelectContent>
                            </Select>

                            {selectedOption === "__custom__" && (
                              <Input
                                value={currentVal}
                                onChange={(e) => handleTemplateVarChange(ph, e.target.value)}
                                placeholder="Ingresa texto personalizado…"
                                className="w-full"
                              />
                            )}
                          </div>
                        )
                      })}

                      {hasUnfilledTemplateVars && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            Debes asignar un valor para todas las variables antes de guardar el flujo.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Anterior
            </Button>
            <Button onClick={() => setCurrentStep(3)}>
              Siguiente: Configurar interacciones
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Interactions */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MousePointer className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Botones interactivos</h2>
                <p className="text-sm text-gray-600">
                  {data.jumpToNextNode
                    ? "Los botones están desactivados cuando el avance automático está habilitado"
                    : "Añade botones para guiar la conversación"}
                </p>
              </div>
            </div>

            {data.jumpToNextNode ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <MousePointer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Botones interactivos desactivados</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Desactiva "Saltar al siguiente nodo" en la configuración básica para habilitarlos
                </p>
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Ir a configuración básica
                </Button>
              </div>
            ) : (
              <InteractiveButtonsConfig
                buttons={data.interactiveButtons || []}
                onChange={(buttons: any) => handleChange("interactiveButtons", buttons)}
              />
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Anterior
            </Button>
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-2">Resumen de configuración</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <p>
                  <strong>Nombre:</strong> {data.name || "Sin nombre"}
                </p>
                <p>
                  <strong>Tipo:</strong>{" "}
                  {responseType === "text"
                    ? "Mensaje de texto"
                    : responseType === "template"
                      ? "Mensaje plantilla"
                      : "Mensaje de audio"}
                </p>
              </div>
              <div>
                {data.userResponse && !data.acceptAnyMessage && (
                  <p>
                    <strong>Trigger:</strong> "{data.userResponse}"
                  </p>
                )}
                {data.acceptAnyMessage && (
                  <p>
                    <strong>Trigger:</strong> Cualquier mensaje
                  </p>
                )}
                {isTextMode && hasInteractiveButtons && (
                  <p>
                    <strong>Botones:</strong> {data.interactiveButtons?.length || 0}
                  </p>
                )}
                {data.jumpToNextNode && (
                  <p>
                    <strong>Avance:</strong> Automático
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
