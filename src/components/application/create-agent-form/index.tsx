"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Pause, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getElevenLabsVoices } from "@/actions/elevenlabs"
import { saveAgentDB } from "../../../actions/agents"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { LoadingSpinner } from "@/components/loading-spinner"

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  voice_id: z.string().min(1, {
    message: "Please select a voice for your agent.",
  }),
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  language: z.string().min(2, {
    message: "Please select a language.",
  }),
  type: z.string({
    message: "Please select a type agent"
  }),
  first_message: z.string().min(1, {
    message: "Please provide an initial message for the conversation."
  })
})

interface CreateAgentFormProps {
  onSubmit?: (values: z.infer<typeof formSchema>) => void
  first?: boolean
}

interface Voice {
  id: string
  name: string
  gender: string
  preview_url: string
  tags: string[]
}

interface VoiceCategory {
  id: string
  name: string
  voices: Voice[]
}

export function CreateAgentForm({ onSubmit: externalSubmit, first }: CreateAgentFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      voice_id: "",
      prompt: "",
      language: "en",
      type: "outbound",
      first_message: ""
    },
  })

  const [voiceCategories, setVoiceCategories] = React.useState<VoiceCategory[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const createAgentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      try {
        const response = await saveAgentDB(values)
        return response.data
      } catch (error: any) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] })
      toast.success("Agent created successfully!")
    },
    onError: (error: Error) => {
      toast.error(`Error creating agent: ${error.message}`)
    }
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      await createAgentMutation.mutateAsync(values)
      if (externalSubmit) {
        externalSubmit(values);
      }
    } catch (error) {
      console.error('Error creating agent:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePlayback = (voiceId: string, previewUrl: string) => {
    if (currentlyPlaying === voiceId) {
      audioRef.current?.pause()
      setCurrentlyPlaying(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(previewUrl)
      audioRef.current.play()
      audioRef.current.onended = () => setCurrentlyPlaying(null)
      setCurrentlyPlaying(voiceId)
    }
  }

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  React.useEffect(() => {
    const getDataVoices = async () => {
      const response = await getElevenLabsVoices()

      const groupedByCategory: Record<string, Voice[]> = {}

      response.voices.forEach((voice: any) => {
        const category = voice.category || "others"
        if (!groupedByCategory[category]) groupedByCategory[category] = []

        groupedByCategory[category].push({
          id: voice.voice_id,
          name: voice.name || "Unnamed",
          gender: voice.labels?.gender || "unknown",
          preview_url: voice.preview_url || "",
          tags: Object.values(voice.labels || {}),
        })
      })

      const formatted: VoiceCategory[] = Object.entries(groupedByCategory).map(([categoryId, voices]) => ({
        id: categoryId,
        name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
        voices,
      }))

      setVoiceCategories(formatted)
    }

    getDataVoices()
  }, [])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del agente</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del agente" {...field} />
              </FormControl>
              <FormDescription>Este es el nombre con el que tu agente será identificado.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="voice_id"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel>Selección de voz</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Tabs defaultValue={voiceCategories[0]?.id || ""} className="w-full">
                    <TabsList className="grid grid-cols-3 mb-4 overflow-x-auto">
                      {voiceCategories.map((category) => (
                        <TabsTrigger key={category.id} value={category.id}>
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {voiceCategories.map((category) => (
                      <TabsContent key={category.id} value={category.id} className="space-y-4">
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                        >
                          {category.voices.map((voice) => (
                            <div key={voice.id} className="relative">
                              <RadioGroupItem value={voice.id} id={voice.id} className="peer sr-only" />
                              <label
                                htmlFor={voice.id}
                                className="flex flex-col items-start gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <div className="flex w-full items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="font-semibold">{voice.name}</div>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                      {voice.gender}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => togglePlayback(voice.id, voice.preview_url)}
                                  >
                                    {currentlyPlaying === voice.id ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">
                                      {currentlyPlaying === voice.id ? "Pause" : "Play"} {voice.name} voice
                                    </span>
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {voice.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                {currentlyPlaying === voice.id && (
                                  <div className="mt-2 w-full">
                                    <div className="h-1 w-full animate-pulse rounded-full bg-primary"></div>
                                  </div>
                                )}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </FormControl>
              <FormDescription>Selecciona una voz para tu agente. Haz click en el botón de reproducir para escuchar una muestra.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idioma</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="en">English (en)</option>
                  <option value="zh">Chinese (zh)</option>
                  <option value="hi">Hindi (hi)</option>
                  <option value="es">Spanish (es)</option>
                  <option value="fr">French (fr)</option>
                  <option value="ar">Arabic (ar)</option>
                  <option value="bn">Bengali (bn)</option>
                  <option value="ru">Russian (ru)</option>
                  <option value="pt">Portuguese (pt)</option>
                  <option value="id">Indonesian (id)</option>
                  <option value="ur">Urdu (ur)</option>
                  <option value="de">German (de)</option>
                  <option value="ja">Japanese (ja)</option>
                  <option value="sw">Swahili (sw)</option>
                  <option value="mr">Marathi (mr)</option>
                  <option value="te">Telugu (te)</option>
                  <option value="tr">Turkish (tr)</option>
                  <option value="ta">Tamil (ta)</option>
                  <option value="ko">Korean (ko)</option>
                  <option value="vi">Vietnamese (vi)</option>
                  <option value="fa">Persian (fa)</option>
                  <option value="it">Italian (it)</option>
                  <option value="th">Thai (th)</option>
                  <option value="gu">Gujarati (gu)</option>
                  <option value="pl">Polish (pl)</option>
                  <option value="uk">Ukrainian (uk)</option>
                  <option value="ml">Malayalam (ml)</option>
                  <option value="kn">Kannada (kn)</option>
                  <option value="my">Burmese (my)</option>
                  <option value="nl">Dutch (nl)</option>
                  <option value="ro">Romanian (ro)</option>
                  <option value="el">Greek (el)</option>
                  <option value="hu">Hungarian (hu)</option>
                  <option value="cs">Czech (cs)</option>
                  <option value="sv">Swedish (sv)</option>
                  <option value="he">Hebrew (he)</option>
                  <option value="fi">Finnish (fi)</option>
                  <option value="da">Danish (da)</option>
                  <option value="no">Norwegian (no)</option>
                </select>
              </FormControl>
              <FormDescription>Selecciona el idioma para tu agente.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de agente</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="inbound">Entrante</option>
                  <option value="outbound">Saliente</option>
                </select>
              </FormControl>
              <FormDescription>
                Selecciona el tipo de agente. Los agentes entrantes solo pueden recibir llamadas, mientras que los agentes salientes pueden hacer llamadas a cualquier número.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instrucciones del agente (Prompt)</FormLabel>
              <FormControl>
                <Textarea placeholder="Instrucciones para tu agente..." className="min-h-32 resize-y" {...field} />
              </FormControl>
              <FormDescription>
                Proporciona instrucciones detalladas para definir el comportamiento y las respuestas de tu agente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="first_message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensaje inicial</FormLabel>
              <FormControl>
                <Textarea placeholder="Mensaje inicial..." className="min-h-20 resize-y" {...field} />
              </FormControl>
              <FormDescription>
                Este es el primer mensaje que el agente usará para iniciar la conversación.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {loading ? <LoadingSpinner variant="ghost"/> : (
            <p>Crear agente</p>
          )}
        </Button>
      </form>
    </Form>
  )
}
