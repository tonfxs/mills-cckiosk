/**
 * ONE-TIME SCRIPT: Sort existing archive sheets by Timestamp ascending.
 * Sorts: "Copy of ARCHIVE", "Archive Pickups", "Archive Returns"
 *
 * Run with:
 *   npx tsx scripts/sort-archive.ts
 *
 * Prerequisites:
 *   npm install -D tsx
 *   npm install googleapis dotenv
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { google } from "googleapis";

// ── Load .env.local then fallback to .env ────────────────────────────────────
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath      = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log("🔑  Loaded env from .env.local");
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("🔑  Loaded env from .env");
} else {
  console.error("❌  No .env.local or .env file found in project root.");
  process.exit(1);
}

const SPREADSHEET_ID = "1e6qfGbAfYjPxUmJ2MXZLZlu7qZqcxZ9-poFZ60C32hM";
const TIMESTAMP_COL  = 0;

// ── All archive tabs to sort ──────────────────────────────────────────────────
const ARCHIVE_SHEETS = [
  "Copy of ARCHIVE",
  "Archive Pickups",
  "Archive Returns",
];

// ── Parse DD/MM/YYYY HH:MM:SS ─────────────────────────────────────────────────
function parseTimestamp(raw: string): Date {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?/);
  if (match) {
    const [, dd, mm, yyyy, hh = "0", min = "0", ss = "0"] = match;
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(hh), parseInt(min), parseInt(ss));
  }
  return new Date(raw);
}

async function sortSheet(
  sheets: ReturnType<typeof google.sheets>,
  sheetName: string
) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`📥  Fetching '${sheetName}'...`);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'`,
  });

  const allRows = res.data.values ?? [];
  console.log(`📋  Total rows (including header): ${allRows.length}`);

  if (allRows.length < 2) {
    console.log(`⚠️   Skipping — empty or header only.`);
    return;
  }

  const headers  = allRows[0];
  const dataRows = allRows.slice(1);
  console.log(`📊  Data rows to sort: ${dataRows.length}`);
  console.log(`🔎  Sample: "${dataRows[0]?.[TIMESTAMP_COL]}" ... "${dataRows[dataRows.length - 1]?.[TIMESTAMP_COL]}"`);

  // Sort ascending
  const sorted = [...dataRows].sort((a, b) => {
    const tsA = parseTimestamp(a[TIMESTAMP_COL] ?? "").getTime();
    const tsB = parseTimestamp(b[TIMESTAMP_COL] ?? "").getTime();
    if (isNaN(tsA) && isNaN(tsB)) return 0;
    if (isNaN(tsA)) return 1;
    if (isNaN(tsB)) return -1;
    return tsA - tsB;
  });

  console.log("🔍  First 3 after sort:");
  sorted.slice(0, 3).forEach((r, i) => console.log(`   ${i + 1}. ${r[TIMESTAMP_COL]}`));
  console.log("🔍  Last 3 after sort:");
  sorted.slice(-3).forEach((r, i) => console.log(`   ${sorted.length - 2 + i}. ${r[TIMESTAMP_COL]}`));

  console.log("🗑️   Clearing sheet...");
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'`,
  });

  console.log("✍️   Writing sorted rows...");
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers, ...sorted] },
  });

  console.log(`✅  Done — ${sorted.length} rows written in ascending order.`);
}

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email) { console.error("❌  Missing GOOGLE_SERVICE_ACCOUNT_EMAIL"); process.exit(1); }
  if (!key)   { console.error("❌  Missing GOOGLE_PRIVATE_KEY");           process.exit(1); }

  console.log(`📧  Service account: ${email}`);

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth: (await auth.getClient()) as any });

  for (const sheetName of ARCHIVE_SHEETS) {
    await sortSheet(sheets, sheetName);
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log("🎉  All archive sheets sorted successfully!");
}

main().catch((err) => {
  console.error("❌  Error:", err.message ?? err);
  process.exit(1);
});