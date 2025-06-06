import type { Node, Edge } from "reactflow"

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  nodes: Node[]
  edges: Edge[]
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "basic-greeting",
    name: "Saludo básico",
    description: "Un flujo simple de saludo y finalización de llamada",
    category: "Básico",
    nodes: [
      {
        id: "greeting-1",
        type: "conversation",
        position: { x: 100, y: 100 },
        data: { 
          label: "Saludo inicial",
          type: "conversation",
          message: "¡Hola! Gracias por llamar. ¿En qué puedo ayudarte?"
        },
      },
      {
        id: "end-1",
        type: "endCall",
        position: { x: 100, y: 250 },
        data: { 
          label: "Fin de llamada",
          type: "endCall",
          message: "Gracias por tu tiempo. ¡Que tengas un buen día!"
        },
      },
    ],
    edges: [
      {
        id: "greeting-to-end",
        source: "greeting-1",
        target: "end-1",
        type: "smartCondition",
        data: { condition: "Siempre" },
        animated: true,
      },
    ],
  },
  {
    id: "survey-flow",
    name: "Encuesta simple",
    description: "Flujo para recolectar información básica del usuario",
    category: "Encuestas",
    nodes: [
      {
        id: "welcome-2",
        type: "conversation",
        position: { x: 100, y: 50 },
        data: { 
          label: "Bienvenida",
          type: "conversation",
          message: "Hola, vamos a hacer una breve encuesta. ¿Cuál es tu nombre?"
        },
      },
      {
        id: "collect-data-2",
        type: "apiRequest",
        position: { x: 100, y: 200 },
        data: { 
          label: "Guardar respuesta",
          type: "apiRequest",
          endpoint: "/api/save-survey"
        },
      },
      {
        id: "thanks-2",
        type: "conversation",
        position: { x: 100, y: 350 },
        data: { 
          label: "Agradecimiento",
          type: "conversation",
          message: "Perfecto, gracias por tu respuesta. ¿Algo más en lo que pueda ayudarte?"
        },
      },
      {
        id: "end-2",
        type: "endCall",
        position: { x: 100, y: 500 },
        data: { 
          label: "Finalizar",
          type: "endCall",
          message: "Gracias por participar en nuestra encuesta. ¡Hasta luego!"
        },
      },
    ],
    edges: [
      {
        id: "welcome-to-collect",
        source: "welcome-2",
        target: "collect-data-2",
        type: "smartCondition",
        data: { condition: "Usuario responde" },
        animated: true,
      },
      {
        id: "collect-to-thanks",
        source: "collect-data-2",
        target: "thanks-2",
        type: "smartCondition",
        data: { condition: "Datos guardados" },
        animated: true,
      },
      {
        id: "thanks-to-end",
        source: "thanks-2",
        target: "end-2",
        type: "smartCondition",
        data: { condition: "Continuar" },
        animated: true,
      },
    ],
  },
  {
    id: "transfer-flow",
    name: "Transferencia rápida",
    description: "Evaluación rápida y transferencia a agente humano",
    category: "Soporte",
    nodes: [
      {
        id: "initial-3",
        type: "conversation",
        position: { x: 100, y: 50 },
        data: { 
          label: "Evaluación inicial",
          type: "conversation",
          message: "Hola, entiendo que necesitas ayuda. ¿Es un tema técnico o comercial?"
        },
      },
      {
        id: "transfer-3",
        type: "transferCall",
        position: { x: 100, y: 200 },
        data: { 
          label: "Transferir a agente",
          type: "transferCall",
          department: "soporte"
        },
      },
    ],
    edges: [
      {
        id: "initial-to-transfer",
        source: "initial-3",
        target: "transfer-3",
        type: "smartCondition",
        data: { condition: "Requiere agente humano" },
        animated: true,
      },
    ],
  },
] 