"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LayoutGrid, Workflow, Clock, Users } from "lucide-react";
import { workflowTemplates, type WorkflowTemplate } from "./templates";
import { motion } from "framer-motion";

interface TemplateSelectorProps {
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "customer service":
      return <Users className="h-4 w-4" />;
    case "sales":
      return <Workflow className="h-4 w-4" />;
    case "scheduling":
      return <Clock className="h-4 w-4" />;
    default:
      return <Workflow className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case "customer service":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "sales":
      return "bg-green-100 text-green-800 border-green-200";
    case "scheduling":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    onSelectTemplate(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 hover:bg-gray-50"
        >
          <LayoutGrid className="h-4 w-4" />
          Usar plantilla
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <LayoutGrid className="h-5 w-5" />
            Selecciona una plantilla
          </DialogTitle>
          <DialogDescription>
            Elige una plantilla predefinida para comenzar rápidamente con tu
            workflow
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {workflowTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all duration-200 bg-white"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {template.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${getCategoryColor(template.category)} flex items-center gap-1`}
                  >
                    {getCategoryIcon(template.category)}
                    {template.category}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {template.description}
                </p>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {template.nodes.length} nodos
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {template.edges.length} conexiones
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-blue-600 font-medium">
                      Seleccionar →
                    </span>
                  </div>
                </div>

                {/* Preview indicators */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    {template.nodes.slice(0, 4).map((node, nodeIndex) => (
                      <div
                        key={nodeIndex}
                        className={`w-2 h-2 rounded-full ${
                          node.type === "conversation"
                            ? "bg-cyan-400"
                            : node.type === "condition"
                              ? "bg-amber-400"
                              : node.type === "apiRequest"
                                ? "bg-purple-400"
                                : node.type === "transferCall"
                                  ? "bg-green-400"
                                  : node.type === "endCall"
                                    ? "bg-red-400"
                                    : "bg-gray-400"
                        }`}
                      />
                    ))}
                    {template.nodes.length > 4 && (
                      <span className="text-xs text-gray-400 ml-1">
                        +{template.nodes.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {workflowTemplates.length === 0 && (
            <div className="text-center py-12">
              <LayoutGrid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay plantillas disponibles
              </h3>
              <p className="text-gray-500">
                Las plantillas aparecerán aquí cuando estén disponibles.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { WorkflowTemplate };
