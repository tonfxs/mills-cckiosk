import { NextResponse } from "next/server";
import { netoRequest } from "@/app/lib/neto-client";

const OUT = [
  "OrderID",
  "PurchaseOrderNumber",
  "SalesChannel",
  "DatePlaced",
  "OrderStatus",
  "OrderLine",
  "OrderLine.ExternalOrderReference",
  "OrderLine.ExternalOrderLineReference",
  "OrderLine.ExternalSystemIdentifier",
  // include ebay fields for visibility (if your store returns them)
  "OrderLine.eBay.eBayTransactionID",
  "OrderLine.eBay.eBayAuctionID",
  "OrderLine.eBayTransactionID",
  "OrderLine.eBayAuctionID",
] as const;

function isoDateNDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function extractLines(order: any) {
  const ol = order?.OrderLine;
  if (Array.isArray(ol)) return ol;
  if (ol && Array.isArray(ol.OrderLine)) return ol.OrderLine;
  if (ol && Array.isArray(ol.Line)) return ol.Line;
  if (ol && typeof ol === "object") return [ol];
  return [];
}

export async function GET() {
  const from = isoDateNDaysAgo(30);

  const payload = {
    Filter: {
      Page: 1,
      Limit: 5,

      // Keep this narrow to avoid timeouts:
      DatePlacedFrom: from,

      // Most stores allow this; reduces results a lot.
      // If your store rejects it, comment it out.
      OrderStatus: ["Pick", "Pack", "New", "Dispatched", "Backorder", "Complete"],

      OutputSelector: OUT,
    },
  };

  const data = await netoRequest<any>("GetOrder", payload, {
    timeoutMs: 60_000, // ✅ longer timeout only here
  });

  const orders = (data?.Order ?? data?.Orders ?? []) as any[];
  const arr = Array.isArray(orders) ? orders : [];

  const sample = arr.map((o: any) => {
    const lines = extractLines(o).slice(0, 3);
    return {
      OrderID: o?.OrderID,
      PurchaseOrderNumber: o?.PurchaseOrderNumber,
      SalesChannel: o?.SalesChannel,
      DatePlaced: o?.DatePlaced,
      OrderStatus: o?.OrderStatus,
      LineRefs: lines.map((l: any) => ({
        ExternalSystemIdentifier: l?.ExternalSystemIdentifier,
        ExternalOrderReference: l?.ExternalOrderReference,
        ExternalOrderLineReference: l?.ExternalOrderLineReference,
        eBayTransactionID: l?.eBay?.eBayTransactionID ?? l?.eBayTransactionID,
        eBayAuctionID: l?.eBay?.eBayAuctionID ?? l?.eBayAuctionID,
      })),
    };
  });

  return NextResponse.json({
    ok: true,
    from,
    returned: arr.length,
    sample,
    ack: data?.Ack,
    messages: data?.Messages,
  });
}
