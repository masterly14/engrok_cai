"use client";

import type React from "react";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  Mic,
  File,
  FileText,
  FileAudio,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { saveKnowledgeBase } from "@/actions/knowledge-base";
import { ElevenLabsClient } from "elevenlabs";

// Define accepted file types
const ACCEPTED_TEXT_TYPES = [
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp3",
  "audio/mp4",
];

// File type for our state
type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
};

type FileUploadComponentProps = {
  onSubmitSuccess?: (result: any) => void;
};

export function FileUploadComponent({
  onSubmitSuccess,
}: FileUploadComponentProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [knowledgeBaseName, setKnowledgeBaseName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (
    selectedFiles: FileList | null,
    fileType?: "audio"
  ) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: UploadedFile[] = [];

    Array.from(selectedFiles).forEach((file) => {
      // Check if file type is accepted
      const isAcceptedType =
        fileType === "audio"
          ? ACCEPTED_AUDIO_TYPES.includes(file.type)
          : ACCEPTED_TEXT_TYPES.includes(file.type);

      if (!isAcceptedType) {
        toast("Invalid file type");
        return;
      }

      // Check if file already exists
      const fileExists = files.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (fileExists) {
        toast("File already added");
        return;
      }

      // Add file to state with simulated upload progress
      const newFile: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        progress: 0,
        status: "uploading",
      };

      newFiles.push(newFile);
    });

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);

      // Simulate upload progress for each file
      newFiles.forEach((file) => {
        simulateFileUpload(file.id);
      });
    }
  };

  // Simulate file upload progress
  const simulateFileUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        setFiles((prev) =>
          prev.map((file) =>
            file.id === fileId
              ? { ...file, progress: 100, status: "complete" }
              : file
          )
        );
      } else {
        setFiles((prev) =>
          prev.map((file) =>
            file.id === fileId ? { ...file, progress } : file
          )
        );
      }
    }, 300);
  };

  // Remove a file
  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (files.length === 0) {
      toast("No files to upload");
      return;
    }

    const incompleteFiles = files.filter((file) => file.status !== "complete");
    if (incompleteFiles.length > 0) {
      toast("Files still uploading");
      return;
    }

    // Here you would send the formData to your API
    const formData = new FormData();
    files.forEach((file) => {
      if (file.status === "complete") {
        formData.append("file", file.file);
      }
    });
    formData.append("name", knowledgeBaseName);

    // Example of how you might send this to an API
    try {
      toast("Submitting files...");

      const response = await fetch(
        "https://api.elevenlabs.io/v1/convai/knowledge-base",
        {
          method: "POST",
          headers: {
            "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const responseData = await response.json();
      const body = {
        id: responseData.id,
        name: knowledgeBaseName || responseData.name,
      };

      const saveDB = await saveKnowledgeBase(body);

      if (saveDB.status === 200) {
        toast("Files submitted successfully");
        if (onSubmitSuccess) {
          onSubmitSuccess(body);
        }
      }
    } catch (error) {
      toast("Submission failed");
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("audio/")) {
      return <FileAudio className="h-4 w-4" />;
    } else if (fileType === "text/plain" || fileType === "text/markdown") {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="w-full space-y-4 mt-4">
      {/* Knowledge Base Name Input */}
      <div className="space-y-2">
        <label htmlFor="knowledgeBaseName" className="text-sm font-medium">
          Nombre de la base de conocimiento
        </label>
        <input
          id="knowledgeBaseName"
          type="text"
          value={knowledgeBaseName}
          onChange={(e) => setKnowledgeBaseName(e.target.value)}
          placeholder="Ej: Lista de precios de productos o información general de mi negocio"
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Knowledge Base Info Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => setShowInfo(!showInfo)}
        >
          <Info className="h-4 w-4" />
          {showInfo ? "Ocultar" : "¿Qué es una base de conocimiento?"} 
          {showInfo ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/5">
            Text Files
          </Badge>
          <Badge variant="outline" className="bg-primary/5">
            Audio Files
          </Badge>
        </div>
      </div>

      {/* Collapsible Knowledge Base Info */}
      <Collapsible open={showInfo} onOpenChange={setShowInfo}>
        <CollapsibleContent className="p-4 bg-muted/30 rounded-lg text-sm space-y-3 mb-4 animate-in slide-in-from-top-2 duration-300">
          <h3 className="font-medium">¿Qué es una base de conocimiento?</h3>
          <p>
            Una base de conocimiento es como la memoria y cerebro de tu agente de IA. Almacena información importante, respuestas a preguntas frecuentes, detalles sobre tu negocio y cualquier otra información que el agente necesite.
          </p>

          <h4 className="font-medium mt-2">¿Para qué se utiliza?</h4>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              Habilita a tu agente de IA para responder preguntas con información específica de tu negocio
            </li>
            <li>
              Garantiza respuestas consistentes y precisas en cada conversación
            </li>
            <li>
              Reduce la necesidad de intervención humana en consultas repetitivas
            </li>
          </ul>
        </CollapsibleContent>
      </Collapsible>

      {/* File Upload Area */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <div
            className={cn(
              "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/20 hover:border-muted-foreground/40"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>

              <h3 className="text-base font-medium mb-1">
                Subir archivos de conocimiento
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Arrastra y suelta archivos o usa los botones de abajo
              </p>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="h-4 w-4" />
                  Archivos de texto
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => audioInputRef.current?.click()}
                >
                  <Mic className="h-4 w-4" />
                  Archivos de audio
                </Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={ACCEPTED_TEXT_TYPES.join(",")}
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            <input
              ref={audioInputRef}
              type="file"
              multiple
              className="hidden"
              accept={ACCEPTED_AUDIO_TYPES.join(",")}
              onChange={(e) => handleFileSelect(e.target.files, "audio")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
                Archivos subidos ({files.length})
            </h3>
            {files.some((f) => f.status === "complete") && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setFiles([])}
              >
                Limpiar todos
              </Button>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full flex items-center gap-2 bg-gray-900 text-white"
            variant={"outline"}
          >
            <Send className="h-4 w-4" />
            Guardar base de conocimiento
          </Button>

          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md text-sm transition-colors",
                  file.status === "complete"
                    ? "bg-primary/5 border border-primary/20"
                    : "bg-muted/50 border border-muted"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-md bg-background flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="truncate flex-1">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {file.status === "uploading" && (
                    <div className="flex items-center gap-2 w-24">
                      <Progress value={file.progress} className="h-1.5" />
                      <span className="text-xs whitespace-nowrap">
                        {file.progress}%
                      </span>
                    </div>
                  )}

                  {file.status === "error" && (
                    <span className="text-xs text-destructive">
                      {file.error}
                    </span>
                  )}

                  {file.status === "uploading" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
