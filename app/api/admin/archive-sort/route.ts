import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SPREADSHEET_ID = "1e6qfGbAfYjPxUmJ2MXZLZlu7qZqcxZ9-poFZ60C32hM";
const TIMESTAMP_COL  = 0;

const ARCHIVE_SHEETS = [
  "Copy of ARCHIVE",
  "Archive Pickups",
  "Archive Returns",
];

function parseTimestamp(raw: string): Date {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?/);
  if (match) {
    const [, dd, mm, yyyy, hh = "0", min = "0", ss = "0"] = match;
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(hh), parseInt(min), parseInt(ss));
  }
  return new Date(raw);
}

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient as any });
}

async function sortSheet(
  sheets: ReturnType<typeof google.sheets>,
  sheetName: string
): Promise<{ sheet: string; sorted: number; skipped: boolean; reason?: string }> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'`,
  });

  const allRows = res.data.values ?? [];
  if (allRows.length < 2) {
    return { sheet: sheetName, sorted: 0, skipped: true, reason: "Empty or header only" };
  }

  const headers  = allRows[0];
  const dataRows = allRows.slice(1);

  const sorted = [...dataRows].sort((a, b) => {
    const tsA = parseTimestamp(a[TIMESTAMP_COL] ?? "").getTime();
    const tsB = parseTimestamp(b[TIMESTAMP_COL] ?? "").getTime();
    if (isNaN(tsA) && isNaN(tsB)) return 0;
    if (isNaN(tsA)) return 1;
    if (isNaN(tsB)) return -1;
    return tsA - tsB;
  });

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers, ...sorted] },
  });

  return { sheet: sheetName, sorted: dataRows.length, skipped: false };
}

export async function POST(_req: NextRequest) {
  try {
    const sheetsClient = await getSheets();
    const results = [];
    for (const sheetName of ARCHIVE_SHEETS) {
      const result = await sortSheet(sheetsClient, sheetName);
      results.push(result);
    }
    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("[Sort Archive Error]", err);
    return NextResponse.json({ success: false, message: err.message ?? "Unknown error" }, { status: 500 });
  }
}