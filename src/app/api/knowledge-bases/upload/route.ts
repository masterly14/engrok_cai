import { NextRequest, NextResponse } from "next/server";
import { onBoardUser } from "@/actions/user";
import { db } from "@/utils";
import { v4 as uuidv4 } from "uuid";
import { uploadFileToR2, generateR2Key } from "@/lib/r2-utils";

// Temporal: Sin Redis para testing
let redis: any = null;

// Intentar conectar a Redis si las variables están disponibles
if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
  try {
    console.log("[KB Upload API] Attempting Redis connection with URL:", process.env.REDIS_URL);
    const { Redis } = require("@upstash/redis");
    redis = new (Redis as any)({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
    console.log("[KB Upload API] Redis connected successfully");
  } catch (err) {
    console.warn("[KB Upload API] Failed to connect to Redis:", err);
  }
} else {
  console.warn("[KB Upload API] Redis credentials not found, running without Redis");
  console.log("[KB Upload API] REDIS_URL:", process.env.REDIS_URL ? "Set" : "Not set");
  console.log("[KB Upload API] REDIS_TOKEN:", process.env.REDIS_TOKEN ? "Set" : "Not set");
}

const STREAM_KEY = "incoming_messages";

export async function POST(request: NextRequest) {
  console.log("[KB Upload API] Starting upload process...");
  
  try {
    // 1. Autenticación
    console.log("[KB Upload API] Authenticating user...");
    const onboard = await onBoardUser();
    if (!onboard) {
      console.log("[KB Upload API] Authentication failed");
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const userId = onboard.data.id;
    console.log("[KB Upload API] User authenticated:", userId);

    // 2. Leer FormData
    console.log("[KB Upload API] Reading FormData...");
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    console.log("[KB Upload API] Files received:", files.length);

    if (!files.length) {
      console.log("[KB Upload API] No files provided");
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const kbId = uuidv4();
    const kbName =
      (formData.get("name") as string | null) ??
      `KB-${new Date().toISOString()}`;

    console.log("[KB Upload API] Creating KB:", { kbId, kbName });

    // 3. Subir archivos a R2 y construir payload
    console.log("[KB Upload API] Uploading files to R2...");
    const r2Keys: string[] = [];
    for (const file of files) {
      console.log("[KB Upload API] Processing file:", file.name);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const r2Key = generateR2Key(file.name, userId);
      
      await uploadFileToR2(r2Key, buffer, file.type);
      r2Keys.push(r2Key);
      console.log("[KB Upload API] File uploaded to R2:", r2Key);
    }

    // 4. Insertar registro preliminar en la BD
    console.log("[KB Upload API] Creating DB record...");
    await db.knowledgeBase.create({
      data: {
        id: kbId,
        userId,
        name: kbName,
        trieveApiKey: "", // se completará al procesar
        credentialId: uuidv4(), // placeholder
      },
    });
    console.log("[KB Upload API] DB record created");

    // 5. Encolar evento para el worker (solo si Redis está disponible)
    if (redis) {
      console.log("[KB Upload API] Enqueueing to Redis stream...");
      const payload = {
        kind: "kb_upload",
        kbId,
        userId,
        files: r2Keys,
      };
      
      try {
        const result = await redis.xadd(STREAM_KEY, "*", { payload: JSON.stringify(payload) });
        console.log("[KB Upload API] Successfully enqueued to Redis:", result);
      } catch (err) {
        console.error("[KB Upload API] Failed to push to Redis stream", err);
      }
    } else {
      console.log("[KB Upload API] Redis not available, skipping enqueue");
      // TODO: Implementar procesamiento directo aquí si no hay Redis
    }

    console.log("[KB Upload API] Upload process completed successfully");
    return NextResponse.json({ kbId });
  } catch (err: any) {
    console.error("[KB Upload API] Error uploading knowledge base", err);
    return NextResponse.json(
      { message: "Failed to upload knowledge base", error: err.message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    console.log("[KB Upload API] Testing Redis connection...");
    if (redis) {
      // Usar un comando compatible con Upstash Redis REST API
      await redis.set("test", "ping");
      const result = await redis.get("test");
      console.log("[KB Upload API] Redis connection successful:", result);
      return NextResponse.json({ status: "Redis connected", test: result });
    } else {
      console.log("[KB Upload API] Redis not configured");
      return NextResponse.json({ status: "Redis not configured" });
    }
  } catch (err) {
    console.error("[KB Upload API] Redis connection failed:", err);
    return NextResponse.json({ error: "Redis connection failed" }, { status: 500 });
  }
} 