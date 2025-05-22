"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { Node, Edge } from "reactflow";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTemplates } from "@/actions/template";
import { Template } from "@prisma/client";

interface TemplatesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTemplate: (nodes: Node[], edges: Edge[]) => void;
}

export default function TemplatesPanel({
  isOpen,
  onClose,
  onImportTemplate,
}: TemplatesPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await getTemplates();
      if (response) {
        setTemplates(response);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleImport = () => {
    if (selectedTemplate !== null) {
      const template = templates[selectedTemplate];
      const nodes = template.nodes as unknown as Node[];
      const edges = template.edges as unknown as Edge[];

      onImportTemplate(nodes, edges);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b p-4">
          <CardTitle className="text-lg">Workflow Templates</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4">
          <CardDescription className="text-sm mb-4">
            Select a template to quickly start building your workflow. Templates
            provide pre-configured workflows for common scenarios.
          </CardDescription>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <div
                key={index}
                className={`border rounded-md overflow-hidden cursor-pointer transition-all ${
                  selectedTemplate === index
                    ? "ring-2 ring-primary border-transparent"
                    : "hover:border-muted"
                }`}
                onClick={() => setSelectedTemplate(index)}
              >
                <div className="aspect-video relative bg-muted">
                  <Image
                    src={template.thumbnail || "/placeholder.svg"}
                    alt={template.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium">{template.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <div className="border-t p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedTemplate === null}
            className={
              selectedTemplate === null ? "cursor-not-allowed opacity-50" : ""
            }
          >
            Import Template
          </Button>
        </div>
      </Card>
    </div>
  );
}
