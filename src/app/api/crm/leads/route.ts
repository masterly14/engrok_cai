import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/auth";
import { db } from "@/utils";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leads = await db.lead.findMany({
      where: { userId: user.id },
      include: { stage: true },
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      company,
      email,
      phone,
      stageId,
      lastContact,
      status,
      tags,
      notes,
      value,
    } = body;

    if (!name || !company || !email || !phone || !stageId || !lastContact) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, company, email, phone, stageId, lastContact are required.",
        },
        { status: 400 },
      );
    }

    const stage = await db.stage.findUnique({
      where: {
        id_userId: {
          id: stageId,
          userId: user.id,
        },
      },
    });

    if (!stage) {
      return NextResponse.json(
        { error: "Stage not found for this user." },
        { status: 404 },
      );
    }

    const newLead = await db.lead.create({
      data: {
        name,
        company,
        email,
        phone,
        stageId,
        userId: user.id,
        lastContact,
        status,
        tags,
        notes,
        value,
      },
    });

    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json(
        { error: "A lead with this information already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
