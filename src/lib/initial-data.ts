import type { Edge, Node } from "reactflow"
import { MarkerType } from 'reactflow';


export const initialNodes: Node[] = [
  {
    id: "1",
    type: "trigger",
    position: { x: 250, y: 100 },
    data: { label: "New Email Received" },
  },
  {
    id: "2",
    type: "condition",
    position: { x: 250, y: 250 },
    data: { label: "Contains Attachment?" },
  },
  {
    id: "3",
    type: "action",
    position: { x: 100, y: 400 },
    data: { label: "Save to Drive" },
  },
  {
    id: "4",
    type: "email",
    position: { x: 400, y: 400 },
    data: { label: "Send Notification" },
  },
]

export const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    style: { stroke: "#94a3b8", strokeWidth: 1.5 },
    markerEnd: {
        type: MarkerType.ArrowClosed,
      color: "#94a3b8",
      width: 15,
      height: 15,
    },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    label: "Yes",
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.7 },
    labelStyle: { fill: "#475569", fontSize: 12 },
    style: { stroke: "#94a3b8", strokeWidth: 1.5 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#94a3b8",
      width: 15,
      height: 15,
    },
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    label: "No",
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.7 },
    labelStyle: { fill: "#475569", fontSize: 12 },
    style: { stroke: "#94a3b8", strokeWidth: 1.5 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#94a3b8",
      width: 15,
      height: 15,
    },
  },
]
