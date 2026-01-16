// import { NextResponse } from "next/server";
// import { google } from "googleapis";

// type MasterRow = {
//   timestamp: string;     // A
//   fullName: string;      // B
//   phone: string;         // C
//   refId: string;         // D (orderNumber OR rmaID)
//   paymentMethod: string; // G (pickup only; blank for returns/parts)
//   carParkBay: string;    // H
//   status: string;        // I
//   type: string;          // K
// };

// async function getGoogleAuth() {
//   const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
//   const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

//   if (!clientEmail || !privateKey) {
//     throw new Error("Missing Google credentials");
//   }

//   return new google.auth.GoogleAuth({
//     credentials: { client_email: clientEmail, private_key: privateKey },
//     scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
//   });
// }

// function norm(s: string) {
//   return String(s || "").trim().toLowerCase();
// }

// /**
//  * Timestamp format from your kiosk:
//  * "DD/MM/YYYY HH:mm:ss" in Australia/Sydney (en-AU)
//  */
// function isTodaySydney(ts: string) {
//   const m = ts.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
//   if (!m) return false;

//   const [, dd, mm, yyyy] = m;

//   const todaySydney = new Intl.DateTimeFormat("en-AU", {
//     timeZone: "Australia/Sydney",
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//   }).format(new Date());

//   return `${dd}/${mm}/${yyyy}` === todaySydney;
// }

// function toMasterRow(row: any[]): MasterRow {
//   return {
//     timestamp: String(row?.[0] ?? ""),
//     fullName: String(row?.[1] ?? ""),
//     phone: String(row?.[2] ?? ""),
//     refId: String(row?.[3] ?? ""),
//     paymentMethod: String(row?.[6] ?? ""),
//     carParkBay: String(row?.[7] ?? ""),
//     status: String(row?.[8] ?? ""),
//     type: String(row?.[10] ?? ""),
//   };
// }

// export async function GET() {
//   try {
//     const spreadsheetId = process.env.GOOGLE_SHEET_ID;a
//     if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

//     const auth = await getGoogleAuth();
//     const sheets = google.sheets({ version: "v4", auth });

//     const resp = await sheets.spreadsheets.values.get({
//       spreadsheetId,
//       range: "MASTER LIST!A:K",
//     });

//     const rows = resp.data.values ?? [];

//     // --- Types (column K) ---
//     const TYPE_PICKUP = "order pickup";
//     const TYPE_RETURN = "return product";
//     const TYPE_PARTS = "parts assistance";

//     // --- Statuses (column I) ---
//     // Based on your dropdown:
//     // Pending Verification, Pending Pickup, Endorsed to WH, Proceed to Window, Order Collected, Item Received
//     const pickupComplete = new Set(["order collected"]);
//     const returnComplete = new Set(["item received"]);
//     const partsComplete = new Set(["order collected"]); // adjust if your parts completion differs

//     // --- Counters ---
//     let ordersPickedUpToday = 0;
//     let ordersPickedUpTotal = 0;

//     let returnItemsReceivedToday = 0;
//     let returnItemsReceivedTotal = 0;

//     let partsCompletedToday = 0;
//     let partsCompletedTotal = 0;

//     // --- Unique customers (by phone) across ALL transactions ---
//     const seenPhonesTotal = new Set<string>();
//     const seenPhonesToday = new Set<string>();

//     // --- Recent rows ---
//     const pickupCompleteRows: MasterRow[] = [];
//     const returnCompleteRows: MasterRow[] = [];
//     const partsCompleteRows: MasterRow[] = [];

//     for (const raw of rows) {
//       const r = toMasterRow(raw);

//       // ignore empty rows
//       if (!r.timestamp && !r.refId && !r.phone && !r.fullName) continue;

//       const today = isTodaySydney(r.timestamp);

//       // Unique customers logic (use phone; ignore blanks)
//       const phoneKey = norm(r.phone);
//       if (phoneKey) {
//         seenPhonesTotal.add(phoneKey);
//         if (today) seenPhonesToday.add(phoneKey);
//       }

//       // For transaction-specific stats, we require a refId (order# / rmaID)
//       if (!r.refId) continue;

//       const type = norm(r.type);
//       const status = norm(r.status);

