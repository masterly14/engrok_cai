"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Check, ChevronsUpDown, Pause, Play, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getElevenLabsVoices } from "@/actions/elevenlabs";
import { saveAgentDB } from "../../../actions/agents";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/loading-spinner";
import { knowledgeBase } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { FileUploadComponent } from "../agents/file-upload";
import { getKnowledgeBases } from "@/actions/knowledge-base";

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
  first_message: z.string().min(1, {
    message: "Please provide an initial message for the conversation.",
  }),
});

interface CreateAgentFormProps {
  onSubmit?: (values: z.infer<typeof formSchema>) => void;
  first?: boolean;
}

interface Voice {
  id: string;
  name: string;
  gender: string;
  preview_url: string;
  tags: string[];
}

interface VoiceCategory {
  id: string;
  name: string;
  voices: Voice[];
}

interface UploadResult {
  success: boolean;
  message: string;
  data?: any;
  id?: string;
}

export function CreateNewWidgetForm({
  onSubmit: externalSubmit,
  first,
}: CreateAgentFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      voice_id: "",
      prompt: "",
      language: "en",
      first_message: "",
    },
  });

  const [voiceCategories, setVoiceCategories] = React.useState<VoiceCategory[]>(
    []
  );
  const [currentlyPlaying, setCurrentlyPlaying] = React.useState<string | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [uploadResult, setUploadResult] = React.useState<UploadResult | null>(
    null
  );
  const [knowledgeBases, setKnowledgeBases] = React.useState<knowledgeBase[]>(
    []
  );
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] =
    React.useState<string>("");
  const [showNewKnowledgeBase, setShowNewKnowledgeBase] =
    React.useState<boolean>(false);

  const [open, setOpen] = React.useState(false);
  const handleUploadSuccess = (result: UploadResult) => {
    console.log("Result from FileUploadComponent:", result);
    setUploadResult(result);
    setShowNewKnowledgeBase(false);
  };
  const createAgentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      try {
        const response = await saveAgentDB(values, true);
        return response.data;
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent created successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Error creating agent: ${error.message}`);
    },
  });

  const handleSelect = (value: string) => {
    setSelectedKnowledgeBase(value);
    setShowNewKnowledgeBase(value === "new");
    setOpen(false);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await createAgentMutation.mutateAsync(values);
      if (externalSubmit) {
        externalSubmit(values);
      }
    } catch (error) {
      console.error("Error creating agent:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = (voiceId: string, previewUrl: string) => {
    if (currentlyPlaying === voiceId) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(previewUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setCurrentlyPlaying(null);
      setCurrentlyPlaying(voiceId);
    }
  };

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    const getDataVoices = async () => {
      const response = await getElevenLabsVoices();

      const groupedByCategory: Record<string, Voice[]> = {};

      response.voices.forEach((voice: any) => {
        const category = voice.category || "others";
        if (!groupedByCategory[category]) groupedByCategory[category] = [];

        groupedByCategory[category].push({
          id: voice.voice_id,
          name: voice.name || "Unnamed",
          gender: voice.labels?.gender || "unknown",
          preview_url: voice.preview_url || "",
          tags: Object.values(voice.labels || {}),
        });
      });

      const formatted: VoiceCategory[] = Object.entries(groupedByCategory).map(
        ([categoryId, voices]) => ({
          id: categoryId,
          name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          voices,
        })
      );

      setVoiceCategories(formatted);
    };

    getDataVoices();
  }, []);

  React.useEffect(() => {
    const fetchKnowledgeBases = async () => {
      const response = await getKnowledgeBases();
      if (response.status === 200) {
        setKnowledgeBases(response.data);
      }
    };
    fetchKnowledgeBases();
  }, []);

  return (
    <Form {...form}>
      <div className="flex items-center gap-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[300px] justify-between"
            >
              {selectedKnowledgeBase
                ? selectedKnowledgeBase === "new"
                  ? "Create new knowledge base"
                  : knowledgeBases.find((kb) => kb.id === selectedKnowledgeBase)
                      ?.name || "Select a knowledge base"
                : "Select a knowledge base"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search knowledge base..." />
              <CommandList>
                <CommandEmpty>No knowledge base found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => handleSelect("new")}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Create new knowledge base
                    {selectedKnowledgeBase === "new" && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                </CommandGroup>
                {knowledgeBases.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Knowledge Bases">
                      {knowledgeBases.map((kb) => (
                        <CommandItem
                          key={kb.id}
                          value={kb.id}
                          onSelect={() => handleSelect(kb.id)}
                        >
                          {kb.name}
                          {selectedKnowledgeBase === kb.id && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {showNewKnowledgeBase && (
        <div className="space-y-4">
          <FileUploadComponent onSubmitSuccess={handleUploadSuccess} />
        </div>
      )}
      {
        uploadResult != null || knowledgeBases != null && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="mt-5">
              <FormLabel>Widget agent name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormDescription>
                This is how your agent will be identified.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="voice_id"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel>Voice Selection</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Tabs
                    defaultValue={voiceCategories[0]?.id || ""}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-3 mb-4 overflow-x-auto">
                      {voiceCategories.map((category) => (
                        <TabsTrigger key={category.id} value={category.id}>
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {voiceCategories.map((category) => (
                      <TabsContent
                        key={category.id}
                        value={category.id}
                        className="space-y-4"
                      >
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                        >
                          {category.voices.map((voice) => (
                            <div key={voice.id} className="relative">
                              <RadioGroupItem
                                value={voice.id}
                                id={voice.id}
                                className="peer sr-only"
                              />
                              <label
                                htmlFor={voice.id}
                                className="flex flex-col items-start gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <div className="flex w-full items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="font-semibold">
                                      {voice.name}
                                    </div>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                      {voice.gender}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() =>
                                      togglePlayback(
                                        voice.id,
                                        voice.preview_url
                                      )
                                    }
                                  >
                                    {currentlyPlaying === voice.id ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">
                                      {currentlyPlaying === voice.id
                                        ? "Pause"
                                        : "Play"}{" "}
                                      {voice.name} voice
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
              <FormDescription>
                Select a voice for your agent. Click the play button to preview.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
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
              <FormDescription>
                Select the language for your agent.
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
              <FormLabel>Agent Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter instructions for your agent..."
                  className="min-h-32 resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide detailed instructions to define your agent's behavior
                and responses.
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
              <FormLabel>Initial Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the initial message that will start the conversation..."
                  className="min-h-20 resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This is the first message that the agent will use to start the
                conversation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {loading ? <LoadingSpinner variant="ghost" /> : <p>Create Widget</p>}
        </Button>
      </form>
        )
      }
    </Form>
  );
}
