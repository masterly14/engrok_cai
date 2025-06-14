"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import CallHistory from "./call-history"
import CallsTable from "./calls-table"
import { getCall } from "@/actions/vapi/calls"
import { LoadingSpinner } from "@/components/loading-spinner"

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

interface GestorLlamadasProps {
  llamadas: DatosLlamada[]
  loading: boolean
}

export default function GestorLlamadas({ llamadas, loading }: GestorLlamadasProps) {

  const [llamadaSeleccionada, setLlamadaSeleccionada] = useState<DatosLlamada | null>(null)

  const manejarSeleccionLlamada = async (llamada: DatosLlamada) => {
    const call = await getCall(llamada.id)
    setLlamadaSeleccionada(llamada)
  }

  const volverATabla = () => {
    setLlamadaSeleccionada(null)
  }

  if (llamadaSeleccionada) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Button onClick={volverATabla} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al listado
            </Button>
          </div>
        </div>
        <CallHistory datosLlamada={llamadaSeleccionada} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {loading ? <LoadingSpinner /> : <CallsTable llamadas={llamadas} onSeleccionarLlamada={manejarSeleccionLlamada} />}
    </div>
  )
}