//       // Pickups
//       if (type === TYPE_PICKUP && pickupComplete.has(status)) {
//         ordersPickedUpTotal += 1;
//         if (today) ordersPickedUpToday += 1;
//         pickupCompleteRows.push(r);
//         continue;
//       }

//       // Returns
//       if (type === TYPE_RETURN && returnComplete.has(status)) {
//         returnItemsReceivedTotal += 1;
//         if (today) returnItemsReceivedToday += 1;
//         returnCompleteRows.push(r);
//         continue;
//       }

//       // Parts
//       if (type === TYPE_PARTS && partsComplete.has(status)) {
//         partsCompletedTotal += 1;
//         if (today) partsCompletedToday += 1;
//         partsCompleteRows.push(r);
//         continue;
//       }
//     }

//     const recentPickups = pickupCompleteRows.slice(-10).reverse().map((x) => ({
//       timestamp: x.timestamp,
//       fullName: x.fullName,
//       phone: x.phone,
//       orderNumber: x.refId,
//       paymentMethod: x.paymentMethod,
//       carParkBay: x.carParkBay,
//       status: x.status,
//     }));

//     const recentReturns = returnCompleteRows.slice(-10).reverse().map((x) => ({
//       timestamp: x.timestamp,
//       fullName: x.fullName,
//       phone: x.phone,
//       rmaID: x.refId,
//       carParkBay: x.carParkBay,
//       status: x.status,
//     }));

//     const recentParts = partsCompleteRows.slice(-10).reverse().map((x) => ({
//       timestamp: x.timestamp,
//       fullName: x.fullName,
//       phone: x.phone,
//       orderNumber: x.refId,
//       carParkBay: x.carParkBay,
//       status: x.status,
//     }));

//     return NextResponse.json({
//       success: true,
//       data: {
//         // Pickups
//         ordersPickedUpToday,
//         ordersPickedUpTotal,
//         recentPickups,

//         // Returns
//         returnItemsReceivedToday,
//         returnItemsReceivedTotal,
//         recentReturns,

//         // Parts
//         partsCompletedToday,
//         partsCompletedTotal,
//         recentParts,

//         // Customers (unique by phone, all transaction types)
//         uniqueCustomersToday: seenPhonesToday.size,
//         uniqueCustomersTotal: seenPhonesTotal.size,
//       },
//     });
//   } catch (err: any) {
//     return NextResponse.json(
//       { success: false, error: err.message },
//       { status: 500 }
//     );
//   }
// }



import { NextResponse } from "next/server";
import { google } from "googleapis";

type MasterRow = {
  timestamp: string;     // A
  fullName: string;      // B
  phone: string;         // C
  refId: string;         // D (orderNumber OR rmaID)
  paymentMethod: string; // G (pickup only; blank for returns/parts)
  carParkBay: string;    // H
  status: string;        // I
  type: string;          // K
};

type StuckAgingSummary = {
  stuckCount: number;
  agingOver30m: number;
  agingOver2h: number;
};

type DataQualitySummary = {
  invalidCount: number;
  missingCount: number;
  topIssues: Array<{ issue: string; count: number }>;
};

type DuplicateSummary = {
  duplicateCount: number; // number of duplicate keys (type+refId) found
  duplicateKeys: string[]; // sample keys for debug (limited)
};

type FunnelSummary = {
  today: { started: number; submitted: number; verified: number; completed: number };
  total: { started: number; submitted: number; verified: number; completed: number };
};

type StuckItem = {
  timestamp: string;
  fullName: string;
  phone: string;
  ref: string;
  carParkBay: string;
  status: string;
  type: string;
  ageMinutes: number;
  reason: string;
};

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

type DuplicateGroup = {
  key: string;
  count: number;
  sample: { timestamp: string; fullName: string; phone: string; ref: string; status: string; type: string }[];
};


async function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google credentials");
  }

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function norm(s: string) {
  return String(s || "").trim().toLowerCase();
}

/**
 * Timestamp format from your kiosk:
 * "DD/MM/YYYY HH:mm:ss" in Australia/Sydney
 */
