// app/api/admin/update-notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

const TABS: { name: string; orderCol: string; notesCol: string }[] = [
  { name: "MASTER LIST",       orderCol: "D", notesCol: "L" },
  { name: "Copy of Pickupsv1", orderCol: "D", notesCol: "K" },
];

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return auth.getClient();
}

export async function POST(req: NextRequest) {
  try {
    const { orderNumber, notes } = await req.json();

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "orderNumber is required" }, { status: 400 });
    }

    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth: authClient as any });

    const updated: string[] = [];

    // Search ALL tabs and update every match (order can exist in multiple sheets)
    for (const tab of TABS) {
      const readRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${tab.name}'!${tab.orderCol}:${tab.orderCol}`,
      });

      const rows = readRes.data.values ?? [];
      const rowIndex = rows.findIndex(
        (row, i) => i > 0 && String(row[0] ?? "").trim() === String(orderNumber).trim()
      );

      if (rowIndex === -1) continue;

      const sheetRow = rowIndex + 1;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'${tab.name}'!${tab.notesCol}${sheetRow}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[notes ?? ""]],
        },
      });

      console.log(`[update-notes] Updated order ${orderNumber} in "${tab.name}" row ${sheetRow} col ${tab.notesCol}`);
      updated.push(tab.name);
    }

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: `Order ${orderNumber} not found in any sheet tab` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tabs: updated });
  } catch (e: any) {
    console.error("[update-notes] error:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}