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

async function getFirstBy(filter: Record<string, any>, timeoutMs = 12_000) {
  const payload = { Filter: { ...filter, OutputSelector: OUTPUT_SELECTOR } };
  const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs });
  return firstOrder(data);
}

function normalize(raw: string) {
  const ref = decodeURIComponent(raw || "").replace(/\/+$/, "").trim();
  return { ref, compact: compactify(ref) };
}

// ⚡ Generate all possible variants of the reference
function buildVariants(ref: string): string[] {
  const variants = new Set([ref]);
  const compact = compactify(ref);

  if (compact !== ref) {
    variants.add(compact);
  }

  // If it's all digits and 11+ chars, try adding eBay format hyphens (XX-XXXXX-XXXXX)
  if (/^\d{11,}$/.test(compact)) {
    const formatted = `${compact.slice(0, 2)}-${compact.slice(2, 7)}-${compact.slice(7)}`;
    variants.add(formatted);
  }

  // If it has hyphens, also try without them
  if (ref.includes('-')) {
    variants.add(ref.replace(/-/g, ''));
  }

  return Array.from(variants);
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

// ⚡ Smart scan that also checks PurchaseOrderNumber in the results
async function scanEbayRecent(ref: string, compact: string, variants: string[]) {
  const LIMIT = 1000;
  const MAX_PAGES = 3; // Reduced for speed

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateFrom = thirtyDaysAgo.toISOString().split('T')[0];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const payload = {
      Filter: {
        Page: page,
        Limit: LIMIT,
        SalesChannel: "eBay",
        DatePlacedFrom: dateFrom,
        OutputSelector: OUTPUT_SELECTOR,
      },
    };

    let data: NetoGetOrderResponse;
    try {
      data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 20_000 });
    } catch {
      const payload2 = {
        Filter: {
          Page: page,
          Limit: LIMIT,
          DatePlacedFrom: dateFrom,
          OutputSelector: OUTPUT_SELECTOR
        },
      };
      data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload2, { timeoutMs: 20_000 });
    }

    const orders = listOrders(data);
    if (orders.length === 0) break;

    const sorted = orders.slice().sort((a, b) => (isEbayOrder(a) ? 0 : 1) - (isEbayOrder(b) ? 0 : 1));

    for (const order of sorted) {
      // ⚡ Check PurchaseOrderNumber against all variants
      const po = String(order?.PurchaseOrderNumber ?? "").trim();
      if (po && variants.some(v => v === po || compactify(po) === compactify(v))) {
        return order;
      }

      // Check line-level matches
      const lines = extractLines(order);
      if (lines.some((l: any) => lineMatches(l, ref, compact))) {
        return order;
      }
    }
  }

  return null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ ref: string }> }) {
  const { ref: raw } = await ctx.params;
  const { ref, compact } = normalize(raw);

  if (!ref) return NextResponse.json({ ok: false, error: "Missing ref" }, { status: 400 });

  try {
    // ⚡ Build all possible variants (with/without hyphens)
    const variants = buildVariants(ref);
    console.log(`[NETO] Searching for variants:`, variants);

    let order: any | null = null;
    let matchedWith: string | null = null;

    // ⚡ Try all variants in parallel for both PurchaseOrderNumber and OrderID
    const lookupPromises = variants.flatMap(variant => [
      getFirstBy({ PurchaseOrderNumber: variant }).then(o => ({ order: o, variant, field: 'PurchaseOrderNumber' })),
      getFirstBy({ OrderID: variant }).then(o => ({ order: o, variant, field: 'OrderID' })),
    ]);

    const results = await Promise.allSettled(lookupPromises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.order) {
        order = result.value.order;
        matchedWith = `${result.value.field}=${result.value.variant}`;
        console.log(`[NETO] Found via direct lookup:`, matchedWith);
        break;
      }
    }

    // ⚡ Only scan if direct lookups fail
    if (!order) {
      console.warn(`[NETO] Direct lookup failed for all variants, falling back to scan`);
      order = await scanEbayRecent(ref, compact, variants);
      if (order) {
        matchedWith = 'scan';
        console.log(`[NETO] Found via scan`);
      }
    }

    if (!order) {
      return NextResponse.json(
        {
          ok: false,
          error: `eBay ref not found in Neto: ${ref}`,
          hint: "Enter eBay Order ID (e.g. 22-xxxxx-xxxxx or 22xxxxxxxxxxx) OR Transaction ID. Note: Only searches orders from the last 30 days.",
          tried: variants,
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
      matchedWith,
      variants,
    });
  } catch (e: any) {
    console.error(`[NETO] Error:`, e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed" }, { status: 502 });
  }
}