import { netoRequest } from "@/app/lib/neto-client";
import { NextResponse } from "next/server";

type NetoGetOrderResponse = { Ack?: string; Order?: any[]; Orders?: any[] };

const OUTPUT_SELECTOR = [
  "ID",
  "OrderID",
  "OrderNumber",
  "PurchaseOrderNumber",
  "OrderStatus",
  "DatePlaced",
  "DateUpdated",
  "Email",
  "Username",
  "ShipAddress",
  "BillAddress",
  "GrandTotal",
  "ShippingTotal",
  "SalesChannel",
  "InternalOrderNotes",
  "StickyNotes",
  "BillFirstName",
  "BillLastName",
  "DefaultPaymentType",
  "DeliveryInstruction",
  "ShippingOption",

  "OrderLine",
  "OrderLine.SKU",
  "OrderLine.ProductName",
  "OrderLine.Quantity",
  "OrderLine.UnitPrice",
  "OrderLine.WarehouseName",
  "OrderLine.PickQuantity",
  "OrderLine.BackorderQuantity",
  "OrderLine.ItemNotes",
  "OrderLine.KitItemSKU",    // parent kit SKU — present on component lines
  "OrderLine.IsKitItem",     // flag indicating this line is a kit component

  "OrderLine.ExternalSystemIdentifier",
  "OrderLine.ExternalOrderReference",
  "OrderLine.ExternalOrderLineReference",

  "OrderLine.eBay.eBayTransactionID",
  "OrderLine.eBay.eBayAuctionID",
  "OrderLine.eBayTransactionID",
  "OrderLine.eBayAuctionID",
] as const;

// ---------- Kit definitions ----------
// When Neto returns a kit SKU, expand it into its component lines.
// Add new kits here as you discover them.
// Each component can optionally override name/price; otherwise they show as "—".
// qty is multiplied by the parent line's quantity.

// ---------- Kit definitions ----------
// Only define SKU + Quantity here. Name and price are fetched live from Neto GetItem.
// Add new kits here as you discover them.

type KitComponent = {
  SKU: string;
  Quantity: number; // per kit unit
};

const KIT_DEFINITIONS: Record<string, KitComponent[]> = {
  "PRWPTLJETA770-KIT": [
    { SKU: "PRWPTLJETA770", Quantity: 1 },
    { SKU: "PRWACSJETA20D", Quantity: 1 },
  ],
  // Add more kits below as needed:
  // "SOME-OTHER-KIT": [
  //   { SKU: "COMP-A", Quantity: 1 },
  //   { SKU: "COMP-B", Quantity: 2 },
  // ],
};

// Fetch live item details (name + price) from Neto for a list of SKUs
async function fetchItemDetails(skus: string[]): Promise<Record<string, { name: string; price: string | null }>> {
  if (skus.length === 0) return {};
  try {
    const payload = {
      Filter: {
        SKU: skus,
        OutputSelector: ["SKU", "Name", "DefaultPrice", "SellPrice", "RRP"],
      },
    };
    console.log("[NETO GetItem REQUEST]", JSON.stringify(payload, null, 2));
    const data = await netoRequest<{ Ack?: string; Item?: any[] }>("GetItem", payload, { timeoutMs: 15_000 });
    console.log("[NETO GetItem RAW RESPONSE]", JSON.stringify(data, null, 2));
    const items: any[] = Array.isArray(data?.Item) ? data.Item : [];
    const map: Record<string, { name: string; price: string | null }> = {};
    for (const item of items) {
      const sku = String(item?.SKU ?? "").trim();
      if (!sku) continue;
      const price = String(item?.DefaultPrice ?? item?.SellPrice ?? item?.RRP ?? "").trim() || null;
      const name = String(item?.Name ?? "").trim();
      map[sku] = { name, price };
    }
    return map;
  } catch (e: any) {
    console.error("[NETO GetItem ERROR]", e?.message ?? e);
    return {};
  }
}

// ---------- helpers ----------
function listOrders(data: NetoGetOrderResponse): any[] {
  const arr = (data?.Order ?? data?.Orders ?? []) as any[];
  return Array.isArray(arr) ? arr : [];
}

