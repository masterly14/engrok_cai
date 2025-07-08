"use client";
import type React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  Copy,
  WorkflowIcon,
  CalendarDays,
  Pencil,
} from "lucide-react";
import { motion } from "framer-motion";
import { type ChatWorkflow } from "./table-workflows";

interface WorkflowTableRowProps {
  workflow: ChatWorkflow;
  onRowClick: (workflowId: string) => void;
  onDeleteClick: (e: React.MouseEvent, workflowId: string) => void;
  onDuplicate: (e: React.MouseEvent, workflowId: string) => void;
  onCopyId: (e: React.MouseEvent, workflowId: string) => void;
  operationLoading: string | null;
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const getNodeCount = (workflowJson: any) => {
  if (!workflowJson || !Array.isArray(workflowJson.nodes)) return 0;
  return workflowJson.nodes.length;
};

const getToolsCount = (tools: any) => {
  if (!tools) return 0;
  if (Array.isArray(tools)) return tools.length;
  if (typeof tools === "object") return Object.keys(tools).length;
  return 0;
};

export function WorkflowTableRow({
  workflow,
  onRowClick,
  onDeleteClick,
  onDuplicate,
  onCopyId,
  operationLoading,
}: WorkflowTableRowProps) {
  return (
    <motion.tr
      key={workflow.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
        operationLoading === workflow.id ? "opacity-50 pointer-events-none" : ""
      }`}
      onClick={() => onRowClick(workflow.id)}
    >
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{workflow.name}</span>
          <span className="text-sm text-gray-500 font-mono">
            {workflow.id.slice(0, 8)}...
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="font-medium">
          Draft
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <WorkflowIcon className="h-4 w-4 text-gray-400" />
          <span className="font-medium">
            {getNodeCount(workflow.workflowJson)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="font-medium">{getToolsCount(workflow.tools)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <CalendarDays className="h-3 w-3" />
          {formatDate(workflow.createdAt)}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-600">
          {formatDate(workflow.updatedAt)}
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
              disabled={operationLoading === workflow.id}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRowClick(workflow.id);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" /> Editar Flujo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => onCopyId(e, workflow.id)}>
              <Copy className="h-4 w-4 mr-2" /> Copiar ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => onDuplicate(e, workflow.id)}>
              <Copy className="h-4 w-4 mr-2" />
              {operationLoading === workflow.id ? "Duplicando..." : "Duplicar"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => onDeleteClick(e, workflow.id)}
              className="text-red-600 focus:text-red-600"
              disabled={operationLoading === workflow.id}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {operationLoading === workflow.id ? "Eliminando..." : "Eliminar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  );
}
