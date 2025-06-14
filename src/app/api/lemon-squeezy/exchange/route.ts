import { db } from "@/utils";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { code, email } = await req.json();
  if (!code || !email) {
    return NextResponse.json(
      { error: "Missing code or email" },
      { status: 400 },
    );
  }


  const user = await db.user.findUnique({ where: { email } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  
  return NextResponse.json({ ok: true, received: true });
} 