function firstOrder(data: NetoGetOrderResponse) {
  return listOrders(data)[0] ?? null;
}

function getRawLines(order: any): any[] {
  if (!order) return [];
  if (Array.isArray(order.OrderLine)) return order.OrderLine;
  const ol = order.OrderLine;
  if (ol && Array.isArray(ol.OrderLine)) return ol.OrderLine;
  if (ol && Array.isArray(ol.Line)) return ol.Line;
  if (ol && typeof ol === "object") return [ol];
  return [];
}

// Collect all component SKUs that need live price/name lookup
function collectKitComponentSKUs(order: any): string[] {
  const raw = getRawLines(order);
  const skus = new Set<string>();
  for (const line of raw) {
    const sku = String(line?.SKU ?? "").trim();
    const kitDef = KIT_DEFINITIONS[sku];
    if (kitDef) kitDef.forEach((c) => skus.add(c.SKU));
  }
  return Array.from(skus);
}

// Expand order lines, injecting live item details for kit components
function extractLines(order: any, _itemDetails: Record<string, { name: string; price: string | null }> = {}): any[] {
  const raw = getRawLines(order);

  // Check if Neto already returned component lines natively (KitItemSKU populated)
  const hasNativeKitLines = raw.some(
    (l) => String(l?.KitItemSKU ?? "").trim() !== "" || String(l?.IsKitItem ?? "").trim() !== ""
  );

  if (hasNativeKitLines) {
    // Neto returned all lines including components — just tag them for display
    // Group: kit header = line where IsKitItem is falsy but its SKU is a known kit
    //        component  = line where KitItemSKU is set
    return raw.map((line) => {
      const kitParent = String(line?.KitItemSKU ?? "").trim();
      const isKitHeader = !kitParent && !!KIT_DEFINITIONS[String(line?.SKU ?? "").trim()];
      const isKitComponent = !!kitParent;
      return { ...line, isKitHeader, isKitComponent, kitParentSKU: kitParent || undefined };
    });
  }

  // Fallback: Neto did not return component lines — expand manually using KIT_DEFINITIONS
  // (name comes from KIT_DEFINITIONS SKU itself since no detail available;
  //  price will be blank — this is the best we can do without a separate GetItem call)
  const expanded: any[] = [];

  for (const line of raw) {
    const sku = String(line?.SKU ?? "").trim();
    const kitDef = KIT_DEFINITIONS[sku];

    if (kitDef) {
      const parentQty = Number(line?.Quantity ?? 1);
      expanded.push({ ...line, isKitHeader: true });

      for (const component of kitDef) {
        expanded.push({
          SKU: component.SKU,
          ProductName: component.SKU, // Neto didn't give us the name — show SKU
          Quantity: String(component.Quantity * parentQty),
          UnitPrice: null,            // Neto didn't give us the price
          WarehouseName: line?.WarehouseName ?? "—",
          PickQuantity: null,
          BackorderQuantity: null,
          isKitComponent: true,
          kitParentSKU: sku,
          OrderLineID: `${line?.OrderLineID ?? sku}-component-${component.SKU}`,
        });
      }
    } else {
      expanded.push(line);
    }
  }

  return expanded;
}

function compactify(v: any) {
  return String(v ?? "").trim().replace(/[\s-]/g, "");
}

function normalizeRef(raw: string) {
  const ref = decodeURIComponent(raw || "").replace(/\/+$/, "").trim();
  return { ref, compact: compactify(ref) };
}

function buildCandidates(ref: string) {
  const r = ref.trim();
  return Array.from(new Set([r, r.replace(/[\s-]/g, ""), r.replace(/\s+/g, "")].filter(Boolean)));
}

function eqNorm(a: any, b: any) {
  const aa = String(a ?? "").trim();
  const bb = String(b ?? "").trim();
  return aa && bb && aa === bb;
}

function isEbayPurchaseOrderNumber(ref: string) {
  return /^\d{2}-\d{5}-\d{5}$/.test(ref);
}

function isDigitsId(ref: string) {
  return /^\d{8,}$/.test(ref);
}

