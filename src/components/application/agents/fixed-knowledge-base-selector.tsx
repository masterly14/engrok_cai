"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface KnowledgeBase {
  id: string
  name: string
  elevenLabsId?: string
}

interface KnowledgeBaseSelectorProps {
  knowledgeBases: KnowledgeBase[]
  selectedKnowledgeBase: string
  onSelect: (value: string) => void
}

export function KnowledgeBaseSelector({ knowledgeBases, selectedKnowledgeBase, onSelect }: KnowledgeBaseSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[300px] justify-between">
          {selectedKnowledgeBase
            ? selectedKnowledgeBase === "new"
              ? "Create new knowledge base"
              : knowledgeBases.find((kb) => kb.id === selectedKnowledgeBase)?.name || "Select a knowledge base"
            : "Select a knowledge base"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search knowledge base..." />
          <CommandList>
            <CommandEmpty>No se encontraron bases de conocimiento.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                key="new"
                value="new"
                onSelect={() => {
                  onSelect("new")
                  setOpen(false)
                }}
                className="flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Crear nueva base de conocimiento
                {selectedKnowledgeBase === "new" && <Check className="ml-auto h-4 w-4" />}
              </CommandItem>
            </CommandGroup>
            {knowledgeBases.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Bases de conocimiento">
                  {knowledgeBases.map((kb) => (
                    <CommandItem
                      key={kb.id}
                      value={kb.id}
                      onSelect={() => {
                        onSelect(kb.id)
                        setOpen(false)
                      }}
                    >
                      {kb.name}
                      {selectedKnowledgeBase === kb.id && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
