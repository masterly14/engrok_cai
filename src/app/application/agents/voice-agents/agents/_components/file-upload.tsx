"use client"

import { useState, useRef, type DragEvent, type ChangeEvent } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface FileUploadProps {
  onUploadComplete?: (response: any) => void
  onUploadError?: (error: Error) => void
}

export function FileUpload({ onUploadComplete, onUploadError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      validateAndSetFile(files[0])
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    // Check if the file is an audio file
    if (file.type.startsWith("audio/")) {
      toast.error("Los archivos de audio no son permitidos")
      return
    }

    setSelectedFile(file)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      // Create a new FormData instance
      const formData = new FormData()
      formData.append("file", selectedFile)

      // Upload File (POST /file)
      const response = await fetch("https://api.vapi.ai/file", {
        method: "POST",
        headers: {
          Authorization: `Bearer b7ce0ac9-16ee-41cd-894c-f460f9ab53a4`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`)
      }

      const body = await response.json()
      console.log(body)

      // Add mimeType to the response if it's not included
      const responseWithMimeType = {
        ...body,
        mimeType: selectedFile.type || 'application/octet-stream'
      }

      if (onUploadComplete) {
        onUploadComplete(responseWithMimeType)
      }

      setSelectedFile(null)
    } catch (error) {
      console.error("Upload error:", error)
      if (onUploadError && error instanceof Error) {
        onUploadError(error)
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full">
      <div
        className={`relative rounded-lg border border-gray-700 p-6 transition-all ${
          isDragging ? "border-gray-400" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,application/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
        />

        <div className="flex flex-col items-center justify-center py-6">
          {selectedFile ? (
            <div className="w-full">
              <div className="mb-4 flex items-center justify-between rounded-md bg-gray-800 p-3">
                <span className="text-sm text-gray-200 truncate">{selectedFile.name}</span>
                <button onClick={handleClearFile} className="ml-2 rounded-full p-1 hover:bg-gray-700">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
              <Button onClick={handleUpload} className="w-full" disabled={isUploading}>
                {isUploading ? "Subiendo..." : "Subir archivo"}
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-full bg-gray-800 p-3">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mb-4 text-center text-lg font-medium">Arrastra y suelta el archivo aquí para subirlo</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBrowseClick}
                  className="border-emerald-700 bg-transparent text-emerald-500 hover:bg-emerald-950 hover:text-emerald-400"
                >
                  Navegar archivos
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