function isAuctionTxnCombo(ref: string) {
  return /^\d{6,}-\d{8,}$/.test(ref);
}

function lineMatchesEbay(line: any, ref: string, compact: string) {
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

function isoDateNDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoDateNDaysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function getFirstBy(filter: Record<string, any>, timeoutMs = 25_000) {
  const payload = { Filter: { ...filter, OutputSelector: OUTPUT_SELECTOR } };

  console.log("[NETO GetOrder REQUEST]", JSON.stringify(payload, null, 2));
  const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs });
  console.log("[NETO GetOrder RAW RESPONSE]", JSON.stringify(data, null, 2));

  return firstOrder(data);
}

async function resolveByPurchaseOrderScan(ref: string) {
  const WINDOW_DAYS = 7;
  const LIMIT = 100;
  const MAX_PAGES = 20;

  const from = isoDateNDaysAgo(WINDOW_DAYS);
  const to = isoDateNDaysFromNow(0);

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const payload = {
        Filter: {
          Page: page,
          Limit: LIMIT,
          DatePlacedFrom: from,
          DatePlacedTo: to,
          SalesChannel: "eBay",
          OutputSelector: OUTPUT_SELECTOR,
        },
      };

      console.log("[NETO PO-SCAN REQUEST - eBay]", JSON.stringify(payload, null, 2));
      const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 60_000 });
      console.log("[NETO PO-SCAN RAW RESPONSE - eBay]", JSON.stringify(data, null, 2));

      const orders = listOrders(data);
      if (orders.length === 0) break;

      const found = orders.find((o) => eqNorm(o?.PurchaseOrderNumber, ref));
      if (found) return found;
    } catch (err: any) {
      console.log("[NETO PO-SCAN] SalesChannel filter not supported or failed:", err?.message ?? err);
      break;
    }
  }

  for (let page = 1; page <= MAX_PAGES; page++) {
    const payload = {
      Filter: {
        Page: page,
        Limit: LIMIT,
        DatePlacedFrom: from,
        DatePlacedTo: to,
        OutputSelector: OUTPUT_SELECTOR,
      },
    };

    console.log("[NETO PO-SCAN REQUEST - Fallback]", JSON.stringify(payload, null, 2));
    const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 60_000 });
    console.log("[NETO PO-SCAN RAW RESPONSE - Fallback]", JSON.stringify(data, null, 2));

    const orders = listOrders(data);
    if (orders.length === 0) break;

    const found = orders.find((o) => eqNorm(o?.PurchaseOrderNumber, ref));
    if (found) return found;
  }

  return null;
}

async function resolveEbayByScan(ref: string, compact: string) {
  const WINDOW_DAYS = 7;
  const LIMIT = 100;
  const MAX_PAGES = 20;

  const from = isoDateNDaysAgo(WINDOW_DAYS);
  const to = isoDateNDaysFromNow(0);

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const payload = {
        Filter: {
          Page: page,
          Limit: LIMIT,
          DatePlacedFrom: from,
          DatePlacedTo: to,
          SalesChannel: "eBay",
          OutputSelector: OUTPUT_SELECTOR,
        },
      };

      console.log("[NETO LINE-SCAN REQUEST - eBay]", JSON.stringify(payload, null, 2));
      const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 60_000 });
      console.log("[NETO LINE-SCAN RAW RESPONSE - eBay]", JSON.stringify(data, null, 2));

      const orders = listOrders(data);
      if (orders.length === 0) break;

      for (const order of orders) {
        const lines = extractLines(order);
        if (lines.some((l) => lineMatchesEbay(l, ref, compact))) return order;
      }
    } catch (err: any) {
      console.log("[NETO LINE-SCAN] SalesChannel filter not supported or failed:", err?.message ?? err);
      break;
    }
  }

  for (let page = 1; page <= MAX_PAGES; page++) {
    const payload = {
      Filter: {
        Page: page,
        Limit: LIMIT,
        DatePlacedFrom: from,
        DatePlacedTo: to,
        OutputSelector: OUTPUT_SELECTOR,
      },
    };

    console.log("[NETO LINE-SCAN REQUEST - Fallback]", JSON.stringify(payload, null, 2));
    const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 60_000 });
    console.log("[NETO LINE-SCAN RAW RESPONSE - Fallback]", JSON.stringify(data, null, 2));

    const orders = listOrders(data);
    if (orders.length === 0) break;

    for (const order of orders) {
      const lines = extractLines(order);
      if (lines.some((l) => lineMatchesEbay(l, ref, compact))) return order;
    }
  }

  return null;
}

