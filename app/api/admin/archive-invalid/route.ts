import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const MASTER_SHEET_NAME = "MASTER LIST";
const ARCHIVE_SHEET_NAME = "Archive of Invalid Data";

// Column indices in MASTER LIST (0-based)
const COL_TIMESTAMP = 0;  // A - Timestamp
const COL_FULL_NAME = 1;  // B - Full Name
const COL_PHONE     = 2;  // C - Phone
const COL_REF_ID    = 3;  // D - Order / RMA ref
const COL_CREDIT    = 4;  // E - Credit Card (Last 4)
const COL_VALID_ID  = 5;  // F - Valid ID Type
const COL_PAYMENT   = 6;  // G - Payment Method
const COL_CAR_PARK  = 7;  // H - Car Park Bay
const COL_STATUS    = 8;  // I - K1 Status
const COL_AGENT     = 9;  // J - Agent
const COL_TYPE      = 10; // K - Transaction Type
const COL_NOTES     = 11; // L - Notes
const COL_NETO_ID   = 12; // M - NetoOrderID

type MissingItem = {
  timestamp: string;
  fullName: string;
  phone: string;
  ref: string;
  paymentMethod: string;
  carParkBay: string;
  status: string;
  type: string;
  missing: string[];
};

type ArchiveResult = {
  archived: number;
  deleted: number;
  skipped: number;  // matched 2+ rows — archived but NOT deleted
  notFound: number; // matched 0 rows — archived but NOT deleted
};

async function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google credentials");
  }

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/** General normalisation: trim + lowercase + collapse internal whitespace */
function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Phone normalisation: strip ALL whitespace so "0423 173 894" === "0423173894" */
function normPhone(s: unknown) {
  return String(s ?? "").replace(/\s+/g, "").toLowerCase();
}

/**
 * Ensures the "Archive of Invalid Data" tab exists with headers.
 * Creates it if missing.
 */
async function ensureArchiveSheet(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string
) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets?.some(
    (s) => s.properties?.title === ARCHIVE_SHEET_NAME
  );

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          { addSheet: { properties: { title: ARCHIVE_SHEET_NAME } } },
        ],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${ARCHIVE_SHEET_NAME}'!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            "Archived At (Sydney)",
            "Original Timestamp",
            "Transaction Type",
            "Ref / Order / RMA",
            "Full Name",
            "Phone",
            "Credit Card (Last 4)",
            "Valid ID Type",
            "Payment Method",
            "Car Park Bay",
            "K1 Status",
            "Agent",
            "Notes",
            "NetoOrderID",
            "Missing / Invalid Fields",
            "Deletion Status",
          ],
        ],
      },
    });
  }
}

/**
 * POST /api/admin/archive-invalid
 *
 * Body: { items: MissingItem[] }
 *
 * For each item:
 *   1. Match against MASTER LIST using Timestamp + Full Name + Phone
 *   2. Exactly 1 match  → archive full row + delete from MASTER LIST
 *   3. Zero matches     → archive partial data, mark "Not found in MASTER LIST"
 *   4. 2+ matches       → archive partial data, mark "Skipped — N duplicate rows found"
 *
 * Deletions are applied in reverse row order so indices don't shift mid-operation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: MissingItem[] = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided" },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // ── 1. Fetch all rows from MASTER LIST ──────────────────────────────────
    const masterResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${MASTER_SHEET_NAME}'!A:M`,
    });
    const masterRows: any[][] = masterResp.data.values ?? [];

    // Get the numeric sheetId for MASTER LIST (required for batchUpdate deletions)
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const masterSheetMeta = meta.data.sheets?.find(
      (s) => s.properties?.title === MASTER_SHEET_NAME
    );
    const masterSheetId = masterSheetMeta?.properties?.sheetId;
    if (masterSheetId === undefined) {
      throw new Error(`Sheet "${MASTER_SHEET_NAME}" not found`);
    }

    // ── 2. Ensure archive tab exists ────────────────────────────────────────
    await ensureArchiveSheet(sheets, spreadsheetId);

    // ── 3. Match each item against MASTER LIST ──────────────────────────────
    const archivedAt = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());

    const archiveRows: any[][] = [];
    const rowIndicesToDelete: number[] = []; // 0-based sheet row indices to delete

    let deleted = 0;
    let skipped = 0;
    let notFound = 0;

    for (const item of items) {
      const itemTs    = norm(item.timestamp);
      const itemName  = norm(item.fullName);
      const itemPhone = normPhone(item.phone);

      // Find all matching rows (skip header row at index 0)
      const matches: number[] = [];
      for (let i = 1; i < masterRows.length; i++) {
        const row = masterRows[i];
        if (
          norm(row[COL_TIMESTAMP])     === itemTs &&
          norm(row[COL_FULL_NAME])     === itemName &&
          normPhone(row[COL_PHONE])    === itemPhone
        ) {
          matches.push(i);
        }
      }

      let deletionStatus: string;
      let fullRow: any[] | null = null;

      if (matches.length === 0) {
        deletionStatus = "Not found in MASTER LIST";
        notFound++;
      } else if (matches.length > 1) {
        deletionStatus = `Skipped — ${matches.length} duplicate rows found`;
        skipped++;
      } else {
        // Exactly 1 match — safe to delete
        fullRow = masterRows[matches[0]];
        rowIndicesToDelete.push(matches[0]);
        deletionStatus = "Deleted from MASTER LIST";
        deleted++;
      }

      // Archive row: prefer full master data when available, fall back to item fields
      archiveRows.push([
        archivedAt,
        fullRow?.[COL_TIMESTAMP] ?? item.timestamp,
        fullRow?.[COL_TYPE]      ?? item.type,
        fullRow?.[COL_REF_ID]    ?? item.ref,
        fullRow?.[COL_FULL_NAME] ?? item.fullName,
        fullRow?.[COL_PHONE]     ?? item.phone,
        fullRow?.[COL_CREDIT]    ?? "",
        fullRow?.[COL_VALID_ID]  ?? "",
        fullRow?.[COL_PAYMENT]   ?? item.paymentMethod,
        fullRow?.[COL_CAR_PARK]  ?? item.carParkBay,
        fullRow?.[COL_STATUS]    ?? item.status,
        fullRow?.[COL_AGENT]     ?? "",
        fullRow?.[COL_NOTES]     ?? "",
        fullRow?.[COL_NETO_ID]   ?? "",
        (item.missing ?? []).join(", "),
        deletionStatus,
      ]);
    }

    // ── 4. Append rows to archive sheet ─────────────────────────────────────
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${ARCHIVE_SHEET_NAME}'!A:P`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: archiveRows },
    });

    // ── 5. Delete matched rows from MASTER LIST ─────────────────────────────
    // Sort descending so deleting a lower row doesn't shift the indices of rows
    // that still need to be deleted above it.
    if (rowIndicesToDelete.length > 0) {
      const sortedDesc = [...rowIndicesToDelete].sort((a, b) => b - a);

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: sortedDesc.map((rowIndex) => ({
            deleteDimension: {
              range: {
                sheetId: masterSheetId,
                dimension: "ROWS",
                startIndex: rowIndex,     // 0-based, inclusive
                endIndex: rowIndex + 1,   // 0-based, exclusive
              },
            },
          })),
        },
      });
    }

    return NextResponse.json({
      success: true,
      result: {
        archived: archiveRows.length,
        deleted,
        skipped,
        notFound,
      } satisfies ArchiveResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}