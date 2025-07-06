// ... existing code ...
import HandoverToHumanNode from "./nodes/handover-to-human-node"
import AINode from "./nodes/ai-node"
import integrationNode from "./nodes/integration-node"
import ReminderNode from "./nodes/reminder-node"

import { Button } from "@/components/ui/button"
import { Plus, Workflow, Save, Play, MoreHorizontal, Loader2, CheckCircle, Pencil, Send } from "lucide-react"
// ... existing code ...
const nodeTypes: NodeTypes = {
  conversation: ConversationNode,
  turnOffAgent: TurnOffAgentNode,
  crm: CrmNode,
  apiRequest: ApiRequestNode,
  captureResponse: CaptureResponseNode,
  condition: ConditionNode,
  urlButton: UrlButtonNode,
  trigger: TriggerNode,
  handoverToHuman: HandoverToHumanNode,
  integration: integrationNode,
  ai: AINode,
  reminder: ReminderNode,
}

const validateConnection = (sourceNode: Node, targetNode: Node, allNodes: Node[]): boolean => {
  if (sourceNode.type === "trigger") {
// ... existing code ...
// ... existing code ...
          name: "Handover to Agent",
          botResponse: "En un momento te atenderá un agente humano.",
        }
      if (nodeType === "ai")
        defaultData = {
          ...defaultData,
          name: "Inteligencia Artificial",
          prompt: "Eres un asistente de IA. Tu objetivo es resolver las dudas del usuario.",
          conditions: [], // Inicialmente sin condiciones de salida
        }
      if (nodeType === "reminder")
        defaultData = {
          ...defaultData,
          name: "New Reminder",
          delay: 60, // 1 minute default
          delayUnit: "seconds",
          botResponse: "",
          userResponse: "",
        }
      const newNode: Node = {
        id: uuidv4(),
        type: nodeType,
// ... existing code ...
