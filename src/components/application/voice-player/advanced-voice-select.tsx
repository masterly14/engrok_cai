"use client"

import * as React from "react"
import { Check, ChevronDown, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { VoicePlayer } from "."

interface Voice {
  id: string
  name: string
  gender: string
  preview_url: string
  tags: string[]
}

interface AdvancedVoiceSelectorProps {
  voices: Voice[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function AdvancedVoiceSelector({ voices, value, onValueChange, className }: AdvancedVoiceSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [playingVoice, setPlayingVoice] = React.useState<string | null>(null)

  const selectedVoice = voices.find((voice) => voice.id === value)

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selectedVoice ? selectedVoice.name : "Select a voice..."}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search voices..." className="h-9" />
            <CommandList>
              <CommandEmpty>No voices found.</CommandEmpty>
              <CommandGroup>
                {voices.map((voice) => (
                  <CommandItem
                    key={voice.id}
                    value={voice.name}
                    onSelect={() => {
                      onValueChange(voice.id)
                      setOpen(false)
                    }}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex flex-col">
                      <span>{voice.name}</span>
                      <span className="text-xs text-muted-foreground">{voice.gender}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPlayingVoice(playingVoice === voice.id ? null : voice.id)
                        }}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </Button>
                      {value === voice.id && <Check className="h-4 w-4" />}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedVoice && (
        <div className="rounded-md border p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-medium">{selectedVoice.name}</div>
              <div className="text-sm text-muted-foreground">{selectedVoice.gender}</div>
            </div>
            <div className="flex gap-1">
              {selectedVoice.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <VoicePlayer
            url={selectedVoice.preview_url}
            onPlay={() => setPlayingVoice(selectedVoice.id)}
            onPause={() => setPlayingVoice(null)}
          />
        </div>
      )}
    </div>
  )
}
