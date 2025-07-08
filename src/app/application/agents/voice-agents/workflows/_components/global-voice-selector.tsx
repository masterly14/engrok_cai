"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getElevenLabsVoices } from "@/actions/elevenlabs"
import type { ElevenLabsVoice } from "@/types/agent"
import { useEffect, useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { VapiVoice } from "../types"
import { Loader2, Play, Pause } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface GlobalVoiceSelectorProps {
  globalVoice: VapiVoice
  setGlobalVoice: (voice: VapiVoice) => void
}

export function GlobalVoiceSelector({ globalVoice, setGlobalVoice }: GlobalVoiceSelectorProps) {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [loadingVoices, setLoadingVoices] = useState<boolean>(false)
  const [voiceFilter, setVoiceFilter] = useState<string>("")
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoadingVoices(true)
        const voicesData = await getElevenLabsVoices()
        if (voicesData?.voices) {
          setVoices(voicesData.voices as ElevenLabsVoice[])
        }
      } catch (error) {
        console.error("Error fetching ElevenLabs voices:", error)
      } finally {
        setLoadingVoices(false)
      }
    }
    fetchVoices()
  }, [])

  const filteredVoices = voices.filter((voice) => {
    return (
      voice.name.toLowerCase().includes(voiceFilter.toLowerCase()) ||
      voice.description?.toLowerCase().includes(voiceFilter.toLowerCase())
    )
  })

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
    audio.onended = () => setPlayingVoice(null)
    audio.onerror = () => setPlayingVoice(null)
    try {
      await audio.play()
    } catch (error) {
      setPlayingVoice(null)
      console.error("Error playing voice preview:", error)
    }
  }

  const selectedVoiceName =
    voices.find((v) => v.voice_id === globalVoice.voiceId)?.name || globalVoice.voiceId

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Voz Global (ElevenLabs)</Label>
      {loadingVoices ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando voces...
        </div>
      ) : (
        <Select
          value={globalVoice?.voiceId || ""}
          onValueChange={(value) => setGlobalVoice({ provider: "11labs", voiceId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una voz global">
              {selectedVoiceName}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[80vh] w-[500px]">
            <div className="p-2 space-y-4">
              <Input
                placeholder="Buscar voces..."
                value={voiceFilter}
                onChange={(e) => setVoiceFilter(e.target.value)}
                className="mb-2"
              />

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredVoices.map((voice) => (
                  <div
                    key={voice.voice_id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      globalVoice?.voiceId === voice.voice_id ? "bg-muted" : ""
                    }`}
                    onClick={() =>
                      setGlobalVoice({
                        provider: "11labs",
                        voiceId: voice.voice_id,
                      })
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{voice.name}</span>
                        {voice.description && (
                          <p className="text-xs text-muted-foreground mt-1">{voice.description}</p>
                        )}
                      </div>
                      {voice.preview_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
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
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SelectContent>
        </Select>
      )}
    </div>
  )
} 