import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SPREADSHEET_ID = "1e6qfGbAfYjPxUmJ2MXZLZlu7qZqcxZ9-poFZ60C32hM";

// Sheet config — source → archive destination
const SHEET_CONFIG = {
  master: {
    source: "MASTER LIST",
    archive: "Copy of ARCHIVE",
    label: "Master List",
  },
  pickups: {
    source: "Copy of Pickupsv1",
    archive: "Archive Pickups",
    label: "Pickups",
  },
  returns: {
    source: "Copy of Returns",
    archive: "Archive Returns",
    label: "Returns",
  },
} as const;

type SheetKey = keyof typeof SHEET_CONFIG;
const TIMESTAMP_COL = 0;

function parseTimestamp(raw: string): Date {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?/);
  if (match) {
    const [, dd, mm, yyyy, hh = "0", min = "0", ss = "0"] = match;
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(hh), parseInt(min), parseInt(ss));
  }
  return new Date(raw);
}

function getDateRange(range: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  switch (range) {
    case "today":
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0), end: now };
    case "last7days":
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0), end: now };
    case "last30days":
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0), end: now };
    case "custom": {
      if (!customStart || !customEnd) throw new Error("Custom range requires start and end dates.");
      const [sy, sm, sd] = customStart.split("-").map(Number);
      const [ey, em, ed] = customEnd.split("-").map(Number);
      return { start: new Date(sy, sm - 1, sd, 0, 0, 0, 0), end: new Date(ey, em - 1, ed, 23, 59, 59, 999) };
    }
    default:
      throw new Error(`Invalid range: ${range}`);
  }
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

async function ensureArchiveTabExists(
  sheets: ReturnType<typeof google.sheets>,
  tabName: string
) {
  // Get all existing sheet names
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = meta.data.sheets?.map((s) => s.properties?.title) ?? [];

  if (!existing.includes(tabName)) {
    // Create the tab if it doesn't exist
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });
    console.log(`[Archive] Created new tab: ${tabName}`);
  }
}

async function archiveSheet(
  sheets: ReturnType<typeof google.sheets>,
  sheetKey: SheetKey,
  start: Date,
  end: Date,
  archivedBy: string
) {
  const { source, archive, label } = SHEET_CONFIG[sheetKey];

  // 1. Ensure archive tab exists (creates it if missing)
  await ensureArchiveTabExists(sheets, archive);

  // 2. Fetch source sheet
  const sourceRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${source}'`,
  });

  const allRows = sourceRes.data.values ?? [];
  if (allRows.length < 2) return { label, archived: 0, skipped: true, reason: "No data rows" };

  const headers = allRows[0];
  const dataRows = allRows.slice(1);

  // 3. Filter by date range
  const rowsToArchive: string[][] = [];
  const rowsToKeep: string[][] = [headers];

  dataRows.forEach((row) => {
    const rawTimestamp = row[TIMESTAMP_COL];
    if (!rawTimestamp) { rowsToKeep.push(row); return; }
    const ts = parseTimestamp(rawTimestamp);
    if (!isNaN(ts.getTime()) && ts >= start && ts <= end) {
      rowsToArchive.push(row);
    } else {
      rowsToKeep.push(row);
    }
  });

  if (rowsToArchive.length === 0) {
    return { label, archived: 0, skipped: true, reason: "No records in date range" };
  }

  // 4. Sort archived rows ascending
  rowsToArchive.sort((a, b) => {
    const tsA = parseTimestamp(a[TIMESTAMP_COL] ?? "").getTime();
    const tsB = parseTimestamp(b[TIMESTAMP_COL] ?? "").getTime();
    if (isNaN(tsA) && isNaN(tsB)) return 0;
    if (isNaN(tsA)) return 1;
    if (isNaN(tsB)) return -1;
    return tsA - tsB;
  });

  // 5. Fetch existing archive rows to append after
  const archiveRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${archive}'`,
  });
  const archiveRows = archiveRes.data.values ?? [];
  const archiveStartRow = archiveRows.length === 0 ? 1 : archiveRows.length + 1;
  const appendData = archiveRows.length === 0 ? [headers, ...rowsToArchive] : rowsToArchive;

  // 6. Write to archive tab
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${archive}'!A${archiveStartRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: appendData },
  });

  // 7. Clear source and rewrite kept rows
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${source}'`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${source}'!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rowsToKeep },
  });

  return { label, archived: rowsToArchive.length, skipped: false };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { range, customStart, customEnd, archivedBy = "Admin", sheets: selectedSheets } = body;

    // selectedSheets: array of SheetKey[], e.g. ["master", "pickups", "returns"]
    const targets: SheetKey[] = Array.isArray(selectedSheets) && selectedSheets.length > 0
      ? selectedSheets
      : ["master", "pickups", "returns"];

    const { start, end } = getDateRange(range, customStart, customEnd);
    const sheetsClient = await getSheets();

    // Archive each selected sheet
    const results = await Promise.all(
      targets.map((key) => archiveSheet(sheetsClient, key, start, end, archivedBy))
    );

    const totalArchived = results.reduce((sum, r) => sum + r.archived, 0);

    if (totalArchived === 0) {
      return NextResponse.json({
        success: false,
        message: `No records found in the selected date range across all selected sheets.`,
        results,
      });
    }

    const historyEntry = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      range,
      customStart,
      customEnd,
      records: totalArchived,
      archivedBy,
      sheets: results.filter((r) => !r.skipped).map((r) => `${r.label} (${r.archived})`).join(", "),
    };

    return NextResponse.json({ success: true, history: historyEntry, archivedCount: totalArchived, results });
  } catch (err: any) {
    console.error("[Archive API Error]", err);
    return NextResponse.json({ success: false, message: err.message ?? "Unknown error" }, { status: 500 });
  }
}