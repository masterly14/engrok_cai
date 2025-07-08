import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllAgents } from "@/hooks/use-all-agents";
import { VariableManagement } from "./variable-management";
import type { NodeConfigurationProps } from "./types";
import type { ConversationNodeData, Variable } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Loader2, Globe } from "lucide-react";
import { getElevenLabsVoices } from "@/actions/elevenlabs";
import type { ElevenLabsVoice } from "@/types/agent";
import { useEffect, useState, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { GlobalVoiceSelector } from "../global-voice-selector";

export function ConversationNodeConfig({
  selectedNode,
  updateNode,
  globalVoice,
  setGlobalVoice,
  isFirstConversation = false,
}: NodeConfigurationProps) {
  const { agentsData } = useAllAgents();
  const nodeData = selectedNode.data as ConversationNodeData;

  const useGlobalVoice = isFirstConversation
    ? true
    : nodeData.voice === undefined;

  // ---------------------- Valores por defecto ----------------------------------
  useEffect(() => {
    if (!nodeData.transcriber) {
      updateNode(selectedNode.id, {
        transcriber: { provider: "deepgram", model: "nova-2" },
      });
    }
    if (!nodeData.model) {
      updateNode(selectedNode.id, {
        model: { provider: "openai", model: "gpt-4.1-nano" },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // -----------------------------------------------------------------------------

  const handleDataChange = (updates: Partial<ConversationNodeData>) => {
    updateNode(selectedNode.id, updates);
  };

  const handleUseGlobalVoiceChange = (useGlobal: boolean) => {
    if (useGlobal) {
      // Switch to global voice: remove local override
      const currentData = { ...nodeData };
      delete currentData.voice;
      updateNode(selectedNode.id, { voice: undefined });
    } else {
      // Switch to local voice: set a default or the global one as a starting point
      handleDataChange({
        voice: globalVoice || { provider: "11labs", voiceId: "" },
      });
    }
  };

  // ------------------------- ElevenLabs Voices ---------------------------------
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState<boolean>(false);
  const [voiceFilter, setVoiceFilter] = useState<string>("");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoadingVoices(true);
        const voicesData = await getElevenLabsVoices();
        if (voicesData?.voices) {
          setVoices(voicesData.voices as ElevenLabsVoice[]);
        }
      } catch (error) {
        console.error("Error fetching ElevenLabs voices:", error);
      } finally {
        setLoadingVoices(false);
      }
    };
    fetchVoices();
  }, []);

  const filteredVoices = voices.filter((voice) => {
    return (
      voice.name.toLowerCase().includes(voiceFilter.toLowerCase()) ||
      voice.description?.toLowerCase().includes(voiceFilter.toLowerCase())
    );
  });

  const handleVoicePreview = async (voiceId: string, previewUrl: string) => {
    if (playingVoice === voiceId) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingVoice(null);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    setPlayingVoice(voiceId);
    audio.onended = () => setPlayingVoice(null);
    audio.onerror = () => setPlayingVoice(null);
    try {
      await audio.play();
    } catch (error) {
      setPlayingVoice(null);
      console.error("Error playing voice preview:", error);
    }
  };

  // -----------------------------------------------------------------------------
  const currentVoice = nodeData.voice || globalVoice;
  const selectedVoiceName =
    voices.find((v) => v.voice_id === currentVoice?.voiceId)?.name ||
    currentVoice?.voiceId;

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <Label className="text-sm font-medium">Prompt</Label>
        <Textarea
          value={nodeData.prompt || ""}
          onChange={(e) => handleDataChange({ prompt: e.target.value })}
          className="h-40 mt-1"
          placeholder="Ingresa el prompt para este nodo de conversación..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Voz (ElevenLabs)</Label>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="use-global-voice"
              className="text-xs text-muted-foreground"
            >
              Usar voz global
            </Label>
            <Switch
              id="use-global-voice"
              checked={useGlobalVoice}
              onCheckedChange={handleUseGlobalVoiceChange}
            />
          </div>
        </div>

        {isFirstConversation ? (
          <GlobalVoiceSelector
            globalVoice={globalVoice}
            setGlobalVoice={setGlobalVoice!}
          />
        ) : useGlobalVoice ? (
          <div className="mt-2 p-3 border rounded-lg bg-muted/50 text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <div>
              Usando la voz global:{" "}
              <strong>
                {voices.find((v) => v.voice_id === globalVoice?.voiceId)
                  ?.name || globalVoice?.voiceId}
              </strong>
            </div>
          </div>
        ) : loadingVoices ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando voces...
          </div>
        ) : (
          <>
            <Select
              value={nodeData.voice?.voiceId || ""}
              onValueChange={(value) =>
                handleDataChange({
                  voice: { provider: "11labs", voiceId: value },
                })
              }
            >
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

                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredVoices.map((voice) => (
                      <div
                        key={voice.voice_id}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                          nodeData.voice?.voiceId === voice.voice_id
                            ? "bg-muted"
                            : ""
                        }`}
                        onClick={() =>
                          handleDataChange({
                            voice: {
                              provider: "11labs",
                              voiceId: voice.voice_id,
                            },
                          })
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{voice.name}</span>
                            {voice.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {voice.description}
                              </p>
                            )}
                          </div>
                          {voice.preview_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVoicePreview(
                                  voice.voice_id,
                                  voice.preview_url,
                                );
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
            {nodeData.voice?.voiceId && (
              <div className="mt-2 p-3 border rounded-lg bg-muted/50 text-xs">
                Voz seleccionada: <strong>{selectedVoiceName}</strong>
              </div>
            )}
          </>
        )}
      </div>

      <VariableManagement
        variables={nodeData.variables || []}
        onAddVariable={() => {
          const newVariable: Variable = {
            id: uuidv4(),
            name: `var_${(nodeData.variables?.length || 0) + 1}`,
            description: "",
          };
          handleDataChange({
            variables: [...(nodeData.variables || []), newVariable],
          });
        }}
        onUpdateVariable={(variableId, updates) => {
          handleDataChange({
            variables: (nodeData.variables || []).map((v) =>
              v.id === variableId ? { ...v, ...updates } : v,
            ),
          });
        }}
        onDeleteVariable={(variableId) => {
          handleDataChange({
            variables: (nodeData.variables || []).filter(
              (v) => v.id !== variableId,
            ),
          });
        }}
      />
    </div>
  );
}
