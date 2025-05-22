"use client";

import { useState, useEffect } from "react";
import { FileUploadComponent } from "./file-upload";
import { getKnowledgeBases } from "@/actions/knowledge-base";
import { Button } from "@/components/ui/button";
import { ElevenLabsClient } from "elevenlabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  updateAgentWithElevenLabs,
  createPhoneNumberRecord,
} from "@/actions/agents";
import { LoadingSpinner } from "@/components/loading-spinner";
import { TwilioCredentialsForm } from "./twilio-credentials-form";

interface KnowledgeBase {
  id: string;
  name: string;
  elevenLabsId?: string;
}

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface VerificationStatus {
  isVerifying: boolean;
  isVerified: boolean;
  message: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  data?: any;
  id?: string;
}

interface AddKnowledgeBaseProps {
  agentId: string;
  userId: string;
  prompt: string;
  name: string;
  first_message: string;
  voice_id: string;
  language: string;
  onSuccess?: () => void;
}

export const AddKnowledgeBase = ({
  agentId,
  userId,
  prompt,
  name,
  first_message,
  voice_id,
  language,
  onSuccess
}: AddKnowledgeBaseProps) => {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] =
    useState<string>("");
  const [showNewKnowledgeBase, setShowNewKnowledgeBase] =
    useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [twilioCredentials, setTwilioCredentials] = useState<TwilioCredentials>(
    {
      accountSid: "",
      authToken: "",
      phoneNumber: "",
    }
  );
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>({
      isVerifying: false,
      isVerified: false,
      message: "",
    });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      const response = await getKnowledgeBases();
      if (response.status === 200) {
        setKnowledgeBases(response.data);
      }
    };
    fetchKnowledgeBases();
  }, []);

  useEffect(() => {
    console.log("Bases de conocimiento (updated): ", knowledgeBases);
  }, [knowledgeBases]);
  const handleUploadSuccess = (result: UploadResult) => {
    console.log("Result from FileUploadComponent:", result);
    setUploadResult(result);
  };

  const handleSelect = (value: string) => {
    setSelectedKnowledgeBase(value);
    setShowNewKnowledgeBase(value === "new");
    console.log(selectedKnowledgeBase);
    setOpen(false);
  };

  const client = new ElevenLabsClient({
    apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
  });
  
  const handleSubmit = async () => {
    setLoading(true);
    if (!verificationStatus.isVerified) {
      setVerificationStatus({
        ...verificationStatus,
        message: "Please verify your Twilio credentials before submitting",
      });
      setLoading(false);
      return;
    }

    const formData = {
      knowledgeBaseId: selectedKnowledgeBase,
      twilioCredentials: {
        accountSid: twilioCredentials.accountSid,
        authToken: twilioCredentials.authToken,
        phoneNumber: twilioCredentials.phoneNumber,
      },
    };

    try {
      console.log("Lenguaje: ", language)
      const elevenLabsResponse = await client.conversationalAi.createAgent({
        conversation_config: {
          agent: {
            first_message: first_message,
            prompt: {
              llm: "gpt-4-turbo",
              prompt: prompt,
              temperature: 5,
              max_tokens: 512,
            },
            language: language,
          },
          tts: {
            agent_output_audio_format: "ulaw_8000",
            model_id: "eleven_flash_v2_5",
            voice_id: voice_id,
            optimize_streaming_latency: 0,
            stability: 0.5,
            similarity_boost: 0.8,
            speed: 1,
          },
          turn: {
            mode: "silence",
          },
          asr: {
            quality: "high",
            user_input_audio_format: "ulaw_8000",
            provider: "elevenlabs"
          },
        },
        platform_settings: {
          auth: {
            enable_auth: true,
          },
          overrides: {
            conversation_config_override: {
              agent: {
                prompt: {
                  prompt: true
                },
                first_message: true
              }
            }
          }

        },
        name: name,
      });

      if (elevenLabsResponse) {
        setLoading(false);
        const updateResponse = await updateAgentWithElevenLabs(
          agentId,
          elevenLabsResponse.agent_id,
          selectedKnowledgeBase,
          twilioCredentials.phoneNumber
        );
        console.log(updateResponse.status);

        const phoneNumberResponse = await createPhoneNumberRecord(
          agentId,
          twilioCredentials.accountSid,
          twilioCredentials.authToken,
          twilioCredentials.phoneNumber
        );

        if (phoneNumberResponse.status === 200) {
          setLoading(false);
          if (onSuccess) {
            onSuccess();
          }
        } else {
          console.error(
            "Failed to create phone number record:",
            phoneNumberResponse.message
          );
        }
      } else {
        setLoading(false)
        console.error("Failed to create ElevenLabs agent:", elevenLabsResponse);
      }
    } catch (error) {
      setLoading(false)
      console.error("Error in handleSubmit:", error);
    }
  };

  useEffect(() => {
    console.log(selectedKnowledgeBase);
  }, [selectedKnowledgeBase]);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label htmlFor="knowledgeBaseSelect" className="text-sm font-medium">
          Seleccionar base de conocimiento
        </label>
        <select
          id="knowledgeBaseSelect"
          value={selectedKnowledgeBase}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedKnowledgeBase(value);
            setShowNewKnowledgeBase(value === "new");
          }}
          className="border rounded px-3 py-2 w-[300px] text-sm bg-muted"
        >
          <option value="">Seleccionar base de conocimiento</option>
          <option value="new">➕ Crear nueva base de conocimiento</option>
          {knowledgeBases.map((kb) => (
            <option key={kb.id} value={kb.id}>
              {kb.name}
            </option>
          ))}
        </select>
      </div>
      {showNewKnowledgeBase ? (
        <div className="space-y-4">
          <FileUploadComponent onSubmitSuccess={handleUploadSuccess} />
        </div>
      ) : (
        <p>Hola</p>
      )}

      {/* Twilio credentials */}
      <TwilioCredentialsForm
        formData={twilioCredentials}
        onFormDataChange={setTwilioCredentials}
        verificationStatus={verificationStatus}
        onVerificationStatusChange={setVerificationStatus}
      />

      <Button
        onClick={handleSubmit}
        className="w-full mt-4"
        disabled={!selectedKnowledgeBase || !verificationStatus.isVerified}
      >
        {loading ? <LoadingSpinner variant="ghost" /> : "Submit"}
      </Button>
    </div>
  );
};
