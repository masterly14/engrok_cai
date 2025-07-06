"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FileUp, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface FileUploaderProps {
  /**
   * Called when the upload finishes successfully.
   * Receives the created knowledgeBase id returned by the API.
   */
  onUploaded?: (knowledgeBaseId: string) => void;
}

export default function FileUploader({ onUploaded }: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      toast("Selecciona al menos un archivo");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));

    try {
      setIsUploading(true);
      setProgress(10);

      const response = await fetch("/api/knowledge-bases/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir archivos");
      }

      setProgress(80);
      const data = await response.json();
      setProgress(100);

      toast("Base de conocimiento creada correctamente", {
        duration: 3000,
        icon: <CheckCircle2 className="text-green-600" />,
      });

      if (onUploaded && data?.kbId) {
        onUploaded(data.kbId as string);
      }

      // Limpieza
      setSelectedFiles([]);
      if (inputRef.current) inputRef.current.value = "";

    } catch (err: any) {
      console.error(err);
      toast(err.message || "Error desconocido", {
        icon: <XCircle className="text-red-600" />,
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full p-4 border border-dashed rounded-lg bg-muted/40">
      <div className="flex flex-col gap-2 w-full max-w-md">
        <label className="text-sm font-medium">Archivos</label>
        <Input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.doc,.docx,.md"
          onChange={handleFileChange}
        />
      </div>

      {selectedFiles.length > 0 && (
        <ul className="text-xs w-full max-w-md list-disc list-inside">
          {selectedFiles.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      )}

      {isUploading && (
        <Progress value={progress} className="w-full max-w-md" />
      )}

      <Button
        onClick={handleUpload}
        disabled={isUploading || !selectedFiles.length}
        className="flex gap-2"
      >
        <FileUp className="w-4 h-4" />
        {isUploading ? "Subiendo..." : "Crear base de conocimiento"}
      </Button>
    </div>
  );
} 