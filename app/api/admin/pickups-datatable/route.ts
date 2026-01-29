// import { NextResponse } from "next/server";
// import { google } from "googleapis";

// type PickupRow = {
//   timestamp: string;     // A
//   fullName: string;      // B
//   phone: string;         // C
//   orderNumber: string;   // D
//   creditCard: string;    // E
//   validId: string;       // F
//   paymentMethod: string; // G
//   carParkBay: string;    // H
//   status: string;        // I
//   agent: string;         // J
//   type: string;          // K
// };

// async function getGoogleAuth() {
//   const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
//   const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

//   if (!clientEmail || !privateKey) throw new Error("Missing Google credentials");

//   return new google.auth.GoogleAuth({
//     credentials: { client_email: clientEmail, private_key: privateKey },
//     scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
//   });
// }

// function norm(s: string) {
//   return String(s ?? "").trim().toLowerCase();
// }

// function toPickupRow(row: any[]): PickupRow {
//   return {
//     timestamp: String(row?.[0] ?? ""),
//     fullName: String(row?.[1] ?? ""),
//     phone: String(row?.[2] ?? ""),
//     orderNumber: String(row?.[3] ?? ""),
//     creditCard: String(row?.[4] ?? ""),
//     validId: String(row?.[5] ?? ""),
//     paymentMethod: String(row?.[6] ?? ""),
//     carParkBay: String(row?.[7] ?? ""),
//     status: String(row?.[8] ?? ""),
//     agent: String(row?.[9] ?? ""),
//     type: String(row?.[10] ?? ""),
//   };
// }

// /**
//  * GET /api/pickups?status=Pending%20Pickup&q=123&page=1&pageSize=25
//  */
// export async function GET(request: Request) {
//   try {
//     const url = new URL(request.url);

//     const statusFilter = url.searchParams.get("status") || ""; // exact match (case-insensitive)
//     const q = (url.searchParams.get("q") || "").trim().toLowerCase();

//     const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
//     const pageSize = Math.min(200, Math.max(10, Number(url.searchParams.get("pageSize") || "25")));

//     const spreadsheetId = process.env.GOOGLE_SHEET_ID;
//     if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

//     const auth = await getGoogleAuth();
//     const sheets = google.sheets({ version: "v4", auth });

//     const resp = await sheets.spreadsheets.values.get({
//       spreadsheetId,
//       range: "MASTER LIST!A:K",
//     });

//     const rows = resp.data.values ?? [];

//     const TYPE_PICKUP = "order pickup";

//     // Map + filter
//     let pickups = rows
//       .map(toPickupRow)
//       .filter((r) => norm(r.type) === TYPE_PICKUP)
//       .filter((r) => r.orderNumber); // ignore blank lines

//     if (statusFilter) {
//       const s = norm(statusFilter);
//       pickups = pickups.filter((r) => norm(r.status) === s);
//     }

//     if (q) {
//       pickups = pickups.filter((r) =>
//         [
//           r.timestamp,
//           r.fullName,
//           r.phone,
//           r.orderNumber,
//           r.paymentMethod,
//           r.carParkBay,
//           r.status,
//           r.agent,
//         ]
//           .join(" ")
//           .toLowerCase()
//           .includes(q)
//       );
//     }

//     // Latest first (simple: reverse because sheet is appended)
//     pickups = pickups.reverse();

//     const total = pickups.length;
//     const totalPages = Math.max(1, Math.ceil(total / pageSize));
//     const safePage = Math.min(page, totalPages);

//     const start = (safePage - 1) * pageSize;
//     const end = start + pageSize;

//     const items = pickups.slice(start, end);

//     // For dropdown filters
//     const statuses = Array.from(
//       new Set(pickups.map((r) => r.status).filter(Boolean))
//     ).sort((a, b) => a.localeCompare(b));

//     return NextResponse.json({
//       success: true,
//       data: {
//         items,
//         total,
//         page: safePage,
//         pageSize,
//         totalPages,
//         statuses,
//       },
//     });
//   } catch (err: any) {
//     return NextResponse.json(
//       { success: false, error: err.message },
//       { status: 500 }
//     );
//   }
// }


// app/api/admin/pickups-datatable/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

type PickupRow = {
  timestamp: string;     // A
  fullName: string;      // B
  phone: string;         // C
  orderNumber: string;   // D (kiosk ref, e.g. E9701943)
  creditCard: string;    // E
  validId: string;       // F
  paymentMethod: string; // G
  carParkBay: string;    // H
  status: string;        // I
  agent: string;         // J
  type: string;          // K  ("Order Pickup")
  notes: string;         // L  (existing Notes)
  netoOrderId: string;   // M  ✅ NEW (Neto internal ID)
};

async function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!clientEmail || !privateKey) throw new Error("Missing Google credentials");

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function norm(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function toPickupRow(row: any[]): PickupRow {
  return {
    timestamp: String(row?.[0] ?? ""),
    fullName: String(row?.[1] ?? ""),
    phone: String(row?.[2] ?? ""),
    orderNumber: String(row?.[3] ?? ""),
    creditCard: String(row?.[4] ?? ""),
    validId: String(row?.[5] ?? ""),
    paymentMethod: String(row?.[6] ?? ""),
    carParkBay: String(row?.[7] ?? ""),
    status: String(row?.[8] ?? ""),
    agent: String(row?.[9] ?? ""),
    type: String(row?.[10] ?? ""),
    notes: String(row?.[11] ?? ""),       // ✅ L
    netoOrderId: String(row?.[12] ?? ""), // ✅ M
  };
}

/**
 * GET /api/admin/pickups-datatable?status=Pending%20Pickup&q=123&page=1&pageSize=25
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const statusFilter = url.searchParams.get("status") || ""; // exact match (case-insensitive)
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();

    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(200, Math.max(10, Number(url.searchParams.get("pageSize") || "25")));

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // ✅ Read through M now (because L=Notes, M=NetoOrderID)
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "MASTER LIST!A:M",
    });

    const rows = resp.data.values ?? [];

    const TYPE_PICKUP = "order pickup";

    // Map + filter
    let pickups = rows
      .map(toPickupRow)
      .filter((r) => norm(r.type) === TYPE_PICKUP)
      .filter((r) => r.orderNumber); // ignore blank lines

    if (statusFilter) {
      const s = norm(statusFilter);
      pickups = pickups.filter((r) => norm(r.status) === s);
    }

    if (q) {
      pickups = pickups.filter((r) =>
        [
          r.timestamp,
          r.fullName,
          r.phone,
          r.orderNumber,
          r.paymentMethod,
          r.carParkBay,
          r.status,
          r.agent,
          r.notes,
          r.netoOrderId, // ✅ searchable too
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // Latest first (simple: reverse because sheet is appended)
    pickups = pickups.reverse();

    const total = pickups.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);

    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    const items = pickups.slice(start, end);

    // For dropdown filters
    const statuses = Array.from(new Set(pickups.map((r) => r.status).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page: safePage,
        pageSize,
        totalPages,
        statuses,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
