"use client"

import * as React from "react"
import { Pause, Play, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface VoicePlayerProps {
  url: string
  onPlay?: () => void
  onPause?: () => void
  className?: string
}

export function VoicePlayer({ url, onPlay, onPause, className }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [volume, setVolume] = React.useState(80)
  const [progress, setProgress] = React.useState(0)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    audioRef.current = new Audio(url)
    audioRef.current.volume = volume / 100

    audioRef.current.addEventListener("ended", () => {
      setIsPlaying(false)
      setProgress(0)
      if (onPause) onPause()
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.remove()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [url, onPause])

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const togglePlayback = () => {
    if (isPlaying) {
      audioRef.current?.pause()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (onPause) onPause()
    } else {
      audioRef.current?.play()
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const duration = audioRef.current.duration || 1
          setProgress((audioRef.current.currentTime / duration) * 100)
        }
      }, 100)
      if (onPlay) onPlay()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0]
    setProgress(newProgress)
    if (audioRef.current) {
      const duration = audioRef.current.duration || 1
      audioRef.current.currentTime = (newProgress / 100) * duration
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={togglePlayback}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        <span className="sr-only">{isPlaying ? "Pause" : "Play"} voice sample</span>
      </Button>

      <div className="relative flex-1">
        <Slider
          value={[progress]}
          min={0}
          max={100}
          step={0.1}
          onValueChange={handleProgressChange}
          className="h-1.5"
        />
      </div>

      <div className="flex items-center gap-1.5 min-w-[80px]">
        <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
        <Slider
          value={[volume]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value) => setVolume(value[0])}
          className="h-1.5 w-16"
        />
      </div>
    </div>
  )
}
