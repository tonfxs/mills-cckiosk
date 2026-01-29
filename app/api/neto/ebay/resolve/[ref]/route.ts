import { NextResponse } from "next/server";
import { netoRequest } from "@/app/lib/neto-client";

type NetoGetOrderResponse = { Ack?: string; Order?: any[]; Orders?: any[] };

const OUTPUT_SELECTOR = [
  "OrderID",
  "PurchaseOrderNumber",
  "SalesChannel",
  "OrderStatus",
  "DatePlaced",
  "DateUpdated",
  "Email",
  "ShipAddress",
  "BillAddress",
  "GrandTotal",
  "ShippingTotal",

  "OrderLine",
  "OrderLine.SKU",
  "OrderLine.ProductName",
  "OrderLine.Quantity",
  "OrderLine.UnitPrice",

  "OrderLine.ExternalSystemIdentifier",
  "OrderLine.ExternalOrderReference",
  "OrderLine.ExternalOrderLineReference",

  "OrderLine.eBay.eBayTransactionID",
  "OrderLine.eBay.eBayAuctionID",
  "OrderLine.eBayTransactionID",
  "OrderLine.eBayAuctionID",
] as const;

function listOrders(data: NetoGetOrderResponse): any[] {
  const arr = (data?.Order ?? data?.Orders ?? []) as any[];
  return Array.isArray(arr) ? arr : [];
}

function firstOrder(data: NetoGetOrderResponse) {
  return listOrders(data)[0] ?? null;
}

function extractLines(order: any) {
  const ol = order?.OrderLine;
  if (Array.isArray(ol)) return ol;
  if (ol && Array.isArray(ol.OrderLine)) return ol.OrderLine;
  if (ol && Array.isArray(ol.Line)) return ol.Line;
  if (ol && typeof ol === "object") return [ol];
  return [];
}

function compactify(v: any) {
  return String(v ?? "").trim().replace(/[\s-]/g, "");
}

async function getFirstBy(filter: Record<string, any>, timeoutMs = 25_000) {
  const payload = { Filter: { ...filter, OutputSelector: OUTPUT_SELECTOR } };
  const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs });
  return firstOrder(data);
}

function normalize(raw: string) {
  const ref = decodeURIComponent(raw || "").replace(/\/+$/, "").trim();
  return { ref, compact: compactify(ref) };
}

function isEbayOrder(order: any) {
  const sc = String(order?.SalesChannel ?? "").toLowerCase();
  return sc.includes("ebay");
}

function lineMatches(line: any, ref: string, compact: string) {
  const candidates = [
    line?.ExternalOrderLineReference,
    line?.eBay?.eBayTransactionID,
    line?.eBayTransactionID,
    line?.eBay?.eBayAuctionID,
    line?.eBayAuctionID,
  ];

  for (const c of candidates) {
    const s = String(c ?? "").trim();
    if (!s) continue;
    if (s === ref) return true;
    if (compactify(s) === compact) return true;
  }
  return false;
}

async function scanEbayRecent(ref: string, compact: string) {
  const LIMIT = 100;
  const MAX_PAGES = 30; // tune for your volume

  for (let page = 1; page <= MAX_PAGES; page++) {
    // try channel-filtered first (fast if supported)
    const payload = {
      Filter: {
        Page: page,
        Limit: LIMIT,
        SalesChannel: "eBay",
        OutputSelector: OUTPUT_SELECTOR,
      },
    };

    let data: NetoGetOrderResponse;
    try {
      data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 60_000 });
    } catch {
      // if SalesChannel filter not supported, fall back to unfiltered scan for this page
      const payload2 = {
        Filter: { Page: page, Limit: LIMIT, OutputSelector: OUTPUT_SELECTOR },
      };
      data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload2, { timeoutMs: 60_000 });
    }

    const orders = listOrders(data);
    if (orders.length === 0) break;

    // prefer ebay orders if SalesChannel is present
    const sorted = orders.slice().sort((a, b) => (isEbayOrder(a) ? 0 : 1) - (isEbayOrder(b) ? 0 : 1));

    for (const order of sorted) {
      const lines = extractLines(order);
      if (lines.some((l: any) => lineMatches(l, ref, compact))) return order;
    }
  }

  return null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ ref: string }> }) {
  const { ref: raw } = await ctx.params;
  const { ref, compact } = normalize(raw);

  if (!ref) return NextResponse.json({ ok: false, error: "Missing ref" }, { status: 400 });

  try {
    // 1) fastest: eBay Order ID format usually stored in PurchaseOrderNumber
    let order =
      (await getFirstBy({ PurchaseOrderNumber: ref })) ||
      (await getFirstBy({ OrderID: ref })) ||
      (await getFirstBy({ ExternalOrderLineReference: ref })) ||
      (await getFirstBy({ ExternalOrderReference: ref })) ||
      (await getFirstBy({ ExternalSystemIdentifier: "ebay" })); // not for lookup, but can help test access

    // 2) if not found, scan for transaction/auction/line ref
    if (!order) order = await scanEbayRecent(ref, compact);

    if (!order) {
      return NextResponse.json(
        {
          ok: false,
          error: `eBay ref not found in Neto: ${ref}`,
          hint:
            "Enter eBay Order ID (e.g. 22-xxxxx-xxxxx) OR Transaction ID (digits) OR AuctionID-TransactionID.",
        },
        { status: 404 }
      );
    }

    const items = extractLines(order);

    return NextResponse.json({
      ok: true,
      order,
      items,
      itemsCount: items.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed" }, { status: 502 });
  }
}
