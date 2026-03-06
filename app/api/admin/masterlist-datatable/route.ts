import { NextResponse } from "next/server";
import { getMasterSheetRows } from "@/app/lib/googleSheetCache";

type MasterRow = {
  timestamp: string;
  fullName: string;
  phone: string;
  orderID: string;
  rmaID: string;
  carParkBay: string;
  status: string;
  agent: string;
  type: string;
};

function norm(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function toMasterRow(row: any[]): MasterRow {
  return {
    timestamp: String(row?.[0] ?? ""),
    fullName: String(row?.[1] ?? ""),
    phone: String(row?.[2] ?? ""),
    orderID: String(row?.[3] ?? ""),
    rmaID: String(row?.[4] ?? ""),
    carParkBay: String(row?.[7] ?? ""),
    status: String(row?.[8] ?? ""),
    agent: String(row?.[9] ?? ""),
    type: String(row?.[10] ?? ""),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const typeFilter = norm(url.searchParams.get("type"));
    const statusFilter = norm(url.searchParams.get("status"));
    const query = norm(url.searchParams.get("q"));

    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Math.min(
      200,
      Math.max(10, Number(url.searchParams.get("pageSize") || "25"))
    );

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

    const rows = await getMasterSheetRows(spreadsheetId);

    let master = rows
      .map(toMasterRow)
      .filter((r) => {
        if (typeFilter && norm(r.type) !== typeFilter) return false;
        if (statusFilter && norm(r.status) !== statusFilter) return false;

        if (query) {
          const searchable = [
            r.timestamp,
            r.fullName,
            r.phone,
            r.orderID,
            r.rmaID,
            r.carParkBay,
            r.status,
            r.agent,
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(query);
        }

        return true;
      })
      .reverse();

    const total = master.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);

    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    return NextResponse.json({
      success: true,
      data: {
        items: master.slice(start, end),
        total,
        page: safePage,
        pageSize,
        totalPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}