// ---------- handler ----------
export async function GET(_req: Request, ctx: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber: raw } = await ctx.params;
  const { ref, compact } = normalizeRef(raw);

  if (!ref) return NextResponse.json({ ok: false, error: "Missing order ref" }, { status: 400 });

  try {
    const candidates = buildCandidates(ref);

    let order: any | null = null;
    let matchedQuery: string | null = null;

    const preferPO = isEbayPurchaseOrderNumber(ref);

    if (preferPO) {
      for (const key of candidates) {
        order = await getFirstBy({ PurchaseOrderNumber: key });
        if (order) { matchedQuery = "PurchaseOrderNumber"; break; }
      }
    }

    if (!order) {
      for (const key of candidates) {
        order = await getFirstBy({ OrderID: key });
        if (order) { matchedQuery = "OrderID"; break; }
      }
    }

    if (!order && !preferPO) {
      for (const key of candidates) {
        order = await getFirstBy({ PurchaseOrderNumber: key });
        if (order) { matchedQuery = "PurchaseOrderNumber"; break; }
      }
    }

    if (!order) {
      for (const key of candidates) {
        order = await getFirstBy({ ExternalOrderLineReference: key });
        if (order) { matchedQuery = "ExternalOrderLineReference"; break; }

        order = await getFirstBy({ ExternalOrderReference: key });
        if (order) { matchedQuery = "ExternalOrderReference"; break; }
      }
    }

    if (!order) {
      for (const key of candidates) {
        const found = await resolveByPurchaseOrderScan(key);
        if (found) { order = found; matchedQuery = "resolveByPurchaseOrderScan"; break; }
      }
    }

    const looksEbayLineId = isDigitsId(ref) || isAuctionTxnCombo(ref);
    if (!order && looksEbayLineId) {
      order = await resolveEbayByScan(ref, compact);
      if (order) matchedQuery = "resolveEbayByScan";
    }

    if (!order) {
      return NextResponse.json(
        {
          ok: false,
          error: `Order not found for ref ${ref}`,
          hint: isEbayPurchaseOrderNumber(ref)
            ? "This looks like an eBay Order ID, but it is not present in Neto PurchaseOrderNumber (or your API cannot filter it). Tried scanning recent eBay orders (last 7 days) too."
            : "For eBay, use Neto OrderID OR eBay Order ID (format 22-xxxxx-xxxxx) OR Transaction ID / AuctionID-TransactionID.",
        },
        { status: 404 }
      );
    }

    const items = extractLines(order);

    console.log("[NETO RESOLVED ORDER]", JSON.stringify(order, null, 2));
    console.log("[NETO RESOLVED ITEMS]", JSON.stringify(items, null, 2));

    const resolvedOrderId = String(order?.OrderID ?? "").trim() || null;

    const displayRef =
      matchedQuery === "PurchaseOrderNumber" || matchedQuery === "resolveByPurchaseOrderScan"
        ? String(order?.PurchaseOrderNumber ?? "").trim() || ref
        : ref;

    return NextResponse.json({
      ok: true,
      matchedQuery,
      resolvedOrderId,
      displayRef,

      identifiers: {
        netoOrderID: resolvedOrderId,
        netoOrderNumber: String(order?.OrderNumber ?? "").trim() || null,
        purchaseOrderNumber: String(order?.PurchaseOrderNumber ?? "").trim() || null,
        salesChannel: String(order?.SalesChannel ?? "").trim() || null,
      },

      order,
      items,
      itemsCount: items.length,
    });
  } catch (e: any) {
    console.error("[NETO LOOKUP ERROR]", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed to fetch order" }, { status: 502 });
  }
}