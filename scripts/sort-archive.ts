/**
 * ONE-TIME SCRIPT: Sort existing "Copy of ARCHIVE" rows by Timestamp ascending.
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

// ── Load .env.local (Next.js convention) then fallback to .env ───────────────
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
const ARCHIVE_SHEET  = "Copy of ARCHIVE";
const TIMESTAMP_COL  = 0;

// ── Parse DD/MM/YYYY HH:MM:SS ────────────────────────────────────────────────
function parseTimestamp(raw: string): Date {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?/);
  if (match) {
    const [, dd, mm, yyyy, hh = "0", min = "0", ss = "0"] = match;
    return new Date(
      parseInt(yyyy),
      parseInt(mm) - 1,
      parseInt(dd),
      parseInt(hh),
      parseInt(min),
      parseInt(ss)
    );
  }
  return new Date(raw);
}

async function main() {
  // ── Validate env vars ───────────────────────────────────────────────────────
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email) { console.error("❌  Missing GOOGLE_SERVICE_ACCOUNT_EMAIL"); process.exit(1); }
  if (!key)   { console.error("❌  Missing GOOGLE_PRIVATE_KEY");           process.exit(1); }

  console.log(`📧  Service account: ${email}`);

  // ── Auth ────────────────────────────────────────────────────────────────────
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth: (await auth.getClient()) as any });

  // ── Fetch all rows ──────────────────────────────────────────────────────────
  console.log(`\n📥  Fetching '${ARCHIVE_SHEET}'...`);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${ARCHIVE_SHEET}'`,
  });

  const allRows = res.data.values ?? [];
  console.log(`📋  Total rows fetched (including header): ${allRows.length}`);

  if (allRows.length < 2) {
    console.log("⚠️   Sheet is empty or has only a header — nothing to sort.");
    process.exit(0);
  }

  const headers  = allRows[0];
  const dataRows = allRows.slice(1);
  console.log(`📊  Data rows to sort: ${dataRows.length}`);
  console.log(`🔎  Sample timestamp from row 1: "${dataRows[0]?.[TIMESTAMP_COL]}"`);
  console.log(`🔎  Sample timestamp from row 2: "${dataRows[1]?.[TIMESTAMP_COL]}"`);

  // ── Sort ascending by Timestamp ─────────────────────────────────────────────
  const sorted = [...dataRows].sort((a, b) => {
    const tsA = parseTimestamp(a[TIMESTAMP_COL] ?? "").getTime();
    const tsB = parseTimestamp(b[TIMESTAMP_COL] ?? "").getTime();
    if (isNaN(tsA) && isNaN(tsB)) return 0;
    if (isNaN(tsA)) return 1;
    if (isNaN(tsB)) return -1;
    return tsA - tsB;
  });

  console.log("\n🔍  First 3 rows after sort:");
  sorted.slice(0, 3).forEach((r, i) => console.log(`   ${i + 1}. ${r[TIMESTAMP_COL]}`));
  console.log("🔍  Last 3 rows after sort:");
  sorted.slice(-3).forEach((r, i) => console.log(`   ${sorted.length - 2 + i}. ${r[TIMESTAMP_COL]}`));

  // ── Write back ──────────────────────────────────────────────────────────────
  console.log("\n🗑️   Clearing sheet...");
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${ARCHIVE_SHEET}'`,
  });
  console.log("✅  Sheet cleared.");

  console.log("✍️   Writing sorted rows...");
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${ARCHIVE_SHEET}'!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers, ...sorted] },
  });

  console.log(`\n🎉  Done! ${sorted.length} rows written back in ascending date order.`);
}

main().catch((err) => {
  console.error("❌  Error:", err.message ?? err);
  process.exit(1);
});