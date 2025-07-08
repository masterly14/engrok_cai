import { NextRequest, NextResponse } from "next/server";
import { onBoardUser } from "@/actions/user";
import { db } from "@/utils";

export async function GET(_req: NextRequest) {
  try {
    const user = await onBoardUser();
    if (!user?.data?.id) return NextResponse.json({ notifications: [] });

    const notifications = await db.notification.findMany({
      where: { userId: user.data.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await onBoardUser();
    if (!user?.data?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