function parseSydneyTimestampToUtcDate(ts: string): Date | null {
  const m = ts.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/
  );
  if (!m) return null;

  const [, dd, mm, yyyy, HH, MI, SS] = m.map(String);

  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const hour = Number(HH);
  const minute = Number(MI);
  const second = Number(SS);

  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(second)
  ) return null;

  // Convert "Sydney local time" to a real UTC Date without external TZ libs.
  // Two-pass offset correction to handle DST.
  const tz = "Australia/Sydney";

  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  let d = new Date(guessUtcMs);

  const offset1 = getTimeZoneOffsetMinutes(d, tz);
  d = new Date(guessUtcMs - offset1 * 60_000);

  const offset2 = getTimeZoneOffsetMinutes(d, tz);
  d = new Date(guessUtcMs - offset2 * 60_000);

  return d;
}

/**
 * Returns the offset (minutes) between UTC and the provided timeZone at `date`.
 * Positive means timeZone time is ahead of UTC (e.g. +660 for AEDT).
 */
function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  const y = Number(get("year"));
  const mo = Number(get("month"));
  const da = Number(get("day"));
  const h = Number(get("hour"));
  const mi = Number(get("minute"));
  const s = Number(get("second"));

  const asIfUtc = Date.UTC(y, mo - 1, da, h, mi, s);
  const actualUtc = date.getTime();

  return Math.round((asIfUtc - actualUtc) / 60_000);
}

function isTodaySydney(ts: string) {
  const m = ts.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return false;

  const [, dd, mm, yyyy] = m;

  const todaySydney = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  return `${dd}/${mm}/${yyyy}` === todaySydney;
}

function toMasterRow(row: any[]): MasterRow {
  return {
    timestamp: String(row?.[0] ?? ""),
    fullName: String(row?.[1] ?? ""),
    phone: String(row?.[2] ?? ""),
    refId: String(row?.[3] ?? ""),
    paymentMethod: String(row?.[6] ?? ""),
    carParkBay: String(row?.[7] ?? ""),
    status: String(row?.[8] ?? ""),
    type: String(row?.[10] ?? ""),
  };
}

