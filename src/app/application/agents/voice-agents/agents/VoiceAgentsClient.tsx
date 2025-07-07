"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Plus, RotateCcw, Loader2, Play, Pause, Volume2, FileText } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { generatePrompt } from "@/actions/claude"
import { getElevenLabsVoices } from "@/actions/elevenlabs"
import type { ElevenLabsVoice } from "@/types/agent"
import { AgentProvider, useAgent, AgentWithTools } from "@/context/agent-context"
import { toast } from "sonner"
import { useCreateAgent, usePublishAgent, PublishAgentInput } from "@/hooks/use-create-agent"
import { TemplateDialog, type Template } from "./_components/template-dialog"
import DeleteAgent from "./_components/delete-agent"
import StartCall from "./_components/start-call"
import { Checkbox } from "@/components/ui/checkbox"
import { getAllTools } from "@/actions/tools"
import { Tool } from "@prisma/client"
import { useUser } from "@clerk/nextjs"
import { ConnectionExists, createConnection, getSessionToken } from "@/actions/nango"
import Nango from "@nangohq/frontend"

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
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const { user } = useUser()

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
      // Only set fileId if knowledgeBaseId exists
      if ('knowledgeBaseId' in selectedAgent) {
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

  // Función para abrir el diálogo de plantillas
  const openTemplateDialog = () => {
    setShowTemplateDialog(true)
  }

  // Exponer la función para que el sidebar pueda usarla
  useEffect(() => {
    // @ts-ignore - Agregar la función al objeto window para que el sidebar pueda acceder a ella
    window.openVoiceAgentTemplateDialog = openTemplateDialog
  }, [])

  const handleSelectTemplate = (template: Template) => {
    setFormData({
      ...formData,
      ...template.formData
    })
    // Asegurarse de que estamos en modo creación si no hay agente seleccionado
    if (!selectedAgent) {
      setIsCreatingNew(true)
    }
    toast.success(`Plantilla "${template.name}" aplicada`)
  }

  const handleStartBlank = () => {
    // Asegurarse de que estamos en modo creación si no hay agente seleccionado
    if (!selectedAgent) {
      setIsCreatingNew(true)
    }
    // No need to do anything else, just close the dialog
    toast.info("Creando agente desde cero")
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    })
    setHasChanges(true)
  }

  const handleGeneratePrompt = async () => {
    try {
      setIsGenerating(true)
      const generatedPrompt = await generatePrompt(purposeInput)
      handleInputChange("prompt", generatedPrompt.toString())
      setAiPromptGenerated(true)
    } catch (error) {
      console.error("Error generating prompt:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    // Validación completa de todos los campos requeridos
    const missingFields = []
    
    if (!formData.name.trim()) {
      missingFields.push("Nombre del agente")
    }
    
    if (!formData.firstMessage.trim()) {
      missingFields.push("Primer mensaje")
    }
    
    if (!formData.prompt.trim()) {
      missingFields.push("Prompt del sistema")
    }
    
    if (!formData.voiceId) {
      missingFields.push("Voz")
    }
    
    // Si hay campos faltantes, mostrar toast con detalles
    if (missingFields.length > 0) {
      const fieldsText = missingFields.join(", ")
      toast.error(`Por favor completa los siguientes campos: ${fieldsText}`)
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

        // Limpiar formulario y estados locales
        resetForm()
        setFileId(null)
        setIsCreatingNew(false)
      } catch (error) {
        console.error("Error creating agent:", error)
      }
    } else {
      console.log("Updating existing agent:", selectedAgent?.id)
      // Aquí iría la lógica de actualización cuando esté disponible
    }
  }

  const handlePublish = async () => {
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
      console.error("Error publishing agent:", error)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleVoicePreview = async (voiceId: string, previewUrl: string) => {
    if (playingVoice === voiceId) {
      // Si ya está reproduciendo esta voz, pausar
      if (audioRef.current) {
        audioRef.current.pause()
        setPlayingVoice(null)
      }
      return
    }

    // Pausar cualquier audio anterior
    if (audioRef.current) {
      audioRef.current.pause()
    }

    // Crear nuevo audio y reproducir
    const audio = new Audio(previewUrl)
    audioRef.current = audio
    setPlayingVoice(voiceId)

    audio.onended = () => {
      setPlayingVoice(null)
    }

    audio.onerror = () => {
      setPlayingVoice(null)
      console.error("Error playing voice preview")
    }

    try {
      await audio.play()
    } catch (error) {
      setPlayingVoice(null)
      console.error("Error playing voice preview:", error)
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
      } finally {
        setLoadingVoices(false)
      }
    }
    fetchElevenLabsVoices()
  }, [])

  // Cleanup audio on unmount
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

  // Efecto para cargar las herramientas disponibles en la plataforma
  useEffect(() => {
    const fetchTools = async () => {
      const tools = await getAllTools()
      setAvailableTools(tools)
    }
    fetchTools()
  }, [])

  // Efecto para actualizar las herramientas seleccionadas cuando cambia el agente
  useEffect(() => {
    if (selectedAgent?.tools) {
      setSelectedToolIds(new Set(selectedAgent.tools.map((t: Tool) => t.id)))
    } else {
      setSelectedToolIds(new Set())
    }
  }, [selectedAgent])

  const handleToolToggle = async (tool: Tool) => {
    if (!user) {
      toast.error("Por favor, inicia sesión para gestionar las herramientas.")
      return
    }

    const newSet = new Set(selectedToolIds)

    if (newSet.has(tool.id)) {
      // Disabling tool
      newSet.delete(tool.id)
      setSelectedToolIds(newSet)
      setHasChanges(true)
    } else {
      // Enabling tool
      // @ts-ignore - Assuming tool has a provider property after schema migration
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
          toast.info(`Conecta tu cuenta de ${provider} para usar esta herramienta.`)

          const sessionData = await getSessionToken(user.id)
          const sessionToken = typeof sessionData === "string" ? sessionData : sessionData?.token
          if (!sessionToken) throw new Error("Could not get session token")

          const nango = new Nango({ connectSessionToken: sessionToken })

          const result = await nango.auth(provider)

          if (result?.connectionId) {
            await createConnection({
              integrationId: result.connectionId,
              providerConfigKey: provider,
              authMode: "OAUTH2", // Assuming OAuth2, might need adjustment
              endUserId: user.id,
            })

            newSet.add(tool.id)
            setSelectedToolIds(newSet)
            setHasChanges(true)
            toast.success(`¡Conexión con ${provider} exitosa!`)
          } else {
            throw new Error("Nango connection failed.")
          }
        }
      } catch (error) {
        console.error("Error handling tool toggle:", error)
        toast.error(`No se pudo conectar con ${provider}. Inténtalo de nuevo.`)
      } finally {
        setIsConnecting(null)
      }
    }
  }

  return (
    <div className="flex-1 p-6 overflow-auto overflow-x-hidden">
      {/* Mostrar mensaje si no hay agente seleccionado y no se está creando uno nuevo */}
      {!selectedAgent && !isCreatingNew ? (
        <div className="max-w-4xl mx-auto">
          <Card className="mt-20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold text-muted-foreground">
                  No hay agente seleccionado
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Selecciona un agente de la lista lateral para editarlo o crea uno nuevo para comenzar
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {isCreatingNew ? "Crear nuevo agente" : `Editando: ${selectedAgent?.name}`}
              </h1>
              <p className="text-muted-foreground">
                {isCreatingNew ? "Configura tu nuevo agente de voz" : "Modifica la configuración de tu agente"}
              </p>
            </div>

            <div className="flex gap-2">
              {isCreatingNew && (
                <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Usar plantilla
                </Button>
              )}
              
              {hasChanges && !isCreatingNew && (
                <Button variant="outline" onClick={resetForm}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Descartar cambios
                </Button>
              )}

              {hasChanges && !isCreatingNew ? (
                <Button onClick={handlePublish}>
                  <Save className="h-4 w-4 mr-2" />
                  {isPublishing ? "Publicando..." : "Publicar cambios"}
                </Button>
              ) : isCreatingNew ? (
                <Button onClick={handleSave}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear agente
                </Button>
              ) : null}
            </div>

            {selectedAgent && (
              <div className="flex gap-2 items-center">
                <StartCall vapiId={selectedAgent.vapiId!} />
                <DeleteAgent agentId={selectedAgent.id} vapiId={selectedAgent.vapiId!} onSuccess={handleDeleteSuccess}/>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="grid gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información básica</CardTitle>
                <CardDescription>Configura la información principal de tu agente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del agente</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Asistente de ventas"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstMessage">Primer mensaje</Label>
                  <Textarea
                    id="firstMessage"
                    placeholder="Ej: ¡Hola! Soy tu asistente de ventas. ¿En qué puedo ayudarte hoy?"
                    value={formData.firstMessage}
                    onChange={(e) => handleInputChange("firstMessage", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de IA</CardTitle>
                <CardDescription>Define el comportamiento y personalidad de tu agente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 ">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt">Prompt del sistema</Label>
                    <Popover>
                      <PopoverTrigger>
                        <Button
                          className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border border-purple-500/30  hover:border-purple-400/50 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 text-white text-xs"
                          size="sm"
                        >
                          Crear prompt con AI
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto gap-2">
                        <Label className="mb-2 text-sm">Describe el propósito de tu agente</Label>
                        <Input
                          type="text"
                          placeholder="Ej: Este asistente cualifica leads para un equipo de ventas"
                          value={purposeInput}
                          onChange={(e) => setPurposeInput(e.target.value)}
                        />
                        <Button
                          className="w-full mt-3"
                          variant="outline"
                          size="sm"
                          onClick={handleGeneratePrompt}
                          disabled={isGenerating || !purposeInput.trim()}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            "Generar prompt"
                          )}
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Textarea
                    id="prompt"
                    placeholder="Ej: Eres un asistente de ventas amigable y profesional..."
                    value={formData.prompt}
                    onChange={(e) => handleInputChange("prompt", e.target.value)}
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Voice & Audio */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de voz y audio</CardTitle>
                <CardDescription>Personaliza la voz y sonidos de tu agente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voiceId">Voz</Label>
                  {loadingVoices ? (
                    <div className="flex items-center justify-center h-10 border rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Cargando voces...</span>
                    </div>
                  ) : (
                    <Select value={formData.voiceId} onValueChange={(value) => handleInputChange("voiceId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una voz" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[80vh] w-[500px]">
                        <div className="p-2 space-y-4">
                          <Input
                            placeholder="Buscar voces..."
                            value={voiceFilter}
                            onChange={(e) => setVoiceFilter(e.target.value)}
                            className="mb-2"
                          />

                          <div className="flex gap-2 flex-wrap">
                            {Object.entries(uniqueFilters)
                              .reverse()
                              .map(([filterType, values]) => (
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
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder={`Filtrar por ${filterType}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {values.filter(Boolean).map((value) => (
                                      <SelectItem key={value} value={value || "unknown"}>
                                        {value || "Unknown"}
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
                                className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                                  formData.voiceId === voice.voice_id ? "bg-muted" : ""
                                }`}
                                onClick={() => handleInputChange("voiceId", voice.voice_id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">{voice.name}</span>
                                    <div className="flex gap-1 mt-1">
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
                                      <p className="text-xs text-muted-foreground mt-1">{voice.description}</p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleVoicePreview(voice.voice_id, voice.preview_url)
                                    }}
                                  >
                                    {playingVoice === voice.voice_id ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
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

                  {/* Voice Preview Section */}
                  {formData.voiceId && getSelectedVoice() && (
                    <div className="mt-3 p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{getSelectedVoice()?.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{getSelectedVoice()?.description}</p>
                          <div className="flex gap-1 mt-2">
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
                          <Volume2 className="h-4 w-4 mr-2" />
                          {playingVoice === formData.voiceId ? "Pausar" : "Escuchar"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundSound">Sonido de fondo</Label>
                  <Select
                    value={formData.backgroundSound}
                    onValueChange={(value) => handleInputChange("backgroundSound", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un sonido de fondo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Sin sonido</SelectItem>
                      <SelectItem value="office">Oficina (Recomendado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tools Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Herramientas</CardTitle>
                    <CardDescription>
                      Expande las capacidades de tu agente conectando herramientas externas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {availableTools.length > 0 ? (
                        availableTools.map((tool) => (
                          <div key={tool.id} className="flex items-start space-x-3">
                            <Checkbox
                              id={`tool-${tool.id}`}
                              checked={selectedToolIds.has(tool.id)}
                              onCheckedChange={() => handleToolToggle(tool)}
                              disabled={isConnecting === tool.id}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={`tool-${tool.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {tool.name}
                              </label>
                              <p className="text-sm text-muted-foreground">
                                {tool.description}
                              </p>
                            </div>
                            {isConnecting === tool.id && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Cargando herramientas...</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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
