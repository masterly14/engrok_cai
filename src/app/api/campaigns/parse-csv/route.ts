import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";

/**
 * POST /api/campaigns/parse-csv
 *
 * Espera un FormData con una entrada `file` que contenga un CSV.
 * Devuelve:
 *  {
 *    headers: string[],   // nombres de las columnas
 *    sample: any[]        // primeras 5 filas para vista previa
 *  }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const csvText = Buffer.from(arrayBuffer).toString("utf-8");

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (parsed.errors.length) {
      console.error("CSV parse errors:", parsed.errors);
      return NextResponse.json(
        { error: parsed.errors[0].message || "CSV parse error" },
        { status: 400 }
      );
    }

    const headers = parsed.meta.fields ?? [];
    const sample = (parsed.data as any[]).slice(0, 5);

    return NextResponse.json({ headers, sample });
  } catch (error: any) {
    console.error("parse-csv error", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 