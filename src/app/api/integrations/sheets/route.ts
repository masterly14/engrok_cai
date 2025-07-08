import { getAccessToken } from "@/actions/nango";
import { db } from "@/utils";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const connection = await db.connection.findFirst({
      where: {
        userId: userId,
        providerConfigKey: "google-sheet",
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Google Sheets connection not found for this user." },
        { status: 404 },
      );
    }

    const accessToken = await getAccessToken(
      connection.connectionId,
      "google-sheet",
    );

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unable to retrieve access token" },
        { status: 500 },
      );
    }

    switch (action) {
      case "listSpreadsheets": {
        const response = await axios.get(
          "https://www.googleapis.com/drive/v3/files",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
              fields: "files(id,name)",
              pageSize: 100,
            },
          },
        );
        return NextResponse.json(response.data.files || []);
      }
      case "listSheets": {
        const spreadsheetId = searchParams.get("spreadsheetId");
        if (!spreadsheetId) {
          return NextResponse.json(
            { error: "spreadsheetId is required" },
            { status: 400 },
          );
        }
        const response = await axios.get(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              fields: "sheets.properties",
            },
          },
        );
        return NextResponse.json(response.data.sheets || []);
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Sheets GET error:", error.response?.data || error);
    return NextResponse.json(
      { error: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (action !== "appendData") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const connection = await db.connection.findFirst({
      where: {
        userId: userId,
        providerConfigKey: "google-sheet",
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Google Sheets connection not found for this user." },
        { status: 404 },
      );
    }

    const { spreadsheetId, sheetName, column, value } = await request.json();

    if (!spreadsheetId || !sheetName || !column || value === undefined) {
      return NextResponse.json(
        { error: "spreadsheetId, sheetName, column and value are required" },
        { status: 400 },
      );
    }

    const accessToken = await getAccessToken(
      connection.connectionId,
      "google-sheet",
    );

    const range = `${sheetName}!${column}:${column}`;

    const body = {
      values: [[value]],
    };

    const response = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        range,
      )}:append`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        params: {
          valueInputOption: "USER_ENTERED",
        },
      },
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Sheets POST error:", error.response?.data || error);
    return NextResponse.json(
      { error: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 },
    );
  }
}
