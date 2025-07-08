"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  BackgroundVariant,
} from "reactflow"
import "reactflow/dist/style.css"
import { ConversationNode } from "./nodes/conversation-node"
import { EndCallNode } from "./nodes/end-call-node"
import { ApiRequestNode } from "./nodes/api-request-node"
import { IntegrationNode } from "./nodes/integration-node"
import { TransferCallNode } from "./nodes/trasfer-call-node"
import { conditionEdges } from "./edges/condition-edges"
import type { WorkflowTemplate } from "./template-selector"
import { NodeConfigurationSheet } from "./node-configuration"
import { useWorkflowData } from "./hooks/use-workflow-data"
import { v4 as uuidv4 } from "uuid"
import type {
  WorkflowNode,
  ConversationNodeData,
  IntegrationNodeData,
  TransferCallNodeData,
  EndCallNodeData,
  WorkflowNodeData,
} from "../types"
import { WorkflowSidebar } from "./workflow-sidebar"
import { WorkflowToolbar } from "./workflow-toolbar"
import { CreateTriggerModal } from "./create-trigger-modal"

// Initial nodes and edges
const initialNodes: WorkflowNode[] = []
const initialEdges: Edge[] = []

// Define custom node types
const nodeTypes: NodeTypes = {
  conversation: ConversationNode,
  transferCall: TransferCallNode,
  endCall: EndCallNode,
  apiRequest: ApiRequestNode,
  integration: IntegrationNode,
}

// Add after the nodeTypes definition
const edgeTypes = {
  smartCondition: conditionEdges,
}

export function FlowBuilder({ workflowId }: { workflowId: string }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false)

  // Use workflow data hook
  const {
    workflowName,
    setWorkflowName,
    isSaving,
    isLoading,
    saveWorkflow,
    globalVoice,
    setGlobalVoice,
  } = useWorkflowData({
    workflowId,
    setNodes,
    setEdges,
  })

  const handleAddTrigger = () => {
    setIsTriggerModalOpen(true)
  }

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: "smartCondition",
        data: { condition: { type: "ai", prompt: "Condition" } },
        animated: true,
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges],
  )

  // Add a new node to the canvas
  const addNode = useCallback(
    (nodeType: string) => {
      if (!reactFlowInstance) return

      const position = reactFlowInstance.project({
        x: reactFlowWrapper.current!.clientWidth / 2,
        y: reactFlowWrapper.current!.clientHeight / 2,
      })

      const nodeCount = nodes.length + 1
      let newNode: WorkflowNode

      switch (nodeType) {
        case "conversation":
          newNode = {
            id: uuidv4(),
            type: "conversation",
            position,
            data: {
              type: "conversation",
              label: `Conversación ${nodeCount}`,
              name: `conversation_${nodeCount}`,
              prompt: "",
              model: { provider: "openai", model: "gpt-4.1-nano" },
              transcriber: { provider: "deepgram", model: "nova-2" },
              variables: [],
            } as ConversationNodeData,
          }
          break
        case "integration":
          newNode = {
            id: uuidv4(),
            type: "integration",
            position,
            data: {
              type: "integration",
              label: `Integración ${nodeCount}`,
              name: `integration_${nodeCount}`,
              integrationType: "custom-api",
            } as IntegrationNodeData,
          }
          break
        case "transferCall":
          newNode = {
            id: uuidv4(),
            type: "transferCall",
            position,
            data: {
              type: "transferCall",
              label: `Transferir Llamada ${nodeCount}`,
              name: `transfer_call_${nodeCount}`,
              number: "",
              message: "",
            } as TransferCallNodeData,
          }
          break
        case "endCall":
          newNode = {
            id: uuidv4(),
            type: "endCall",
            position,
            data: {
              type: "endCall",
              label: `Finalizar Llamada ${nodeCount}`,
              name: `end_call_${nodeCount}`,
            } as EndCallNodeData,
          }
          break
        case "apiRequest":
          newNode = {
            id: uuidv4(),
            type: "apiRequest",
            position,
            data: {
              type: "apiRequest",
              label: `API Request ${nodeCount}`,
              name: `api_request_${nodeCount}`,
              url: "https://api.example.com/endpoint",
              method: "GET",
              headers: {},
              body: {},
            } as WorkflowNodeData,
          }
          break
        default:
          return
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [nodes, reactFlowInstance, setNodes],
  )

  // Handle template selection
  const handleTemplateSelect = useCallback(
    (template: WorkflowTemplate) => {
      setNodes(template.nodes as Node[])
      setEdges(template.edges as Edge[])
    },
    [setNodes, setEdges],
  )

  // Find selected node
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null

  // Determine if the selected node is the first conversation node
  const firstConversationNode = nodes.find((n) => n.type === "conversation")
  const isFirstConversationSelected =
    selectedNode?.type === "conversation" && selectedNode.id === firstConversationNode?.id

  // Handle node click to open configuration sheet
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    setSelectedNodeId(node.id)
  }, [])

  // Update node function for the sheet components
  const updateNode = (nodeId: string, dataUpdates: Partial<WorkflowNodeData>) => {
    setNodes(
      (prev) =>
        prev.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...dataUpdates } }
          }
          return node
        }) as WorkflowNode[],
    )
  }

  const handleSaveWorkflow = async () => {
    const success = await saveWorkflow(nodes, edges)
    return success
  }

  return (
    <div className="h-screen w-full bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 ease-in-out overflow-hidden border-r border-gray-200 bg-white flex-shrink-0`}
      >
        <WorkflowSidebar
          onAddNode={addNode}
          onSelectTemplate={handleTemplateSelect}
          hasNodes={nodes.length > 0}
          isOpen={sidebarOpen}
          onAddTrigger={handleAddTrigger}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <WorkflowToolbar
          workflowName={workflowName}
          setWorkflowName={setWorkflowName}
          onSave={handleSaveWorkflow}
          isSaving={isSaving}
          workflowId={workflowId}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onInit={setReactFlowInstance}
              defaultEdgeOptions={{
                type: "smartCondition",
                style: { strokeWidth: 2, stroke: "#374151" },
              }}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              className="h-full w-full bg-gray-100"
              onNodeClick={onNodeClick}
              minZoom={0.1}
              maxZoom={2}
            >
            <Background gap={20} size={1} color="#6b7280" variant={BackgroundVariant.Dots} />
              <Controls
                className="bg-gray-800 shadow-lg rounded-lg border border-gray-700 overflow-hidden"
                showZoom={true}
                showFitView={true}
                showInteractive={false}
              />
            </ReactFlow>

            <NodeConfigurationSheet
              selectedNode={selectedNode as Node<WorkflowNodeData> | null}
              isOpen={!!selectedNode}
              onClose={() => setSelectedNodeId(null)}
              updateNode={updateNode}
              globalVoice={globalVoice}
              setGlobalVoice={setGlobalVoice}
              isFirstConversation={!!isFirstConversationSelected}
            />
          </ReactFlowProvider>
        </div>
      </div>
      <CreateTriggerModal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        workflowId={workflowId}
      />
    </div>
  )
}
