import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils";
import { onBoardUser } from "@/actions/user";
import { randomUUID } from "crypto";

export async function GET(_req: NextRequest) {
  try {
    console.log("[CRM Access Token] Starting GET request");
    const user = await onBoardUser();
    console.log("[CRM Access Token] User result:", user);
    if (!user?.data?.id) {
      console.log("[CRM Access Token] No user found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRM Access Token] Looking for existing token for user:", user.data.id);
    let accessTokenRecord = await db.accessToken.findFirst({
      where: {
        userId: user.data.id,
        name: "crm-whatsapp-integration",
      },
    });

    console.log("[CRM Access Token] Existing token found:", !!accessTokenRecord);

    // Si no existe, crearlo
    if (!accessTokenRecord) {
      console.log("[CRM Access Token] Creating new token");
      const tokenValue = randomUUID();
      console.log("[CRM Access Token] Generated token value:", tokenValue);
      const now = new Date();
      console.log("[CRM Access Token] About to create record in DB");
      accessTokenRecord = await db.accessToken.create({
        data: {
          userId: user.data.id,
          name: "crm-whatsapp-integration",
          accessToken: tokenValue,
          createdAt: now,
          updatedAt: now,
        },
      });
      console.log("[CRM Access Token] Record created successfully:", accessTokenRecord);
    }
    console.log("accessTokenRecord", accessTokenRecord);

    console.log("[CRM Access Token] Returning response with token:", accessTokenRecord.accessToken);
    return NextResponse.json({ accessToken: accessTokenRecord.accessToken });
  } catch (error: any) {
    console.error("[CRM Access Token] Detailed error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      meta: error.meta,
    });
    console.error("[CRM] Error obteniendo access token:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 },
    );
  }
} 