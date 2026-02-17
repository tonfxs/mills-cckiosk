import { google } from "googleapis";

/**
 * ONE SINGLE CACHE
 * This stores values from the sheet (whole MASTER LIST).
 */
let masterCache: any[] | null = null;
let lastFetchedAt = 0;

// How long to cache in ms
// 60s is usually plenty for realtime dashboards
const CACHE_TTL = 60 * 1000;

async function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!clientEmail || !privateKey)
    throw new Error("Missing Google credentials");

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/**
 * Fetch the MASTER LIST sheet with caching
 */
export async function getMasterSheetRows(spreadsheetId: string) {
  // If cache exists and is within TTL, reuse
  const now = Date.now();
  if (masterCache && now - lastFetchedAt < CACHE_TTL) {
    return masterCache;
  }

  // Otherwise, fetch fresh
  console.log("[SheetCache] Fetching MASTER LIST...");
  const auth = await getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "MASTER LIST!A:M", // whole sheet
  });

  masterCache = resp.data.values ?? [];
  lastFetchedAt = now;

  return masterCache;
}
