"use client"

import { useState, useCallback, useRef } from "react"
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow"
import "reactflow/dist/style.css"
import { ConversationNode } from "./nodes/conversation-node"
import { EndCallNode } from "./nodes/end-call-node"
import { ApiRequestNode } from "./nodes/api-request-node"
import { IntegrationNode } from "./nodes/integration-node"
import { Button } from "@/components/ui/button"
import { Plus, Save, Undo, Redo, ZoomIn, ZoomOut, LayoutGrid, Download } from "lucide-react"
import { motion } from "framer-motion"
import { TransferCallNode } from "./nodes/trasfer-call-node"
import { conditionEdges } from "./edges/condition-edges"
import { NodeSelector } from "./node-selector"
import { TemplateSelector, type WorkflowTemplate } from "./template-selector"

// Define node types
export type NodeData = {
  label: string
  type: string
}

// Initial nodes and edges
const initialNodes: Node[] = []
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

export function FlowBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: "smartCondition",
        data: { condition: "Condition" },
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

      // Get the center position of the viewport
      const position = reactFlowInstance.project({
        x: reactFlowWrapper.current!.clientWidth / 2,
        y: reactFlowWrapper.current!.clientHeight / 2,
      })

      // Create a new node with an incremented ID
      const newNode: Node = {
        id: `${nodeType}-${nodes.length + 1}`,
        type: nodeType,
        position,
        data: { label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${nodes.length + 1}`, type: nodeType },
      }
      
      setNodes((nds) => nds.concat(newNode))
      setIsMenuOpen(false)
      console.log(nodes)
    },
    [nodes.length, reactFlowInstance, setNodes],
  )

  // Handle template selection
  const handleTemplateSelect = useCallback(
    (template: WorkflowTemplate) => {
      // Replace current nodes and edges with template ones
      setNodes(template.nodes)
      setEdges(template.edges)
      
      // Fit view to show all nodes
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView()
        }
      }, 100)
    },
    [reactFlowInstance, setNodes, setEdges],
  )

  return (
    <div className="w-full h-full flex-1 relative" ref={reactFlowWrapper}>
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
            style: { strokeWidth: 2, stroke: "#64748b" },
          }}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          className="bg-gray-50 h-full flex-1"
        >
          <Background gap={12} size={1} color="#e2e8f0" />

          {/* Top toolbar */}
          <Panel position="top-center" className="bg-white shadow-md rounded-md p-1 m-2 flex gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Save className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Undo className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Redo className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-gray-200 my-auto mx-1"></div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <ZoomOut className="h-5 w-5" />
            </Button>
            <TemplateSelector onSelectTemplate={handleTemplateSelect} />
            <div className="w-px h-6 bg-gray-200 my-auto mx-1"></div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Download className="h-5 w-5" />
            </Button>
          </Panel>

          <Controls className="bg-white shadow-md rounded-md border-none overflow-hidden" />
        </ReactFlow>

        <motion.div className="absolute bottom-4 right-4 z-10" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>

        {isMenuOpen && <NodeSelector onSelect={addNode} onClose={() => setIsMenuOpen(false)} />}
      </ReactFlowProvider>
    </div>
  )
}
