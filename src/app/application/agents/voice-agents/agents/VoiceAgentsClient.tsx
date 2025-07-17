"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Save,
  Plus,
  RotateCcw,
  Loader2,
  Play,
  Pause,
  Volume2,
  FileText,
  Sparkles,
  Settings,
  Mic,
  Brain,
  Database,
  Wrench,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { generatePrompt } from "@/actions/claude"
import { getElevenLabsVoices } from "@/actions/elevenlabs"
import type { ElevenLabsVoice } from "@/types/agent"
import { useAgent, type AgentWithTools } from "@/context/agent-context"
import { toast } from "sonner"
import { useCreateAgent, usePublishAgent, type PublishAgentInput } from "@/hooks/use-create-agent"
import { TemplateDialog, type Template } from "./_components/template-dialog"
import DeleteAgent from "./_components/delete-agent"
import StartCall from "./_components/start-call"
import { Checkbox } from "@/components/ui/checkbox"
import { getAllTools } from "@/actions/tools"
import type { Tool } from "@prisma/client"
import { useUser } from "@clerk/nextjs"
import { ConnectionExists, createConnection, getSessionToken } from "@/actions/nango"
import Nango from "@nangohq/frontend"
import FileUploader from "@/app/_components/fileUploader"
import { createDocument, getKnowledgeBases } from "@/actions/trieve"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

