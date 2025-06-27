import type { Node } from "reactflow";

export interface Variable {
  id: string;
  name: string;
  description: string;
}

export interface VapiModel {
  provider: "openai" | "groq";
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface VapiVoice {
  provider: "11labs" | "deepgram";
  voiceId: string;
}

export interface VapiTranscriber {
  provider: "deepgram" | "google";
  model: string;
  language?: string;
}

// --- Definición de la data de cada tipo de nodo ---

export interface BaseNodeData {
  label: string; // Título visible en el nodo en la UI
  name: string; // Nombre único usado como ID para VAPI
}

export interface ConversationNodeData extends BaseNodeData {
  type: "conversation";
  prompt: string;
  model: VapiModel;
  voice: VapiVoice;
  transcriber: VapiTranscriber;
  variables: Variable[];
}

export interface IntegrationNodeData {
  type: 'integration';
  label: string;
  name: string;
  integrationType: 'custom-api' | 'google-sheet' | 'google-calendar';

  // Google Sheets
  spreadsheetId?: string;
  sheetName?: string;
  column?: string;
  value?: string;

  // Google Calendar
  calendarId?: string;
  eventSummary?: string;
  eventDescription?: string;
  eventStartDate?: string;
  eventStartTime?: string;
  eventDuration?: number | string;
  isDynamicStartDate?: boolean;
  isDynamicStartTime?: boolean;

  // Google Calendar extra
  calendarAction?: 'availability' | 'createEvent';
  rangeDays?: number;

  // Custom API
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export interface TransferCallNodeData extends BaseNodeData {
    type: "transferCall";
    number: string;
    message: string;
}

export interface EndCallNodeData extends BaseNodeData {
    type: "endCall";
}

export interface ApiRequestNodeData extends BaseNodeData {
  type: "apiRequest";
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

// --- Objeto Node de React Flow con nuestra data tipada ---

export type WorkflowNodeData = ConversationNodeData | IntegrationNodeData | TransferCallNodeData | EndCallNodeData | ApiRequestNodeData;

export type WorkflowNode = Node<WorkflowNodeData>; 