import { NextResponse } from "next/server";
import { netoRequest } from "@/app/lib/neto-client";

const OUT = [
  "OrderID",
  "PurchaseOrderNumber",
  "SalesChannel",
  "OrderStatus",
  "DatePlaced",
  "OrderLine",
  "OrderLine.ExternalSystemIdentifier",
  "OrderLine.ExternalOrderReference",
  "OrderLine.ExternalOrderLineReference",
  "OrderLine.eBay.eBayTransactionID",
  "OrderLine.eBay.eBayAuctionID",
] as const;

async function run(filter: Record<string, any>) {
  const payload = {
    Filter: {
      ...filter,
      OutputSelector: OUT,
      Limit: 2,
      Page: 1,
    },
  };

  const data = await netoRequest<any>("GetOrder", payload, { timeoutMs: 25_000 });
  const orders = data?.Order ?? data?.Orders ?? [];

  return {
    count: orders.length,
    sample: orders.slice(0, 1),
  };
}

function candidates(ref: string) {
  const r = ref.replace(/\/+$/, "").trim();
  return Array.from(new Set([r, r.replace(/[\s-]/g, ""), r.replace(/\s+/g, "")].filter(Boolean)));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const refRaw = (url.searchParams.get("ref") ?? "").trim();
  if (!refRaw) return NextResponse.json({ ok: false, error: "Missing ?ref=" }, { status: 400 });

  const tried = candidates(refRaw);

  const results: any = {};
  for (const key of tried) {
    results[key] = {
      OrderID: await run({ OrderID: key }),
      PurchaseOrderNumber: await run({ PurchaseOrderNumber: key }),
      ExternalOrderReference: await run({ ExternalOrderReference: key }),
      ExternalSystemIdentifier: await run({ ExternalSystemIdentifier: key }),
      ExternalOrderLineReference: await run({ ExternalOrderLineReference: key }),
    };
  }

  return NextResponse.json({ ok: true, ref: refRaw, tried, results });
}
