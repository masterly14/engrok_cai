import { NextRequest, NextResponse } from "next/server"
import Papa from "papaparse"
import { db } from "@/utils"

// Expected JSON body
// {
//   campaignName: string,
//   phoneNumberId: string,         // local DB id
//   phoneNumberVapiId: string,     // the vapi phoneNumberId
//   assistantId: string,           // default assistant vapiId
//   csvData: string,               // raw CSV text
//   phoneField: string,            // column containing phone numbers
//   variableMappings: Record<string,string>, // varName -> column
//   templates: {
//     firstMessage?: string,
//     endCallMessage?: string,
//     voicemailMessage?: string
//   },
//   systemPrompt?: string,
//   advancedJson?: string
// }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      campaignName,
      phoneNumberId,
      phoneNumberVapiId,
      workflowId,
      csvData,
      phoneField,
    } = body

    if (!csvData || !phoneField || !phoneNumberVapiId || !workflowId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Parse CSV
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true })
    if (parsed.errors.length) {
      return NextResponse.json({ error: parsed.errors[0].message }, { status: 400 })
    }

    const rows = parsed.data as Record<string, string>[]

    // Assistant overrides fijos solicitados por el cliente
    const fixedAssistantOverrides = {
      model: {
        provider: "groq",
        model: "gemma2-9b-it",
      },
      transcriber: {
        provider: "deepgram",
        model: "nova-3",
        language: "multi",
      },
    }

    // Build customers array
    const customers = rows.map((row) => {
      // Normalizar número a formato +E.164 sencillo (añade '+' si falta)
      let rawNumber = (row[phoneField] ?? "").toString().trim()
      if (rawNumber && !rawNumber.startsWith("+")) {
        rawNumber = `+${rawNumber}`
      }

      return {
        number: rawNumber,
        assistantOverrides: fixedAssistantOverrides,
      }
    })

    const payload: any = {
      name: campaignName || `Campaign ${new Date().toISOString()}`,
      phoneNumberId: phoneNumberVapiId,
      workflowId,
      customers,
    }

    console.log("[VAPI] Payload about to be sent:\n", JSON.stringify(payload, null, 2))

    // Call Vapi
    const res = await fetch("https://api.vapi.ai/campaign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    const vapiData = await res.json()

    if (!res.ok) {
      console.error("VAPI error", vapiData)
      return NextResponse.json({ error: vapiData }, { status: res.status })
    }

    // Obtener userId directamente del número para evitar UUID vacíos
    const phoneRecord = await db.phoneNumber.findUnique({
      where: { id: phoneNumberId },
      select: { userId: true },
    })

    if (!phoneRecord) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 })
    }

    const saved = await db.campaign.create({
      data: {
        name: payload.name,
        status: "RUNNING",
        vapiCampaignId: vapiData.id,
        userId: phoneRecord.userId,
        phoneNumberId,
        customers: rows as any,
      },
    })

    return NextResponse.json({ campaign: saved, vapi: vapiData })
  } catch (e: any) {
    console.error("campaign create error", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
} 