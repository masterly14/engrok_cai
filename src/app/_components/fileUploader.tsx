"use client";

import { useDropzone } from "react-dropzone";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface FileUploaderProps {
  onUpload: (url: string) => void;
  uploadAction: (
    formData: FormData
  ) => Promise<{ success: boolean; url?: string; error?: string }>;
  allowedFileTypes?: string[];
  customName?: string;
}

const FileUploader = ({
  onUpload,
  uploadAction,
  allowedFileTypes = ["image/jpeg", "image/png", "application/pdf"],
  customName = "asset",
}: FileUploaderProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        toast.error("No file selected.");
        return;
      }

      // Validate file type
      if (!allowedFileTypes.includes(file.type)) {
        toast.error(`Invalid file type. Please upload one of: ${allowedFileTypes.join(", ")}`);
        return;
      }

      // Validate file size (16MB)
      if (file.size > 16 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 16MB.");
        return;
      }

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }

      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const result = await uploadAction(formData);
        if (result.success && result.url) {
          setUploadedFileUrl(result.url);
          onUpload(result.url);
          toast.success("File uploaded successfully!");
        } else {
          toast.error(result.error || "Failed to upload file.");
          setFilePreview(null);
        }
      } catch (error) {
        toast.error("An unexpected error occurred.");
        setFilePreview(null);
      } finally {
        setLoading(false);
      }
    },
    [allowedFileTypes, onUpload, uploadAction]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: allowedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <input {...getInputProps()} name={customName} />
      {loading ? (
        <div>
            <p>Uploading...</p>
        </div>
      ) : filePreview ? (
        <div className="flex flex-col items-center">
            <img src={filePreview} alt="File preview" className="max-h-48 mb-4" />
            <p>Drag 'n' drop a new file here, or click to replace</p>
        </div>
      ) : uploadedFileUrl ? (
        <div className="flex flex-col items-center">
            <p>File uploaded!</p>
            <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View File</a>
            <p className="mt-2">Or, drag 'n' drop a new file here to replace</p>
        </div>
      ) : (
        <p>Drag 'n' drop a file here, or click to select a file</p>
      )}
    </div>
  );
};

export default FileUploader; 