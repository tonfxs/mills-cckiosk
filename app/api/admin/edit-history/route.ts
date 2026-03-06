import { NextResponse } from "next/server";
import { google } from "googleapis";

async function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!clientEmail || !privateKey) throw new Error("Missing Google credentials");

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q        = searchParams.get("q") ?? "";
    const action   = searchParams.get("action") ?? "";
    const agent    = searchParams.get("agent") ?? "";
    const page     = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "25")));

    const spreadsheetId = process.env.GOOGLE_SHEET_ID_ADC;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID_ADC missing");

    const auth   = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Edit History'!A2:K", // skip header row
    });

    const raw = res.data.values ?? [];

    // Map rows → objects
    // Sheet columns: A=Timestamp B=Action C=Order# D=Agent E=Bay# F=Customer G=Item H=SKU I=Channel J=Location K=Notes
    type HistoryRow = {
      timestamp: string;
      action: string;
      orderNumber: string;
      agent: string;
      bayNumber: string;
      name: string;
      itemName: string;
      externalSku: string;
      salesChannel: string;
      location: string;
      notes: string;
    };

    let rows: HistoryRow[] = raw.map((r) => ({
      timestamp:    r[0]  ?? "",
      action:       r[1]  ?? "",
      orderNumber:  r[2]  ?? "",
      agent:        r[3]  ?? "",
      bayNumber:    r[4]  ?? "",
      name:         r[5]  ?? "",
      itemName:     r[6]  ?? "",
      externalSku:  r[7]  ?? "",
      salesChannel: r[8]  ?? "",
      location:     r[9]  ?? "",
      notes:        r[10] ?? "",
    }));

    // Newest first
    rows.reverse();

    // Filters
    if (q) {
      const lq = q.toLowerCase();
      rows = rows.filter((r) =>
        r.orderNumber.toLowerCase().includes(lq) ||
        r.name.toLowerCase().includes(lq) ||
        r.agent.toLowerCase().includes(lq) ||
        r.itemName.toLowerCase().includes(lq) ||
        r.externalSku.toLowerCase().includes(lq)
      );
    }
    if (action) rows = rows.filter((r) => r.action === action);
    if (agent)  rows = rows.filter((r) => r.agent.toUpperCase() === agent.toUpperCase());

    const total      = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage   = Math.min(page, totalPages);
    const items      = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

    // Unique agents & actions for filter dropdowns
    const allRows: HistoryRow[] = raw.map((r) => ({
      timestamp: r[0] ?? "", action: r[1] ?? "", orderNumber: r[2] ?? "",
      agent: r[3] ?? "", bayNumber: r[4] ?? "", name: r[5] ?? "",
      itemName: r[6] ?? "", externalSku: r[7] ?? "", salesChannel: r[8] ?? "",
      location: r[9] ?? "", notes: r[10] ?? "",
    }));
    const agents  = [...new Set(allRows.map((r) => r.agent).filter(Boolean))].sort();
    const actions = [...new Set(allRows.map((r) => r.action).filter(Boolean))].sort();

    return NextResponse.json({
      success: true,
      data: { items, total, page: safePage, pageSize, totalPages, agents, actions },
    });
  } catch (err: any) {
    console.error("❌ Edit History GET error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}