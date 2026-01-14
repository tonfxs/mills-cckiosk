import { NextResponse } from "next/server";
import { google } from "googleapis";

type PartsRow = {
  timestamp: string;   // A
  fullName: string;    // B
  phone: string;       // C
  orderNumber: string; // D
  carParkBay: string;  // H
  status: string;      // I
  agent: string;       // J
  type: string;        // K
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

function toPartsRow(row: any[]): PartsRow {
  return {
    timestamp: String(row?.[0] ?? ""),
    fullName: String(row?.[1] ?? ""),
    phone: String(row?.[2] ?? ""),
    orderNumber: String(row?.[3] ?? ""),
    carParkBay: String(row?.[7] ?? ""),
    status: String(row?.[8] ?? ""),
    agent: String(row?.[9] ?? ""),
    type: String(row?.[10] ?? ""),
  };
}

/**
 * GET /api/parts?status=Pending%20Verification&q=123&page=1&pageSize=25
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

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "MASTER LIST!A:K",
    });

    const rows = resp.data.values ?? [];

    const TYPE_PARTS = "parts assistance";

    let parts = rows
      .map(toPartsRow)
      .filter((r) => norm(r.type) === TYPE_PARTS)
      .filter((r) => r.orderNumber);

    if (statusFilter) {
      const s = norm(statusFilter);
      parts = parts.filter((r) => norm(r.status) === s);
    }

    if (q) {
      parts = parts.filter((r) =>
        [r.timestamp, r.fullName, r.phone, r.orderNumber, r.carParkBay, r.status, r.agent]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    parts = parts.reverse();

    const total = parts.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);

    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    const items = parts.slice(start, end);

    const statuses = Array.from(new Set(parts.map((r) => r.status).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b)
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
