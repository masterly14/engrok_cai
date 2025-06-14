"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  Pause,
  Phone,
  Clock,
  DollarSign,
  MessageSquare,
  User,
  Bot,
  Volume2,
  FileText,
  BarChart3,
  CheckCircle,
  XCircle,
  PhoneCall,
} from "lucide-react"

interface DatosLlamada {
  id: string
  type: string
  startedAt: string
  endedAt: string
  transcript: string
  recordingUrl: string
  summary: string
  cost: number
  status: string
  endedReason: string
  costBreakdown: {
    stt: number
    llm: number
    tts: number
    vapi: number
    total: number
    llmPromptTokens: number
    llmCompletionTokens: number
    ttsCharacters: number
  }
  analysis: {
    summary: string
    successEvaluation: string
  }
  messages: Array<{
    role: string
    message: string
    time: number
    secondsFromStart: number
    duration?: number
  }>
}

interface HistorialLlamadasProps {
  datosLlamada: DatosLlamada
}

export default function CallHistory({ datosLlamada }: HistorialLlamadasProps) {
  const [reproduciendo, setReproduciendo] = useState(false)
  const [audioActual, setAudioActual] = useState<HTMLAudioElement | null>(null)
  const [progreso, setProgreso] = useState(0)
  const [duracionTotal, setDuracionTotal] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const formatearFecha = (fechaString: string) => {
    return new Date(fechaString).toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatearDuracion = (tiempoInicio: string, tiempoFin: string) => {
    const inicio = new Date(tiempoInicio)
    const fin = new Date(tiempoFin)
    const duracionMs = fin.getTime() - inicio.getTime()
    const segundos = Math.floor(duracionMs / 1000)
    const minutos = Math.floor(segundos / 60)
    const segundosRestantes = segundos % 60
    return `${minutos}:${segundosRestantes.toString().padStart(2, "0")}`
  }

  const formatearTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60)
    const secs = Math.floor(segundos % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (audioActual) {
      const actualizarProgreso = () => {
        if (audioActual.duration) {
          setProgreso((audioActual.currentTime / audioActual.duration) * 100)
        }
      }

      const manejarCargado = () => {
        setDuracionTotal(audioActual.duration)
      }

      audioActual.addEventListener("timeupdate", actualizarProgreso)
      audioActual.addEventListener("loadedmetadata", manejarCargado)

      return () => {
        audioActual.removeEventListener("timeupdate", actualizarProgreso)
        audioActual.removeEventListener("loadedmetadata", manejarCargado)
      }
    }
  }, [audioActual])

  const manejarReproduccion = () => {
    if (audioActual) {
      if (reproduciendo) {
        audioActual.pause()
        setReproduciendo(false)
      } else {
        audioActual.play()
        setReproduciendo(true)
      }
    } else {
      const audio = new Audio(datosLlamada.recordingUrl)
      audio.addEventListener("ended", () => {
        setReproduciendo(false)
        setProgreso(0)
      })
      audio.addEventListener("error", () => {
        setReproduciendo(false)
        setProgreso(0)
      })
      setAudioActual(audio)
      audio.play()
      setReproduciendo(true)
    }
  }

  const obtenerColorEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "ended":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const analizarTranscripcion = (transcripcion: string) => {
    return transcripcion
      .split("\n")
      .filter((linea) => linea.trim())
      .map((linea) => {
        const [hablante, ...partesMensaje] = linea.split(": ")
        return {
          hablante: hablante.trim(),
          mensaje: partesMensaje.join(": ").trim(),
        }
      })
  }

  const mensajesConversacion = datosLlamada.messages.filter((msg) => msg.role !== "system")
  const esExitosa = datosLlamada.analysis.successEvaluation === "true"

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Encabezado Principal */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <PhoneCall className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Historial de Llamada</h1>
              <p className="text-gray-600">Análisis detallado de la conversación</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={obtenerColorEstado(datosLlamada.status)} variant="outline">
              {datosLlamada.status === "ended" ? "Finalizada" : datosLlamada.status}
            </Badge>
            {esExitosa ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Duración</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatearDuracion(datosLlamada.startedAt, datosLlamada.endedAt)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Costo Total</p>
                  <p className="text-2xl font-bold text-gray-900">${datosLlamada.cost.toFixed(4)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mensajes</p>
                  <p className="text-2xl font-bold text-gray-900">{mensajesConversacion.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Evaluación</p>
                  <p className="text-2xl font-bold text-gray-900">{esExitosa ? "Exitosa" : "Fallida"}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Layout Principal en Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda - Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reproductor de Audio */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Volume2 className="h-5 w-5" />
                Reproducir Grabación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={manejarReproduccion} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  {reproduciendo ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {reproduciendo ? "Pausar" : "Reproducir"}
                </Button>
                <div className="flex-1">
                  <Progress value={progreso} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatearTiempo((progreso / 100) * duracionTotal)}</span>
                    <span>{formatearTiempo(duracionTotal)}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-blue-700">
                <p>
                  <strong>Iniciada:</strong> {formatearFecha(datosLlamada.startedAt)}
                </p>
                <p>
                  <strong>Finalizada:</strong> {formatearFecha(datosLlamada.endedAt)}
                </p>
                <p>
                  <strong>Razón de finalización:</strong>{" "}
                  {datosLlamada.endedReason
                    .replace("-", " ")
                    .replace("customer", "cliente")
                    .replace("ended", "finalizó")
                    .replace("call", "llamada")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pestañas de Contenido */}
          <Tabs defaultValue="resumen" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resumen" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="transcripcion" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Transcripción
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de la Llamada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{datosLlamada.summary}</p>
                  </div>
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Análisis Automático</h4>
                    <p className="text-gray-700">{datosLlamada.analysis.summary}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transcripcion" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transcripción Completa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analizarTranscripcion(datosLlamada.transcript).map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${
                          item.hablante === "AI" ? "bg-blue-50 border-l-blue-500" : "bg-green-50 border-l-green-500"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {item.hablante === "AI" ? (
                            <Bot className="h-4 w-4 text-blue-600" />
                          ) : (
                            <User className="h-4 w-4 text-green-600" />
                          )}
                          <Badge
                            variant="outline"
                            className={
                              item.hablante === "AI"
                                ? "border-blue-300 text-blue-700"
                                : "border-green-300 text-green-700"
                            }
                          >
                            {item.hablante === "AI" ? "Asistente IA" : "Usuario"}
                          </Badge>
                        </div>
                        <p className="text-gray-800">{item.mensaje}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline Detallado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mensajesConversacion.map((mensaje, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`p-2 rounded-full ${mensaje.role === "bot" ? "bg-blue-100" : "bg-green-100"}`}
                          >
                            {mensaje.role === "bot" ? (
                              <Bot className="h-4 w-4 text-blue-600" />
                            ) : (
                              <User className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          {index < mensajesConversacion.length - 1 && (
                            <div className="w-px h-16 bg-gray-300 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {mensaje.role === "bot" ? "Asistente IA" : "Usuario"}
                            </Badge>
                            <span className="text-xs text-gray-500">{mensaje.secondsFromStart.toFixed(1)}s</span>
                            {mensaje.duration && (
                              <span className="text-xs text-gray-400">
                                (duración: {(mensaje.duration / 1000).toFixed(1)}s)
                              </span>
                            )}
                          </div>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{mensaje.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Columna Derecha - Información Adicional */}
        <div className="space-y-6">
          {/* Información de la Llamada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Detalles de la Llamada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">ID de Llamada</p>
                <p className="text-sm text-gray-900 font-mono">{datosLlamada.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tipo</p>
                <p className="text-sm text-gray-900">{datosLlamada.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Estado</p>
                <Badge className={obtenerColorEstado(datosLlamada.status)} variant="outline">
                  {datosLlamada.status === "ended" ? "Finalizada" : datosLlamada.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Desglose de Costos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Desglose de Costos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transcripción (STT)</span>
                  <span className="font-medium">${datosLlamada.costBreakdown.stt.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Modelo de IA (LLM)</span>
                  <span className="font-medium">${datosLlamada.costBreakdown.llm.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Síntesis de Voz (TTS)</span>
                  <span className="font-medium">${datosLlamada.costBreakdown.tts.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Plataforma VAPI</span>
                  <span className="font-medium">${datosLlamada.costBreakdown.vapi.toFixed(4)}</span>
                </div>
                <hr />
                <div className="flex justify-between items-center font-semibold">
                  <span>Total</span>
                  <span className="text-lg">${datosLlamada.costBreakdown.total.toFixed(4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas de Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tokens de Entrada</span>
                  <span>{datosLlamada.costBreakdown.llmPromptTokens}</span>
                </div>
                <Progress
                  value={
                    (datosLlamada.costBreakdown.llmPromptTokens /
                      (datosLlamada.costBreakdown.llmPromptTokens + datosLlamada.costBreakdown.llmCompletionTokens)) *
                    100
                  }
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tokens de Salida</span>
                  <span>{datosLlamada.costBreakdown.llmCompletionTokens}</span>
                </div>
                <Progress
                  value={
                    (datosLlamada.costBreakdown.llmCompletionTokens /
                      (datosLlamada.costBreakdown.llmPromptTokens + datosLlamada.costBreakdown.llmCompletionTokens)) *
                    100
                  }
                  className="h-2"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Caracteres TTS</p>
                <p className="font-medium">{datosLlamada.costBreakdown.ttsCharacters}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
