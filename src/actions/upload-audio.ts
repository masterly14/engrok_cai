"use server";

import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { spawn } from "child_process";
import path from "path";
import { writeFile, unlink } from "fs/promises";
import { saveUserAsset } from "./chat-agents";

// Configura Cloudinary con tus credenciales (asegúrate de tener estas variables de entorno)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadAudioAction(
  formData: FormData,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const file = formData.get("audioFile") as File | null;

  if (!file) {
    return { success: false, error: "No audio file provided." };
  }

  // Allowed audio formats
  const allowedAudioExtensions = ["aac", "mp3", "amr", "ogg", "m4a"] as const;
  const audioExtension = file.name.split(".").pop()?.toLowerCase();
  if (
    !audioExtension ||
    !allowedAudioExtensions.includes(audioExtension as any)
  ) {
    return {
      success: false,
      error:
        "Unsupported audio format. Allowed formats: .aac, .mp3, .amr, .ogg (opus), .m4a",
    };
  }

  try {
    // Convertir el archivo a un buffer para Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Cloudinary
    // Usamos un stream para subir el buffer
    const uploadResult = await new Promise<{
      secure_url?: string;
      public_id?: string;
      error?: any;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video", // Cloudinary trata audios como 'video' para algunas funcionalidades o 'raw'
          folder: "whatsapp_audios", // Carpeta opcional en Cloudinary
          // public_id: `audio_${Date.now()}`, // Opcional: nombre de archivo personalizado
        },
        (error, result) => {
          if (error) {
            reject({ error });
          } else {
            resolve(result || {});
          }
        },
      );
      const readable = new Readable();
      readable._read = () => {}; // _read is required but you can noop it
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });

    if (uploadResult.error || !uploadResult.secure_url) {
      console.error("Cloudinary upload error:", uploadResult.error);
      return { success: false, error: "Failed to upload audio to Cloudinary." };
    }

    // Construir URL derivada en formato AAC (f_aac) con la mejor calidad
    const aacUrl = cloudinary.url(uploadResult.public_id || "", {
      resource_type: "video", // Cloudinary trata audio como video
      format: "aac", // asegura extensión y contenedor .aac
      quality: "auto:best",
      secure: true,
    });

    // Guardar asset en DB usando la URL ya convertida
    await saveUserAsset({
      name:
        (file.name ? file.name.split(".")[0] : `audio_${Date.now()}`) + ".aac",
      type: "audio",
      url: aacUrl,
    });

    return { success: true, url: aacUrl };
  } catch (error) {
    console.error("Error uploading audio:", error);
    let errorMessage = "An unknown error occurred during audio upload.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

export const uploadFile = async (
  formData: FormData,
): Promise<{
  success: boolean;
  url?: string;
  publicId?: string;
  resourceType?: "raw" | "image" | "video";
  error?: string;
}> => {
  const file = formData.get("file") as File | null;
  const image = formData.get("image") as File | null;
  const video = formData.get("video") as File | null;

  if (!file && !image && !video) {
    return { success: false, error: "No file, image, or video provided." };
  }

  try {
    let uploadResult;
    let fileToUpload: File | null = null;
    let resourceType: "raw" | "image" | "video" = "raw";
    let folder = "files";

    // Determine which file to upload and its type
    if (video) {
      fileToUpload = video;

      // Allowed video formats
      const allowedVideoExtensions = ["mp4", "3gp"] as const;
      const videoExtension = video.name.split(".").pop()?.toLowerCase();
      if (
        !videoExtension ||
        !allowedVideoExtensions.includes(videoExtension as any)
      ) {
        return {
          success: false,
          error:
            "Unsupported video format. Allowed formats: .mp4 (H.264/AAC) or .3gp (H.264/AAC)",
        };
      }

      resourceType = "video";
      folder = "whatsapp_videos";
    } else if (image) {
      fileToUpload = image;
      resourceType = "image";
      folder = "whatsapp_images";
    } else if (file) {
      fileToUpload = file;
      resourceType = "raw";
      folder = "whatsapp_files";
    }

    if (!fileToUpload) {
      return { success: false, error: "No valid file to upload." };
    }

    // Helper to build WhatsApp-compatible Cloudinary URL (MP4 container, H.264 video, AAC audio)
    const buildWhatsAppVideoUrl = (secureUrl: string): string => {
      // Insert transformation segment right after "/upload/"
      // and ensure extension ends with .mp4
      const transformation = "f_mp4,q_auto:best,vc_h264,ac_aac";
      const parts = secureUrl.split("/upload/");
      if (parts.length !== 2) return secureUrl; // fallback
      let transformed = `${parts[0]}/upload/${transformation}/${parts[1]}`;
      // Replace extension with .mp4
      transformed = transformed.replace(/\.[a-zA-Z0-9]+$/, ".mp4");
      return transformed;
    };

    // Nota: La validación de duración del video se realiza en el cliente.

    const arrayBuffer = await fileToUpload.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Preparar public_id con extensión cuando sea necesario
    const originalFileName = fileToUpload.name || "";
    const baseName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, "")
      : `${folder}_${Date.now()}`;
    const extensionForRaw = originalFileName.split(".").pop();
    let customPublicId = baseName;
    if (resourceType === "raw") {
      const ext = extensionForRaw || "pdf";
      customPublicId = `${baseName}.${ext}`;
    }

    uploadResult = await new Promise<{
      secure_url?: string;
      public_id?: string;
      error?: any;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: folder,
          public_id: customPublicId,
        },
        (error, result) => {
          if (error) {
            reject({ error });
          } else {
            resolve(result || {});
          }
        },
      );

      const readable = new Readable();
      readable._read = () => {}; // _read is required but you can noop it
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });

    if (uploadResult.error || !uploadResult.secure_url) {
      console.error("Cloudinary upload error:", uploadResult.error);
      return { success: false, error: "Failed to upload file to Cloudinary." };
    }

    // Determine final URL with proper extension/transformations
    let finalUrl: string | undefined;
    if (resourceType === "video") {
      finalUrl = buildWhatsAppVideoUrl(uploadResult.secure_url || "");
    } else if (resourceType === "raw") {
      // Usar Cloudinary URL asegurando incluir extension
      finalUrl = cloudinary.url(customPublicId, {
        resource_type: "raw",
        secure: true,
      });
    } else {
      finalUrl = uploadResult.secure_url;
    }

    // Establecer un nombre por defecto para archivos sin nombre.
    const defaultBaseName = `${folder}_${Date.now()}`;
    const assetName = fileToUpload.name
      ? fileToUpload.name
      : resourceType === "raw"
        ? `${defaultBaseName}.pdf` // Por defecto PDF para archivos genéricos
        : defaultBaseName;

    // Save asset in DB with the processed URL so future re-use is already compatible
    await saveUserAsset({
      name: assetName,
      type: resourceType,
      url: finalUrl,
    });

    return {
      success: true,
      url: finalUrl,
      publicId: uploadResult.public_id,
      resourceType,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    let errorMessage = "An unknown error occurred during file upload.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
};

export const getCloudinarySignature = async ({
  resourceType,
  folder,
  timestamp,
}: {
  resourceType: "image" | "video" | "raw";
  folder: string;
  timestamp: number;
}) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/cloudinary-signature`,
    {
      method: "POST",
      body: JSON.stringify({ resourceType, folder, timestamp }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return res.json();
};

// Delete file from Cloudinary by publicId and resourceType
export const deleteCloudinaryFile = async (
  publicId: string,
  resourceType: "raw" | "image" | "video" = "raw",
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    if (result.result === "ok" || result.result === "not found") {
      return { success: true };
    }
    return { success: false, error: result.result };
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return { success: false, error: (error as Error).message };
  }
};
