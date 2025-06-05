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