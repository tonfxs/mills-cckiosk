import { NextResponse } from "next/server";
import { google } from "googleapis";

type AdcRow = {
  date: string;          // A
  age: string;           // B
  collected: string;     // C
  orderNumber: string;   // D
  externalSku: string;   // E
  name: string;          // F
  itemName: string;      // G
  orderDetails: string;  // H
  salesChannel: string;  // I
  location: string;      // J
  notes: string;         // K
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
  return String(s ?? "").trim().toLowerCase();
}

function toAdcRow(row: any[]): AdcRow {
  return {
    date: String(row?.[0] ?? ""),
    age: String(row?.[1] ?? ""),
    collected: String(row?.[2] ?? ""),
    orderNumber: String(row?.[3] ?? ""),
    externalSku: String(row?.[4] ?? ""),
    name: String(row?.[5] ?? ""),
    itemName: String(row?.[6] ?? ""),
    orderDetails: String(row?.[7] ?? ""),
    salesChannel: String(row?.[8] ?? ""),
    location: String(row?.[9] ?? ""),
    notes: String(row?.[10] ?? ""),
  };
}



/**
 * GET /api/admin/adc-datatable?status=Yes&q=123&page=1&pageSize=25
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const statusFilter = url.searchParams.get("status") || "";
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();

    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(
      200,
      Math.max(10, Number(url.searchParams.get("pageSize") || "25"))
    );

    const spreadsheetId = process.env.GOOGLE_SHEET_ID_ADC;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const meta = await sheets.spreadsheets.get({
  spreadsheetId,
});

// console.log(
//   "Available sheets:",
//   meta.data.sheets?.map((s) => s.properties?.title)
// );


    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Current Orders'!A3:K",

    });

    const rows = resp.data.values ?? [];

    let data = rows
      // .slice(1) // ✅ skip header row
      .map(toAdcRow)
      .filter((r) => r.orderNumber); // ignore blank rows

    // ✅ Status filter (Collected? column)
    if (statusFilter) {
      const s = norm(statusFilter);
      data = data.filter((r) => norm(r.collected) === s);
    }

    // ✅ Search filter
    if (q) {
      data = data.filter((r) =>
        [
          r.date,
          r.age,
          r.collected,
          r.orderNumber,
          r.externalSku,
          r.name,
          r.itemName,
          r.orderDetails,
          r.salesChannel,
          r.location,
          r.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    console.log("row 3:", rows[0]);
    console.log("row 4:", rows[1]);
    console.log("First 5 rows raw:", rows.slice(0, 5));



    // Latest first (since sheet appends at bottom)
    data = data.reverse();
    // data = data.filter(r => !["in progress", "order in progress"].includes(r.collected.toLowerCase()));


    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);

    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    const items = data.slice(start, end);

    // For dropdown filters (Collected? values)
    const statuses = Array.from(
      new Set(data.map((r) => r.collected).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

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
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
