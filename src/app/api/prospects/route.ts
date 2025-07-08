import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { onBoardUser } from "@/actions/user";
import { db } from "@/utils";

const searchSchema = z.object({
  // title: z.string().optional(), // Removed from frontend
  // company: z.string().optional(), // Removed from frontend
  location: z.string().optional(), // City or Country
  industry: z.string().optional(),
  // seniority: z.string().optional(), // Removed from frontend
  employeeSize: z.string().optional(),
});

/**
 * @swagger
 * /api/prospects:
 *   post:
 *     summary: Search for prospects using Apollo.io
 *     description: Searches for prospects via the Apollo.io API and saves them to the database.
 *     tags:
 *       - Prospects
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               # Removed title and company from schema for B2B lead generation
 *               # title:
 *               #   type: string
 *               #   description: The job title to search for.
 *               # company:
 *               #   type: string
 *               #   description: The company to search for (optional).
 *     responses:
 *       200:
 *         description: A list of found and saved prospects.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Prospect'
 *       400:
 *         description: Invalid input.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error or misconfigured API key.
 */
export async function POST(req: NextRequest) {
  const user = await onBoardUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.data.id;

  try {
    const pdlApiKey = process.env.PDL_API_KEY;
    if (!pdlApiKey) {
      console.error("PDL API key is not configured.");
      return NextResponse.json(
        {
          error:
            "Internal server error: Prospect finder no configurado (falta PDL_API_KEY).",
        },
        { status: 500 },
      );
    }

    const body = await req.json();
    const validation = searchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 },
      );
    }

    const { location, industry, employeeSize } = validation.data; // Removed 'company'

    // ------------------ Construcción del payload para PDL ------------------
    const must: any[] = [];

    // if (company) must.push({ match_phrase: { job_company_name: company } }); // Removed: no longer searching by company name

    if (location) must.push({ term: { "location.country": location } });
    if (industry) must.push({ term: { industry: industry } }); // Changed from job_company_industry

    if (employeeSize) {
      // PDL acepta valores exactos tipo "51-200" "5000-10000" o "10001+"
      must.push({ term: { size: employeeSize } }); // Changed from job_company_size
    }

    // If no search criteria provided, return an empty array directly
    if (must.length === 0) {
      return NextResponse.json([]);
    }

    const pdlPayload = {
      size: 25,
      query: {
        bool: { must }, // Simplified to only use 'must'
      },
    };

    // ------------------ Llamada a PDL ------------------
    // Changed endpoint to Company Search API
    const pdlResponse = await fetch(
      "https://api.peopledatalabs.com/v5/company/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": pdlApiKey,
        },
        body: JSON.stringify(pdlPayload),
      },
    );

    if (!pdlResponse.ok) {
      const errorText = await pdlResponse.text();
      console.error("PDL API Error:", errorText);
      return NextResponse.json(
        { error: `Error PDL: ${pdlResponse.statusText}` },
        { status: pdlResponse.status },
      );
    }

    const { data: companies = [] } = await pdlResponse.json(); // Renamed 'people' to 'companies'
    if (companies.length === 0) return NextResponse.json([]);

    // Temporarily returning raw company data, database upsert will be re-evaluated
    return NextResponse.json(companies);

    /*
    const savedProspects: any[] = [];

    for (const p of people) {
      const primaryEmail = p.email || (p.emails && p.emails[0]);
      if (!primaryEmail) continue;

      const prospectData = {
        name: p.full_name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
        email: primaryEmail,
        title: p.job_title ?? "N/A",
        company: p.job_company_name ?? "N/A",
        source: "PDL",
        ownerId: userId,
      };

      const saved = await db.prospect.upsert({
        where: { email: primaryEmail },
        update: { ...prospectData, updatedAt: new Date() },
        create: prospectData,
      });
      savedProspects.push(saved);
    }

    return NextResponse.json(savedProspects);
    */
  } catch (error) {
    console.error("[PROSPECTS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