/** --- Validation helpers (server-side) --- */
function isLikelyPhone(s: string) {
  const digits = String(s || "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
function isLikelyRefId(s: string) {
  const v = String(s || "").trim();
  return /^[A-Za-z0-9-]{3,}$/.test(v);
}

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "MASTER LIST!A:K",
    });

    const rows = resp.data.values ?? [];

    // --- Types (column K) ---
    const TYPE_PICKUP = "order pickup";
    const TYPE_RETURN = "return product";
    const TYPE_PARTS = "parts assistance";

    // --- Statuses (column I) ---
    const STATUS_PENDING_VERIFICATION = "pending verification";
    const STATUS_PENDING_PICKUP = "pending pickup";
    const STATUS_ENDORSED_TO_WH = "endorsed to wh";
    const STATUS_PROCEED_TO_WINDOW = "proceed to window";

    // Completion statuses (you already used these)
    const pickupComplete = new Set(["order collected"]);
    const returnComplete = new Set(["item received"]);
    const partsComplete = new Set(["order collected"]); // adjust if needed

    // For funnel "verified" stage (tweak anytime)
    const verifiedStatuses = new Set([
      STATUS_PENDING_PICKUP,
      STATUS_ENDORSED_TO_WH,
      STATUS_PROCEED_TO_WINDOW,
    ]);

    // --- NEW: Drill-down arrays for panels ---
    const stuckOrders: StuckItem[] = [];
    const missingInvalidRows: MissingItem[] = [];
    const dupSamples = new Map<string, { timestamp: string; fullName: string; phone: string; ref: string; status: string; type: string }[]>();


    // --- Counters (existing) ---
    let ordersPickedUpToday = 0;
    let ordersPickedUpTotal = 0;

    let returnItemsReceivedToday = 0;
    let returnItemsReceivedTotal = 0;

    let partsCompletedToday = 0;
    let partsCompletedTotal = 0;

    // --- Unique customers (by phone) across ALL transactions ---
    const seenPhonesTotal = new Set<string>();
    const seenPhonesToday = new Set<string>();

    // --- Recent completed rows (existing) ---
    const pickupCompleteRows: MasterRow[] = [];
    const returnCompleteRows: MasterRow[] = [];
    const partsCompleteRows: MasterRow[] = [];

    // --- NEW: Data Quality ---
    let missingCount = 0;
    let invalidCount = 0;
    const issueMap = new Map<string, number>();
    const bump = (issue: string) =>
      issueMap.set(issue, (issueMap.get(issue) || 0) + 1);

    // --- NEW: Duplicates ---
    const dupMap = new Map<string, number>(); // key -> count
    const dupKeys: string[] = [];

    const addDupKey = (type: string, refId: string) => {
      const t = norm(type);
      const r = norm(refId);
      if (!t || !r) return;
      const key = `${t}:${r}`;
      const next = (dupMap.get(key) || 0) + 1;
      dupMap.set(key, next);
      if (next === 2) dupKeys.push(key);
    };

    // --- NEW: Stuck/Aging ---
    let agingOver30m = 0;
    let agingOver2h = 0;
    // let agingOver1h = 0;

    // --- NEW: Funnel ---
    const funnelToday = { started: 0, submitted: 0, verified: 0, completed: 0 };
    const funnelTotal = { started: 0, submitted: 0, verified: 0, completed: 0 };

    const nowUtc = new Date();

    for (const raw of rows) {
      const r = toMasterRow(raw);

      // ignore fully empty rows
      if (!r.timestamp && !r.refId && !r.phone && !r.fullName) continue;

      const today = isTodaySydney(r.timestamp);

      // Unique customers logic (use phone; ignore blanks)
      const phoneKey = norm(r.phone);
      if (phoneKey) {
        seenPhonesTotal.add(phoneKey);
        if (today) seenPhonesToday.add(phoneKey);
      }

      const type = norm(r.type);
      const status = norm(r.status);

      // --- NEW: Data quality checks ---
      // Only evaluate “meaningful” rows (anything with refId or any key fields)
      const meaningful = Boolean(
        r.refId?.trim() || r.fullName?.trim() || r.phone?.trim() || r.status?.trim()
      );

      // if (meaningful) {
      //   if (!r.type?.trim()) (missingCount++, bump("Missing: type"));
      //   if (!r.status?.trim()) (missingCount++, bump("Missing: status"));
      //   if (!r.fullName?.trim()) (missingCount++, bump("Missing: fullName"));
      //   if (!r.phone?.trim()) (missingCount++, bump("Missing: phone"));
      //   if (!r.carParkBay?.trim()) (missingCount++, bump("Missing: carParkBay"));

      //   // refId is required for transaction metrics
      //   if (!r.refId?.trim()) (missingCount++, bump("Missing: refId"));

      //   // Pickup requires payment method
      //   if (type === TYPE_PICKUP && !r.paymentMethod?.trim()) {
      //     missingCount++;
      //     bump("Missing: paymentMethod (pickup)");
      //   }

      //   if (r.phone?.trim() && !isLikelyPhone(r.phone)) {
      //     invalidCount++;
      //     bump("Invalid: phone");
      //   }
      //   if (r.refId?.trim() && !isLikelyRefId(r.refId)) {
      //     invalidCount++;
      //     bump("Invalid: refId");
      //   }
      // }

      if (meaningful) {
      const issues: string[] = [];
          
      if (!r.type?.trim()) (missingCount++, bump("Missing: type"), issues.push("type"));
      if (!r.status?.trim()) (missingCount++, bump("Missing: status"), issues.push("status"));
      if (!r.fullName?.trim()) (missingCount++, bump("Missing: fullName"), issues.push("fullName"));
      if (!r.phone?.trim()) (missingCount++, bump("Missing: phone"), issues.push("phone"));
      if (!r.carParkBay?.trim()) (missingCount++, bump("Missing: carParkBay"), issues.push("carParkBay"));
          
      if (!r.refId?.trim()) (missingCount++, bump("Missing: refId"), issues.push("refId"));
          
      if (type === TYPE_PICKUP && !r.paymentMethod?.trim()) {
        missingCount++;
        bump("Missing: paymentMethod (pickup)");
        issues.push("paymentMethod");
      }
    
      if (r.phone?.trim() && !isLikelyPhone(r.phone)) {
        invalidCount++;
        bump("Invalid: phone");
        issues.push("invalid phone");
      }
    
      if (r.refId?.trim() && !isLikelyRefId(r.refId)) {
        invalidCount++;
        bump("Invalid: refId");
        issues.push("invalid refId");
      }
    
      // If there are issues, add a row for the MissingDataPanel
      if (issues.length) {
        missingInvalidRows.push({
          timestamp: r.timestamp,
          fullName: r.fullName,
          phone: r.phone,
          ref: r.refId,
          paymentMethod: r.paymentMethod,
          carParkBay: r.carParkBay,
          status: r.status,
          type: r.type,
          missing: issues,
        });
      }
    }


      // Duplicates (type+refId)
      addDupKey(r.type, r.refId);

      // store sample rows for duplicate groups
      const t = norm(r.type);
      const rid = norm(r.refId);
      if (t && rid) {
        const key = `${t}:${rid}`;
        if (!dupSamples.has(key)) dupSamples.set(key, []);
        const arr = dupSamples.get(key)!;
        if (arr.length < 10) {
          arr.push({
            timestamp: r.timestamp,
            fullName: r.fullName,
            phone: r.phone,
            ref: r.refId,
            status: r.status,
            type: r.type,
          });
        }
      }


      // Stuck/Aging: only for rows that are NOT complete (per type)
      // and have parseable timestamp + refId
      // if (r.refId?.trim()) {
      //   const tsDateUtc = parseSydneyTimestampToUtcDate(r.timestamp);
      //   if (tsDateUtc) {
      //     const ageMinutes = (nowUtc.getTime() - tsDateUtc.getTime()) / 60_000;

      //     const isCompleted =
      //       (type === TYPE_PICKUP && pickupComplete.has(status)) ||
      //       (type === TYPE_RETURN && returnComplete.has(status)) ||
      //       (type === TYPE_PARTS && partsComplete.has(status));

      //     if (!isCompleted) {
      //     if (ageMinutes > 30) agingOver30m += 1;
      //     if (ageMinutes > 120) agingOver2h += 1;

      //     // Add row for StuckOrdersPanel when it exceeds 30m
      //     if (ageMinutes > 30) {
      //       stuckOrders.push({
      //         timestamp: r.timestamp,
      //         fullName: r.fullName,
      //         phone: r.phone,
      //         ref: r.refId,
      //         carParkBay: r.carParkBay,
      //         status: r.status,
      //         type: r.type,
      //         ageMinutes: Math.round(ageMinutes),
      //         reason: ageMinutes > 120 ? "Over 2 hours" : "Over 30 mins",
      //       });
      //     }
      //   }
      //   }
      // }

      // Stuck/Aging: TODAY ONLY (Sydney)
      if (today && r.refId?.trim()) {
        const tsDateUtc = parseSydneyTimestampToUtcDate(r.timestamp);
        if (tsDateUtc) {
          const ageMinutes = (nowUtc.getTime() - tsDateUtc.getTime()) / 60_000;
        
          const isCompleted =
            (type === TYPE_PICKUP && pickupComplete.has(status)) ||
            (type === TYPE_RETURN && returnComplete.has(status)) ||
            (type === TYPE_PARTS && partsComplete.has(status));
        
          if (!isCompleted) {
            if (ageMinutes > 30) agingOver30m += 1;
            if (ageMinutes > 120) agingOver2h += 1;
          
            if (ageMinutes > 30) {
              stuckOrders.push({
                timestamp: r.timestamp,
                fullName: r.fullName,
                phone: r.phone,
                ref: r.refId,
                carParkBay: r.carParkBay,
                status: r.status,
                type: r.type,
                ageMinutes: Math.round(ageMinutes),
                reason: ageMinutes > 120 ? "Over 2 hours" : "Over 30 mins",
              });
            }
          }
        }
      }




      // --- Existing transaction-specific stats (completed only) ---
      // For these stats, we require refId
      if (!r.refId) continue;

      // Pickups completed
      if (type === TYPE_PICKUP && pickupComplete.has(status)) {
        ordersPickedUpTotal += 1;
        if (today) ordersPickedUpToday += 1;
        pickupCompleteRows.push(r);
      }

      // Returns completed
      if (type === TYPE_RETURN && returnComplete.has(status)) {
        returnItemsReceivedTotal += 1;
        if (today) returnItemsReceivedToday += 1;
        returnCompleteRows.push(r);
      }

      // Parts completed
      if (type === TYPE_PARTS && partsComplete.has(status)) {
        partsCompletedTotal += 1;
        if (today) partsCompletedToday += 1;
        partsCompleteRows.push(r);
      }

      // --- Funnel (counts ALL rows by stage) ---
      // started = any row with valid type+refId
      const validType =
        type === TYPE_PICKUP || type === TYPE_RETURN || type === TYPE_PARTS;

      if (validType) {
        funnelTotal.started += 1;
        if (today) funnelToday.started += 1;

        if (status === STATUS_PENDING_VERIFICATION) {
          funnelTotal.submitted += 1;
          if (today) funnelToday.submitted += 1;
        }

        if (verifiedStatuses.has(status)) {
          funnelTotal.verified += 1;
          if (today) funnelToday.verified += 1;
        }

        const completedForType =
          (type === TYPE_PICKUP && pickupComplete.has(status)) ||
          (type === TYPE_RETURN && returnComplete.has(status)) ||
          (type === TYPE_PARTS && partsComplete.has(status));

        if (completedForType) {
          funnelTotal.completed += 1;
          if (today) funnelToday.completed += 1;
        }
      }
    }

    // Recent completed rows (existing)
    const recentPickups = pickupCompleteRows.slice(-10).reverse().map((x) => ({
      timestamp: x.timestamp,
      fullName: x.fullName,
      phone: x.phone,
      orderNumber: x.refId,
      paymentMethod: x.paymentMethod,
      carParkBay: x.carParkBay,
      status: x.status,
    }));

    const recentReturns = returnCompleteRows.slice(-10).reverse().map((x) => ({
      timestamp: x.timestamp,
      fullName: x.fullName,
      phone: x.phone,
      rmaID: x.refId,
      carParkBay: x.carParkBay,
      status: x.status,
    }));

    const recentParts = partsCompleteRows.slice(-10).reverse().map((x) => ({
      timestamp: x.timestamp,
      fullName: x.fullName,
      phone: x.phone,
      orderNumber: x.refId,
      carParkBay: x.carParkBay,
      status: x.status,
    }));

    // Build top issues
    const topIssues = [...issueMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([issue, count]) => ({ issue, count }));

    // Duplicate count = number of keys that appeared >= 2
    const duplicateCount = [...dupMap.values()].filter((n) => n >= 2).length;

    const stuckAging: StuckAgingSummary = {
      // “stuckCount” = the strictest bucket (>2h). You can change to agingOver30m if you prefer.
      stuckCount: agingOver2h,
      agingOver30m,
      agingOver2h,
    };

    const dataQuality: DataQualitySummary = {
      invalidCount,
      missingCount,
      topIssues,
    };

    const duplicates: DuplicateSummary = {
      duplicateCount,
      duplicateKeys: dupKeys.slice(0, 15),
    };

    const successFunnel: FunnelSummary = {
      today: funnelToday,
      total: funnelTotal,
    };

    const duplicateGroups: DuplicateGroup[] = [...dupSamples.entries()]
  .filter(([, sample]) => sample.length >= 2)
  .map(([key, sample]) => ({
    key,
    count: sample.length,
    sample,
  }))
  .slice(0, 50);


    return NextResponse.json({
      success: true,
      data: {
        // Pickups
        ordersPickedUpToday,
        ordersPickedUpTotal,
        recentPickups,

        // Returns
        returnItemsReceivedToday,
        returnItemsReceivedTotal,
        recentReturns,

        // Parts
        partsCompletedToday,
        partsCompletedTotal,
        recentParts,

        // Customers
        uniqueCustomersToday: seenPhonesToday.size,
        uniqueCustomersTotal: seenPhonesTotal.size,

        // NEW widgets
        stuckAging,
        dataQuality,
        duplicates,
        successFunnel,

        stuckOrders: stuckOrders
        .sort((a, b) => b.ageMinutes - a.ageMinutes)
        .slice(0, 100),
            
      missingInvalidRows: missingInvalidRows.slice(-200),
            
      duplicateGroups,

      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
