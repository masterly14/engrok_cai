import { NextRequest, NextResponse } from "next/server"
import { db } from "@/utils"
import { onBoardUser } from "@/actions/user"

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const user = await onBoardUser()
    if (!user?.data?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const template = await db.messageTemplate.findFirst({
      where: {
        id: params.templateId,
        chatAgent: {
          userId: user.data.id,
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("[GET /api/templates/[templateId]] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 