const VoiceAgentsClient = ({ agents }: { agents: AgentWithTools[] }) => {
  const {
    selectedAgent,
    formData,
    setFormData,
    hasChanges,
    setHasChanges,
    resetForm,
    isCreatingNew,
    setIsCreatingNew,
    setSelectedAgent,
  } = useAgent()

  const createAgentMutation = useCreateAgent()
  const publishAgent = usePublishAgent()
  const [aiPromptGenerated, setAiPromptGenerated] = useState<boolean>(false)
  const [purposeInput, setPurposeInput] = useState<string>("")
  const [fileId, setFileId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [loadingVoices, setLoadingVoices] = useState<boolean>(true)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [voiceFilter, setVoiceFilter] = useState<string>("")
  const [selectedFilters, setSelectedFilters] = useState<{
    gender?: string
    age?: string
    accent?: string
  }>({})
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState<boolean>(false)
  const [isPublishing, setIsPublishing] = useState<boolean>(false)
  const [availableTools, setAvailableTools] = useState<Tool[]>([])
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set())
  const [knowledgeBaseName, setKnowledgeBaseName] = useState<string>("")
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([])
  const [creatingNewKB, setCreatingNewKB] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const { user } = useUser()

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string
  }>({})

  // Calculate completion progress
  const getCompletionProgress = () => {
    const fields = [formData.name, formData.firstMessage, formData.prompt, formData.voiceId]
    const completed = fields.filter((field) => field && field.trim()).length
    return (completed / fields.length) * 100
  }

  // Validate form fields
  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      errors.name = "Agent name is required"
    }
    if (!formData.firstMessage.trim()) {
      errors.firstMessage = "First message is required"
    }
    if (!formData.prompt.trim()) {
      errors.prompt = "System prompt is required"
    }
    if (!formData.voiceId) {
      errors.voiceId = "Voice selection is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Effect to initialize form data when an agent is selected
  useEffect(() => {
    if (selectedAgent) {
      setFormData({
        name: selectedAgent.name,
        firstMessage: selectedAgent.firstMessage || "",
        prompt: selectedAgent.prompt || "",
        backgroundSound: selectedAgent.backgroundSound || "off",
        voiceId: selectedAgent.voiceId || "",
      })
      if ("knowledgeBaseId" in selectedAgent) {
        setFileId(selectedAgent.knowledgeBaseId as string | null)
      }
    }
  }, [selectedAgent, setFormData])

  // Effect to handle agent selection from props
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent && !isCreatingNew) {
      setSelectedAgent(agents[0])
    }
  }, [agents, selectedAgent, isCreatingNew, setSelectedAgent])

  const openTemplateDialog = () => {
    setShowTemplateDialog(true)
  }

  useEffect(() => {
    // @ts-ignore
    window.openVoiceAgentTemplateDialog = openTemplateDialog
  }, [])

  const handleSelectTemplate = (template: Template) => {
    setFormData({
      ...formData,
      ...template.formData,
    })
    if (!selectedAgent) {
      setIsCreatingNew(true)
    }
    toast.success(`Template "${template.name}" applied`)
  }

  const handleStartBlank = () => {
    if (!selectedAgent) {
      setIsCreatingNew(true)
    }
    toast.info("Creating agent from scratch")
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    })
    setHasChanges(true)

    // Clear validation error for this field
    if (validationErrors[field as any]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field as any]
        return newErrors
      })
    }
  }

  const handleGeneratePrompt = async () => {
    if (!purposeInput.trim()) {
      toast.error("Por favor describe el propósito del agente")
      return
    }

    try {
      setIsGenerating(true)
      const generatedPrompt = await generatePrompt(purposeInput)
      handleInputChange("prompt", generatedPrompt.toString())
      setAiPromptGenerated(true)
      toast.success("Prompt generado correctamente")
    } catch (error) {
      console.error("Error generando prompt:", error)
      toast.error("Error al generar el prompt. Por favor, inténtalo de nuevo.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Por favor, completa todos los campos requeridos")
      return
    }

    if (isCreatingNew) {
      try {
        await createAgentMutation.mutateAsync({
          name: formData.name,
          firstMessage: formData.firstMessage,
          prompt: formData.prompt,
          backgroundSound: formData.backgroundSound,
          voiceId: formData.voiceId,
          knowledgeBaseId: fileId,
        })
        resetForm()
        setFileId(null)
        setIsCreatingNew(false)
        toast.success("Agente creado correctamente")
      } catch (error) {
        console.error("Error creando agente:", error)
        toast.error("Error al crear el agente. Por favor, inténtalo de nuevo.")
      }
    }
  }

  const handlePublish = async () => {
    if (!validateForm()) {
      toast.error("Por favor, completa todos los campos requeridos")
      return
    }

    setIsPublishing(true)
    try {
      if (!selectedAgent?.vapiId) {
        toast.error("No se puede actualizar el agente sin un vapiId")
        return
      }
      const publishData: PublishAgentInput = {
        name: formData.name,
        firstMessage: formData.firstMessage,
        prompt: formData.prompt,
        backgroundSound: formData.backgroundSound,
        voiceId: formData.voiceId,
        vapiId: selectedAgent.vapiId,
        toolIds: Array.from(selectedToolIds),
      }
      const updatedAgent = await publishAgent.mutateAsync(publishData)
      setSelectedAgent(updatedAgent as AgentWithTools)
      toast.success("Agente actualizado correctamente")
    } catch (error) {
      console.error("Error al publicar agente:", error)
      toast.error("Error al actualizar el agente. Por favor, inténtalo de nuevo.")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleVoicePreview = async (voiceId: string, previewUrl: string) => {
    if (playingVoice === voiceId) {
      if (audioRef.current) {
        audioRef.current.pause()
        setPlayingVoice(null)
      }
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(previewUrl)
    audioRef.current = audio
    setPlayingVoice(voiceId)
    audio.onended = () => {
      setPlayingVoice(null)
    }
    audio.onerror = () => {
      setPlayingVoice(null)
      toast.error("Error al reproducir la vista previa de la voz")
    }

    try {
      await audio.play()
    } catch (error) {
      setPlayingVoice(null)
      toast.error("Error al reproducir la vista previa de la voz")
    }
  }

  const getSelectedVoice = () => {
    return voices.find((voice) => voice.voice_id === formData.voiceId)
  }

  const filteredVoices = voices.filter((voice) => {
    const matchesSearch =
      voice.name.toLowerCase().includes(voiceFilter.toLowerCase()) ||
      voice.description?.toLowerCase().includes(voiceFilter.toLowerCase())
    const matchesGender = !selectedFilters.gender || voice.labels.gender === selectedFilters.gender
    const matchesAge = !selectedFilters.age || voice.labels.age === selectedFilters.age
    const matchesAccent = !selectedFilters.accent || voice.labels.accent === selectedFilters.accent
    return matchesSearch && matchesGender && matchesAge && matchesAccent
  })

  const uniqueFilters = {
    gender: [...new Set(voices.map((v) => v.labels.gender))],
    age: [...new Set(voices.map((v) => v.labels.age))],
    accent: [...new Set(voices.map((v) => v.labels.accent))],
  }

  useEffect(() => {
    const fetchElevenLabsVoices = async () => {
      try {
        setLoadingVoices(true)
        const voicesData = await getElevenLabsVoices()
        if (voicesData.voices) {
          setVoices(voicesData.voices as ElevenLabsVoice[])
        }
      } catch (error) {
        console.error("Error fetching voices:", error)
        toast.error("Error al cargar las voces")
      } finally {
        setLoadingVoices(false)
      }
    }

    fetchElevenLabsVoices()
  }, [])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const handleDeleteSuccess = () => {
    toast.success("Agente eliminado correctamente")
    setSelectedAgent(null)
  }

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const tools = await getAllTools()
        setAvailableTools(tools)
      } catch (error) {
        console.error("Error fetching tools:", error)
      }
    }
    fetchTools()
  }, [])

  useEffect(() => {
    if (selectedAgent?.tools) {
      setSelectedToolIds(new Set(selectedAgent.tools.map((t: Tool) => t.id)))
    } else {
      setSelectedToolIds(new Set())
    }
  }, [selectedAgent])

  const handleToolToggle = async (tool: Tool) => {
    if (!user) {
      toast.error("Por favor, inicia sesión para gestionar las herramientas")
      return
    }

    const newSet = new Set(selectedToolIds)
    if (newSet.has(tool.id)) {
      newSet.delete(tool.id)
      setSelectedToolIds(newSet)
      setHasChanges(true)
    } else {
      // @ts-ignore
      if (!tool.provider) {
        newSet.add(tool.id)
        setSelectedToolIds(newSet)
        setHasChanges(true)
        return
      }

      // @ts-ignore
      const provider = tool.provider as string
      setIsConnecting(tool.id)
      try {
        const { isConnected } = await ConnectionExists(user.id, provider)
        if (isConnected) {
          newSet.add(tool.id)
          setSelectedToolIds(newSet)
          setHasChanges(true)
        } else {
          toast.info(`Conecta tu cuenta ${provider} para usar esta herramienta`)
          const sessionData = await getSessionToken(user.id)
          const sessionToken = typeof sessionData === "string" ? sessionData : sessionData?.token
          if (!sessionToken) throw new Error("Could not get session token")

          const nango = new Nango({ connectSessionToken: sessionToken })
          const result = await nango.auth(provider)
          if (result?.connectionId) {
            await createConnection({
              integrationId: result.connectionId,
              providerConfigKey: provider,
              authMode: "OAUTH2",
              endUserId: user.id,
            })
            newSet.add(tool.id)
            setSelectedToolIds(newSet)
            setHasChanges(true)
            toast.success(`Conectado a ${provider} correctamente!`)
          } else {
            throw new Error("Error al conectar con Nango")
          }
        }
      } catch (error) {
        console.error("Error al manejar el toggle de herramienta:", error)
        toast.error(`Error al conectar con ${provider}. Por favor, inténtalo de nuevo.`)
      } finally {
        setIsConnecting(null)
      }
    }
  }

  const handleUpload = (id: string) => {
    setFileId(id)
    setHasChanges(true)
    toast.success("Base de conocimientos creada. Guarda o publica los cambios para aplicarlos al agente.")
  }

  const uploadDocument = async (formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!knowledgeBaseName.trim()) {
        toast.error("Por favor, ingresa un nombre para la base de conocimientos")
      return {
        success: false,
        error: "Por favor, ingresa un nombre para la base de conocimientos"
      }
    }

    const file = formData.get("file") as File
    if (!file) {
        return { success: false, error: "No se encontró el archivo" }
    }

    const result = await createDocument(file, knowledgeBaseName)
    if (result.success && result.id) {
      return { success: true, url: result.id }
    } else {
      return { success: false, error: result.error }
    }
  }

  useEffect(() => {
    const fetchKBs = async () => {
      const result: any = await getKnowledgeBases()
      if (!result?.error) {
        setKnowledgeBases(result)
        if (result.length === 0) {
          setCreatingNewKB(true)
        }
      } else {
        console.error("Error al obtener las bases de conocimientos", result.error)
      }
    }
    if (isCreatingNew) {
      fetchKBs()
    }
  }, [isCreatingNew])

  // Empty state when no agent is selected
  if (!selectedAgent && !isCreatingNew) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <Mic className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">No se ha seleccionado ningún agente</h2>
            <p className="text-muted-foreground">
              Selecciona un agente desde el sidebar para editarlo, o crea uno nuevo para empezar.
            </p>
          </div>
          <Button onClick={() => setIsCreatingNew(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Crear nuevo agente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {isCreatingNew ? "Crear nuevo agente" : selectedAgent?.name}
              </h1>
              <p className="text-muted-foreground">
                {isCreatingNew
                  ? "Configura tu nuevo agente de voz con capacidades de IA"
                  : "Modifica la configuración y el comportamiento de tu agente"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isCreatingNew && (
                <Button variant="outline" onClick={() => setShowTemplateDialog(true)} className="shrink-0">
                  <FileText className="w-4 h-4 mr-2" />
                  Usar plantilla
                </Button>
              )}

              {selectedAgent && (
                <div className="flex items-center gap-2">
                  <StartCall vapiId={selectedAgent.vapiId!} />
                  <DeleteAgent
                    agentId={selectedAgent.id}
                    vapiId={selectedAgent.vapiId!}
                    onSuccess={handleDeleteSuccess}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {isCreatingNew && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progreso de configuración</span>
                <span className="font-medium">{Math.round(getCompletionProgress())}% Completado</span>
              </div>
              <Progress value={getCompletionProgress()} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {hasChanges && !isCreatingNew && (
              <Button variant="outline" onClick={resetForm}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Descartar cambios
              </Button>
            )}

            {hasChanges && !isCreatingNew ? (
              <Button onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Publicar cambios
                  </>
                )}
              </Button>
            ) : isCreatingNew ? (
              <Button onClick={handleSave} disabled={createAgentMutation.isPending}>
                {createAgentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear agente
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>

        <Separator />

        {/* Form Sections */}
        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Información básica</CardTitle>
                  <CardDescription>Configura la identidad y el saludo inicial de tu agente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nombre del agente *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Asistente de ventas"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={validationErrors.name ? "border-red-500" : ""}
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundSound" className="text-sm font-medium">
                    Sonido de fondo
                  </Label>
                  <Select
                    value={formData.backgroundSound}
                    onValueChange={(value) => handleInputChange("backgroundSound", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Sin sonido</SelectItem>
                      <SelectItem value="office">Oficina (Recomendado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstMessage" className="text-sm font-medium">
                  Primer mensaje *
                </Label>
                <Textarea
                  id="firstMessage"
                  placeholder="e.g., ¡Hola! Soy tu asistente de ventas. ¿Cómo puedo ayudarte hoy?"
                  value={formData.firstMessage}
                  onChange={(e) => handleInputChange("firstMessage", e.target.value)}
                  rows={3}
                  className={validationErrors.firstMessage ? "border-red-500" : ""}
                />
                {validationErrors.firstMessage && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.firstMessage}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Configuración de IA</CardTitle>
                  <CardDescription>Define el comportamiento y la personalidad de tu agente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt" className="text-sm font-medium">
                    Prompt *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generar con IA
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Describe el propósito de tu agente</Label>
                          <Textarea
                            placeholder="e.g., Este asistente califica leads para un equipo de ventas"
                            value={purposeInput}
                            onChange={(e) => setPurposeInput(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <Button
                          onClick={handleGeneratePrompt}
                          disabled={isGenerating || !purposeInput.trim()}
                          className="w-full"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generar Prompt
                            </>
                          )}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <Textarea
                  id="prompt"
                  placeholder="e.g., Eres un asistente de ventas amigable y profesional..."
                  value={formData.prompt}
                  onChange={(e) => handleInputChange("prompt", e.target.value)}
                  rows={6}
                  className={validationErrors.prompt ? "border-red-500" : ""}
                />
                {validationErrors.prompt && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.prompt}
                  </p>
                )}

                {aiPromptGenerated && (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      El prompt generado por IA ha sido aplicado. Puedes editarlo si es necesario.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Voice Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>Configuración de voz</CardTitle>
                  <CardDescription>Elige la voz perfecta para tu agente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Selección de voz *</Label>

                {loadingVoices ? (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                    <div className="text-center space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Cargando voces...</p>
                    </div>
                  </div>
                ) : (
                  <Select value={formData.voiceId} onValueChange={(value) => handleInputChange("voiceId", value)}>
                    <SelectTrigger className={validationErrors.voiceId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecciona una voz" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[80vh] w-[600px]">
                      <div className="p-4 space-y-4">
                        <Input
                          placeholder="Buscar voces..."
                          value={voiceFilter}
                          onChange={(e) => setVoiceFilter(e.target.value)}
                        />

                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(uniqueFilters).map(([filterType, values]) => (
                            <Select
                              key={filterType}
                              value={selectedFilters[filterType as keyof typeof selectedFilters] || "all"}
                              onValueChange={(value) =>
                                setSelectedFilters((prev) => ({
                                  ...prev,
                                  [filterType]: value === "all" ? undefined : value,
                                }))
                              }
                            >
                              <SelectTrigger className="h-8 w-auto">
                                <SelectValue placeholder={`Filtrar por ${filterType}`} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos los {filterType}</SelectItem>
                                {values.filter(Boolean).map((value) => (
                                  <SelectItem key={value} value={value || "unknown"}>
                                    {value || "Desconocido"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ))}
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {filteredVoices.map((voice) => (
                            <div
                              key={voice.voice_id}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-muted/50 ${
                                formData.voiceId === voice.voice_id ? "border-primary bg-primary/5" : "border-border"
                              }`}
                              onClick={() => handleInputChange("voiceId", voice.voice_id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{voice.name}</span>
                                    {formData.voiceId === voice.voice_id && (
                                      <CheckCircle2 className="w-4 h-4 text-primary" />
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {voice.labels.gender}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {voice.labels.age}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {voice.labels.accent}
                                    </Badge>
                                  </div>

                                  {voice.description && (
                                    <p className="text-sm text-muted-foreground">{voice.description}</p>
                                  )}
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleVoicePreview(voice.voice_id, voice.preview_url)
                                  }}
                                  className="shrink-0"
                                >
                                  {playingVoice === voice.voice_id ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SelectContent>
                  </Select>
                )}

                {validationErrors.voiceId && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.voiceId}
                  </p>
                )}

                {/* Selected Voice Preview */}
                {formData.voiceId && getSelectedVoice() && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h4 className="font-medium">{getSelectedVoice()?.name}</h4>
                        <p className="text-sm text-muted-foreground">{getSelectedVoice()?.description}</p>
                        <div className="flex gap-2">
                          {Object.entries(getSelectedVoice()?.labels || {}).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const voice = getSelectedVoice()
                          if (voice) {
                            handleVoicePreview(voice.voice_id, voice.preview_url)
                          }
                        }}
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        {playingVoice === formData.voiceId ? "Pause" : "Preview"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tools Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle>Herramientas y Integraciones</CardTitle>
                  <CardDescription>Extiende las capacidades de tu agente con herramientas externas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableTools.length > 0 ? (
                  <div className="grid gap-4">
                    {availableTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <Checkbox
                          id={`tool-${tool.id}`}
                          checked={selectedToolIds.has(tool.id)}
                          onCheckedChange={() => handleToolToggle(tool)}
                          disabled={isConnecting === tool.id}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <label htmlFor={`tool-${tool.id}`} className="font-medium cursor-pointer">
                            {tool.name}
                          </label>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                        {isConnecting === tool.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Cargando herramientas disponibles...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <CardTitle>Base de conocimientos</CardTitle>
                  <CardDescription>Carga documentos para mejorar el conocimiento de tu agente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {knowledgeBases.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selecciona una base de conocimientos</Label>
                    <Select
                      value={creatingNewKB ? "new" : fileId || ""}
                      onValueChange={(value) => {
                        if (value === "new") {
                          setCreatingNewKB(true)
                          setFileId(null)
                        } else {
                          const kb = knowledgeBases.find((k) => k.id === value)
                          if (kb) {
                            setCreatingNewKB(false)
                            setFileId(kb.vapiId)
                            setKnowledgeBaseName(kb.name)
                          }
                        }
                        setHasChanges(true)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona o crea una base de conocimientos" />
                      </SelectTrigger>
                      <SelectContent>
                        {knowledgeBases.map((kb) => (
                          <SelectItem key={kb.id} value={kb.id}>
                            {kb.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">
                          <Plus className="w-4 h-4 mr-2" />
                          Crear nueva base de conocimientos
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {creatingNewKB && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Label htmlFor="knowledgeBaseName" className="text-sm font-medium">
                        Nombre de la base de conocimientos
                      </Label>
                      <Input
                        id="knowledgeBaseName"
                        placeholder="e.g., API Documentation"
                        value={knowledgeBaseName}
                        onChange={(e) => setKnowledgeBaseName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Cargar documento</Label>
                      <FileUploader
                        onUpload={handleUpload}
                        uploadAction={uploadDocument}
                        allowedFileTypes={["application/pdf"]}
                        customName="knowledge-base-file"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Template Dialog */}
      <TemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSelectTemplate={handleSelectTemplate}
        onStartBlank={handleStartBlank}
      />
    </div>
  )
}

export default VoiceAgentsClient
