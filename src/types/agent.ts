
import type { Agent as PrismaAgent, ChatAgent as PrismaChatAgent, ChatWorkflow } from "@prisma/client"


export type Voice = {
  voice_id: string
  name: string
  preview_url: string
}


export type ChatAgentWithWorkflows = PrismaChatAgent & {
  workflows: ChatWorkflow[]
}

export interface Agent {
    id: string
    vapiId: string | null
    userId: string
    name: string
    firstMessage: string
    prompt: string
    backgroundSound: string | null
    voiceId?: string | null
  }
  
  export interface AgentFormData {
    name: string
    firstMessage: string
    prompt: string
    backgroundSound: string
    voiceId: string
    language: string // ISO code like "es" | "en" | "fr" etc
  }
  

  export interface ElevenLabsVoice {
    voice_id: string
    name: string
    preview_url: string
    labels: {
      accent: string
      age: string
      descriptive?: string
      gender: string
      language: string
      use_case: string
    }
    category: "premade" | "professional" | "cloned"
    description?: string
  }