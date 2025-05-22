"use client";

import type React from "react";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  MarkerType,
  MiniMap,
  type NodeTypes,
  Panel,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Edge, Node, ReactFlowInstance } from "reactflow";

import { initialNodes, initialEdges } from "@/lib/initial-data";
import { FilePlus, FileUp, LayoutGrid, Save, Trash2 } from "lucide-react";
import TemplatesPanel from "./templates_panel";
import NodeSelector from "./node-selector";
import { nodeTypes } from "./workflows-nodes";
import {
  createWorkflow,
  deleteWorkflow,
  getAllWorkflows,
  getWorkflow,
  updateWorkflow,
} from "@/actions/workflow";
import { Workflow } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [isTemplatesPanelOpen, setIsTemplatesPanelOpen] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [currentWorkflowId, setCurrentWorkflowId] = useState<null | string>(
    null
  );

  useEffect(() => {
    const response = async () => {
      const data = await getAllWorkflows();
      if (data.workflows) {
        setSavedWorkflows(data.workflows);
      }
    };
    response();
  }, []);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: {
              stroke: "#94a3b8",
              strokeWidth: 1.5,
            },
          },
          eds
        )
      ),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      if (reactFlowInstance) {
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode = {
          id: `${type}-${Date.now()}`,
          type,
          position,
          data: {
            label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          },
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [reactFlowInstance, setNodes]
  );

  const handleImportTemplate = (templateNodes: any[], templateEdges: any[]) => {
    // Adjust node positions if needed
    const adjustedNodes = templateNodes.map((node) => ({
      ...node,
      id: `${node.id}-${Date.now()}`, // Ensure unique IDs
    }));

    // Update edge references to match new node IDs
    const adjustedEdges = templateEdges.map((edge) => ({
      ...edge,
      id: `${edge.id}-${Date.now()}`,
      source: `${edge.source}-${Date.now()}`,
      target: `${edge.target}-${Date.now()}`,
    }));

    setNodes(adjustedNodes);
    setEdges(adjustedEdges);
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName.trim()) {
      toast("Please provide a workflow name");
      return;
    }

    try {
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        nodes,
        edges,
      };

      let response;

      if (currentWorkflowId) {
        response = await updateWorkflow(workflowData, currentWorkflowId);
      } else {
        response = await createWorkflow(workflowData);
      }
      if (response.status === 200) {
        if (response.workflow) {
          setCurrentWorkflowId(response.workflow.id);
          setIsSaveDialogOpen(false);
          toast("Success");
        }
      } else {
        toast("Error");
      }
    } catch (error) {
      console.error("Failed to save workflow:", error);
      toast("Error");
    }
  };

  const handleLoadWorkflow = async (workflowId: string) => {
    try {
      const response = await getWorkflow(workflowId);
      if (response.status === 200 && response.workflow) {
        const workflow = response.workflow;

        const nodes = workflow.nodes as unknown as Node[];
        const edges = workflow.edges as unknown as Edge[];

        setNodes(Array.isArray(nodes) ? nodes : []);
        setEdges(Array.isArray(edges) ? edges : []);
        setWorkflowName(workflow.name || "");
        setWorkflowDescription(workflow.description || "");
        setCurrentWorkflowId(workflow.id || null);
        setIsLoadDialogOpen(false);
        toast("Success");
      } else {
        toast("Error");
      }
    } catch (error) {
      console.error("Failed to load workflow:", error);
      toast("Error");
    }
  };

  const handleNewWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setWorkflowName("");
    setWorkflowDescription("");
    setCurrentWorkflowId(null);
    toast("New workflow");
  };

  const handleDeleteWorkflow = async () => {
    if (!currentWorkflowId) return;

    try {
      const response = deleteWorkflow(currentWorkflowId);

      if ((await response).status) {
        handleNewWorkflow();
        toast("Deleted success");
      } else {
        toast("Error");
      }
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      toast("Error");
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes as NodeTypes}
        onInit={setReactFlowInstance as any}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          style: { stroke: "#94a3b8", strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#94a3b8",
            width: 15,
            height: 15,
          },
        }}
      >
        <Controls />
        <MiniMap
          style={{ backgroundColor: "#1e293b" }} // bg-slate-800 o similar
          nodeStrokeColor={(n) => {
            if (n.type === "trigger") return "#f43f5e";
            if (n.type === "action") return "#4ade80";
            if (n.type === "condition") return "#60a5fa";
            return "#cbd5e1";
          }}
          nodeColor={(n) => {
            if (n.type === "trigger") return "#f43f5e";
            if (n.type === "action") return "#4ade80";
            if (n.type === "condition") return "#60a5fa";
            return "#94a3b8";
          }}
        />

        <Panel
          position="top-left"
          className="bg-background border rounded-md shadow-sm p-2"
        >
          <NodeSelector />
        </Panel>

        <Panel position="top-right" className="flex gap-2 p-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTemplatesPanelOpen(true)}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            Templates
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSaveDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLoadDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <FileUp className="h-4 w-4" />
            Load
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNewWorkflow}
            className="flex items-center gap-2"
          >
            <FilePlus className="h-4 w-4" />
            New
          </Button>

          {currentWorkflowId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteWorkflow}
              className="flex items-center gap-2 text-red-500"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </Panel>
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e2e8f0"
        />
      </ReactFlow>

      <TemplatesPanel
        isOpen={isTemplatesPanelOpen}
        onClose={() => setIsTemplatesPanelOpen(false)}
        onImportTemplate={handleImportTemplate}
      />

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentWorkflowId ? "Update Workflow" : "Save Workflow"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Input
                id="description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Enter workflow description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveWorkflow}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Load Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {savedWorkflows.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No saved workflows found
              </p>
            ) : (
              <div className="space-y-2">
                {savedWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => handleLoadWorkflow(workflow.id)}
                  >
                    <div>
                      <h3 className="font-medium">{workflow.name}</h3>
                      {workflow.description && (
                        <p className="text-xs text-muted-foreground">
                          {workflow.description}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Last updated:{" "}
                        {new Date(workflow.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLoadDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
