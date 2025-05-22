// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir el buffer a Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ resource_type: "image" }, (error: unknown, result: any) => {
        if (error) return reject(error)
        resolve(result)
      })
      // @ts-ignore - Node.js Buffer tiene .end()
      uploadStream.end(buffer)
    })

    return NextResponse.json({ url: uploadResult.secure_url }, { status: 200 })
  } catch (error: any) {
    console.error("Cloudinary upload error", error)
    return NextResponse.json({ message: error.message || "Upload failed" }, { status: 500 })
  }
} 