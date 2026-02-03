//latest working file
// import { NextResponse } from "next/server";
// import { netoRequest } from "@/app/lib/neto-client";

// type NetoGetOrderResponse = {
//   Ack?: string;
//   Order?: any[];   // Neto uses "Order" (array) in their JSON example
//   Orders?: any[];  // keep fallback if your store returns "Orders"
//   Messages?: any;
//   Errors?: any;
// };

// const OUTPUT_SELECTOR = [
//   "ID",
//   "OrderID",
//   "PurchaseOrderNumber",
//   "OrderStatus",
//   "DatePlaced",
//   "DateUpdated",
//   "Email",
//   "Username",
//   "ShipAddress",
//   "BillAddress",
//   "GrandTotal",
//   "ShippingTotal",
//   "ProductSubtotal",
//   "OrderTax",
//   "TaxInclusive",
//   "ShippingOption",
//   "DeliveryInstruction",
//   "SalesChannel",
//   "OrderPayment",
//   "OrderPayment.PaymentType",
//   "InternalOrderNotes",
//   "StickyNotes",
//   "OrderLine",
//   "OrderLine.ProductName",
//   "OrderLine.SKU",
//   "OrderLine.Quantity",
//   "OrderLine.UnitPrice",
//   "OrderLine.PickQuantity",
//   "OrderLine.BackorderQuantity",
//   "OrderLine.ShippingMethod",
//   "OrderLine.ShippingTracking",
// ] as const;

// // Neto sometimes returns Order (array) per docs, some wrappers return Orders.
// // We'll accept both.
// function firstOrder(data: NetoGetOrderResponse) {
//   return (data?.Orders?.[0] ?? data?.Order?.[0] ?? null);
// }

// async function getFirstBy(filter: Record<string, any>) {
//   const payload = {
//     Filter: {
//       ...filter,
//       // docs show OutputSelector elements inside Filter :contentReference[oaicite:3]{index=3}
//       OutputSelector: OUTPUT_SELECTOR,
//     },
//   };

//   const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 25_000 });
//   return { data, order: firstOrder(data) };
// }

// export async function GET(
//   _req: Request,
//   ctx: { params: Promise<{ orderNumber: string }> }
// ) {
//   const { orderNumber: raw } = await ctx.params;
//   const ref = decodeURIComponent(raw || "").trim();

//   if (!ref) {
//     return NextResponse.json({ ok: false, error: "Missing order ref" }, { status: 400 });
//   }

//   try {
//     // ✅ 1) primary: OrderID (this is the "order number" field in GetOrder)
//     let r = await getFirstBy({ OrderID: ref });
//     if (r.order) return NextResponse.json({ ok: true, order: r.order, matchedQuery: "OrderID" });

//     // ✅ 2) fallback: PurchaseOrderNumber (often marketplace refs)
//     r = await getFirstBy({ PurchaseOrderNumber: ref });
//     if (r.order) return NextResponse.json({ ok: true, order: r.order, matchedQuery: "PurchaseOrderNumber" });

//     // ✅ 3) fallback: external refs (supported filters in docs)
//     r = await getFirstBy({ ExternalOrderReference: ref });
//     if (r.order) return NextResponse.json({ ok: true, order: r.order, matchedQuery: "ExternalOrderReference" });

//     r = await getFirstBy({ ExternalSystemIdentifier: ref });
//     if (r.order) return NextResponse.json({ ok: true, order: r.order, matchedQuery: "ExternalSystemIdentifier" });

//     return NextResponse.json(
//       { ok: false, error: `Order not found for ref ${ref}` },
//       { status: 404 }
//     );
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, error: e?.message ?? "Failed to fetch order from Neto" },
//       { status: 502 }
//     );
//   }
// }


// import { NextResponse } from "next/server";
// import { netoRequest } from "@/app/lib/neto-client";

// type NetoGetOrderResponse = {
//   Ack?: string;
//   Order?: any[];
//   Orders?: any[];
// };

// const OUTPUT_SELECTOR = [
//   // header
//   "ID",
//   "OrderID",
//   "PurchaseOrderNumber",
//   "OrderStatus",
//   "DatePlaced",
//   "DateUpdated",
//   "Email",
//   "Username",
//   "ShipAddress",
//   "BillAddress",
//   "GrandTotal",
//   "ShippingTotal",
//   "ProductSubtotal",
//   "OrderTax",
//   "TaxInclusive",
//   "ShippingOption",
//   "DeliveryInstruction",
//   "SalesChannel",
//   "OrderPayment",
//   "OrderPayment.PaymentType",
//   "OrderPayment.DatePaid",

//   // ✅ lines (must be requested or you won't receive them)
//   "OrderLine",
//   "OrderLine.SKU",
//   "OrderLine.ProductName",
//   "OrderLine.Quantity",
//   "OrderLine.UnitPrice",
//   "OrderLine.PickQuantity",
//   "OrderLine.BackorderQuantity",
// ] as const;

// // Neto responses vary a lot; normalize to an array
// function extractOrderLines(order: any): any[] {
//   if (!order) return [];

//   // Most common: OrderLine is already an array
//   if (Array.isArray(order.OrderLine)) return order.OrderLine;

//   // Sometimes: { OrderLine: { OrderLine: [...] } } or { OrderLine: { Line: [...] } }
//   const ol = order.OrderLine;
//   if (ol && Array.isArray(ol.OrderLine)) return ol.OrderLine;
//   if (ol && Array.isArray(ol.Line)) return ol.Line;

//   // Sometimes: single object
//   if (ol && typeof ol === "object") return [ol];

//   return [];
// }

// function firstOrder(data: NetoGetOrderResponse) {
//   return data?.Orders?.[0] ?? data?.Order?.[0] ?? null;
// }

// async function getFirstBy(filter: Record<string, any>) {
//   const payload = { Filter: { ...filter, OutputSelector: OUTPUT_SELECTOR } };
//   const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 25_000 });
//   return firstOrder(data);
// }

// export async function GET(
//   _req: Request,
//   ctx: { params: Promise<{ orderNumber: string }> }
// ) {
//   const { orderNumber: raw } = await ctx.params;
//   const ref = decodeURIComponent(raw || "").trim();

//   if (!ref) {
//     return NextResponse.json({ ok: false, error: "Missing order ref" }, { status: 400 });
//   }

//   try {
//     // ✅ Primary filter for "order number" style refs (N..., E..., M...)
//     let order = await getFirstBy({ OrderID: ref });
//     if (!order) order = await getFirstBy({ PurchaseOrderNumber: ref });

//     if (!order) {
//       return NextResponse.json({ ok: false, error: `Order not found for ref ${ref}` }, { status: 404 });
//     }

//     const items = extractOrderLines(order);

//     return NextResponse.json({
//       ok: true,
//       order,
//       items,              // ✅ normalized lines for frontend
//       itemsCount: items.length,
//     });
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, error: e?.message ?? "Failed to fetch order from Neto" },
//       { status: 502 }
//     );
//   }
// }


// import { NextResponse } from "next/server";
// import { netoRequest } from "@/app/lib/neto-client";

// type NetoGetOrderResponse = {
//   Ack?: string;
//   Order?: any[];
//   Orders?: any[];
// };

// const OUTPUT_SELECTOR = [
//   // header
//   "ID",
//   "OrderID",
//   "PurchaseOrderNumber",
//   "OrderStatus",
//   "DatePlaced",
//   "DateUpdated",
//   "Email",
//   "Username",
//   "ShipAddress",
//   "BillAddress",
//   "GrandTotal",
//   "ShippingTotal",
//   "ProductSubtotal",
//   "OrderTax",
//   "TaxInclusive",
//   "ShippingOption",
//   "DeliveryInstruction",
//   "SalesChannel",
//   "OrderPayment",
//   "OrderPayment.PaymentType",
//   "OrderPayment.DatePaid",

//   // ✅ lines (must be requested or you won't receive them)
//   "OrderLine",
//   "OrderLine.SKU",
//   "OrderLine.ProductName",
//   "OrderLine.Quantity",
//   "OrderLine.UnitPrice",
//   "OrderLine.PickQuantity",
//   "OrderLine.BackorderQuantity",
//   "OrderLine.ShippingMethod",
//   "OrderLine.ShippingTracking",

//   // ✅ external refs (marketplace/eBay often live here)
//   "OrderLine.ExternalSystemIdentifier",
//   "OrderLine.ExternalOrderReference",
//   "OrderLine.ExternalOrderLineReference",

//   // ✅ eBay details (for visibility/debug)
//   "OrderLine.eBay.eBayTransactionID",
//   "OrderLine.eBay.eBayAuctionID",
//   "OrderLine.eBay.eBayUsername",
//   "OrderLine.eBay.eBayStoreName",
// ] as const;

// // Neto responses vary a lot; normalize to an array
// function extractOrderLines(order: any): any[] {
//   if (!order) return [];

//   // Most common: OrderLine is already an array
//   if (Array.isArray(order.OrderLine)) return order.OrderLine;

//   // Sometimes: { OrderLine: { OrderLine: [...] } } or { OrderLine: { Line: [...] } }
//   const ol = order.OrderLine;
//   if (ol && Array.isArray(ol.OrderLine)) return ol.OrderLine;
//   if (ol && Array.isArray(ol.Line)) return ol.Line;

//   // Sometimes: single object
//   if (ol && typeof ol === "object") return [ol];

//   return [];
// }

// function firstOrder(data: NetoGetOrderResponse) {
//   return data?.Orders?.[0] ?? data?.Order?.[0] ?? null;
// }

// async function getFirstBy(filter: Record<string, any>) {
//   const payload = { Filter: { ...filter, OutputSelector: OUTPUT_SELECTOR } };
//   const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 25_000 });
//   return firstOrder(data);
// }

// function buildCandidates(raw: string) {
//   const decoded = decodeURIComponent(raw || "");
//   const ref = decoded.replace(/\/+$/, "").trim();

//   const noHyphenSpace = ref.replace(/[\s-]/g, ""); // remove hyphens/spaces
//   const noSpacesOnly = ref.replace(/\s+/g, "");

//   // Keep original first, then normalized variants
//   return Array.from(new Set([ref, noHyphenSpace, noSpacesOnly].filter(Boolean)));
// }

// // ✅ Full handler
// export async function GET(
//   _req: Request,
//   ctx: { params: Promise<{ orderNumber: string }> } // Next (async params)
// ) {
//   const { orderNumber: raw } = await ctx.params;

//   const candidates = buildCandidates(raw);
//   const ref = candidates[0] ?? "";

//   if (!ref) {
//     return NextResponse.json({ ok: false, error: "Missing order ref" }, { status: 400 });
//   }

//   try {
//     let order: any | null = null;
//     let matchedQuery: string | null = null;
//     let matchedValue: string | null = null;

//     // Try candidates (with/without hyphens/spaces)
//     for (const key of candidates) {
//       // ✅ Neto native
//       order = await getFirstBy({ OrderID: key });
//       if (order) {
//         matchedQuery = "OrderID";
//         matchedValue = key;
//         break;
//       }

//       // ✅ Marketplace PO / ref
//       order = await getFirstBy({ PurchaseOrderNumber: key });
//       if (order) {
//         matchedQuery = "PurchaseOrderNumber";
//         matchedValue = key;
//         break;
//       }

//       // ✅ eBay/marketplace refs often stored here
//       order = await getFirstBy({ ExternalOrderReference: key });
//       if (order) {
//         matchedQuery = "ExternalOrderReference";
//         matchedValue = key;
//         break;
//       }

//       order = await getFirstBy({ ExternalSystemIdentifier: key });
//       if (order) {
//         matchedQuery = "ExternalSystemIdentifier";
//         matchedValue = key;
//         break;
//       }

//       // ✅ sometimes only line-level reference matches
//       order = await getFirstBy({ ExternalOrderLineReference: key });
//       if (order) {
//         matchedQuery = "ExternalOrderLineReference";
//         matchedValue = key;
//         break;
//       }
//     }

//     if (!order) {
//       return NextResponse.json(
//         {
//           ok: false,
//           error: `Order not found for ref ${ref}`,
//           tried: candidates,
//         },
//         { status: 404 }
//       );
//     }

//     const items = extractOrderLines(order);

//     return NextResponse.json({
//       ok: true,
//       order,
//       items,
//       itemsCount: items.length,
//       matchedQuery,
//       matchedValue,
//       tried: candidates,
//     });
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, error: e?.message ?? "Failed to fetch order from Neto" },
//       { status: 502 }
//     );
//   }
// }

// import { NextResponse } from "next/server";
// import { netoRequest } from "@/app/lib/neto-client";

// type NetoGetOrderResponse = {
//   Ack?: string;
//   Order?: any[];
//   Orders?: any[];
// };

// const OUTPUT_SELECTOR = [
//   // header
//   "ID",
//   "OrderID",
//   "PurchaseOrderNumber",
//   "OrderStatus",
//   "DatePlaced",
//   "DateUpdated",
//   "Email",
//   "Username",
//   "ShipAddress",
//   "BillAddress",
//   "GrandTotal",
//   "ShippingTotal",
//   "ProductSubtotal",
//   "OrderTax",
//   "TaxInclusive",
//   "ShippingOption",
//   "DeliveryInstruction",
//   "SalesChannel",
//   "OrderPayment",
//   "OrderPayment.PaymentType",
//   "OrderPayment.DatePaid",

//   // ✅ lines
//   "OrderLine",
//   "OrderLine.SKU",
//   "OrderLine.ProductName",
//   "OrderLine.Quantity",
//   "OrderLine.UnitPrice",
//   "OrderLine.PickQuantity",
//   "OrderLine.BackorderQuantity",
//   "OrderLine.ShippingMethod",
//   "OrderLine.ShippingTracking",

//   // ✅ external refs
//   "OrderLine.ExternalSystemIdentifier",
//   "OrderLine.ExternalOrderReference",
//   "OrderLine.ExternalOrderLineReference",

//   // ✅ ebay identifiers (as seen in your debug sample)
//   "OrderLine.eBay.eBayTransactionID",
//   "OrderLine.eBay.eBayAuctionID",

//   // keep flattened variants too (some stores return these)
//   "OrderLine.eBayTransactionID",
//   "OrderLine.eBayAuctionID",
// ] as const;

// // -------------------- helpers --------------------

// function listOrders(data: NetoGetOrderResponse): any[] {
//   const arr = (data?.Order ?? data?.Orders ?? []) as any[];
//   return Array.isArray(arr) ? arr : [];
// }

// function firstOrder(data: NetoGetOrderResponse) {
//   return listOrders(data)[0] ?? null;
// }

// function extractOrderLines(order: any): any[] {
//   if (!order) return [];
//   if (Array.isArray(order.OrderLine)) return order.OrderLine;

//   const ol = order.OrderLine;
//   if (ol && Array.isArray(ol.OrderLine)) return ol.OrderLine;
//   if (ol && Array.isArray(ol.Line)) return ol.Line;

//   if (ol && typeof ol === "object") return [ol];
//   return [];
// }

// async function getFirstBy(filter: Record<string, any>, opts?: { timeoutMs?: number }) {
//   const payload = { Filter: { ...filter, OutputSelector: OUTPUT_SELECTOR } };
//   const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, {
//     timeoutMs: opts?.timeoutMs ?? 25_000,
//   });
//   return firstOrder(data);
// }

// function normalizeRef(raw: string) {
//   const ref = decodeURIComponent(raw || "").replace(/\/+$/, "").trim();
//   const compact = ref.replace(/[\s-]/g, ""); // remove spaces/hyphens
//   return { ref, compact };
// }

// function buildCandidates(ref: string) {
//   const r = ref.replace(/\/+$/, "").trim();
//   const noHyphenSpace = r.replace(/[\s-]/g, "");
//   const noSpacesOnly = r.replace(/\s+/g, "");
//   return Array.from(new Set([r, noHyphenSpace, noSpacesOnly].filter(Boolean)));
// }

// function compactify(v: any) {
//   return String(v ?? "").trim().replace(/[\s-]/g, "");
// }

// function isEbayOrder(order: any) {
//   const sc = String(order?.SalesChannel ?? "").toLowerCase();
//   return sc.includes("ebay");
// }

// // ✅ based on your debug sample fields
// function lineMatchesEbayKey(line: any, ref: string, compact: string) {
//   const candidates = [
//     // combo: AuctionID-TransactionID
//     line?.ExternalOrderLineReference,

//     // nested ebay object
//     line?.eBay?.eBayTransactionID,
//     line?.eBay?.eBayAuctionID,

//     // flattened (some stores)
//     line?.eBayTransactionID,
//     line?.eBayAuctionID,
//   ];

//   for (const c of candidates) {
//     const s = String(c ?? "").trim();
//     if (!s) continue;

//     if (s === ref) return true;
//     if (compactify(s) === compact) return true;
//   }

//   return false;
// }

// // Scan recent orders and match eBay line identifiers
// async function scanRecentForEbayId(ref: string, compact: string) {
//   // Tune to your volume. Keep bounded.
//   const MAX_PAGES = 10;
//   const LIMIT = 80;

//   for (let page = 1; page <= MAX_PAGES; page++) {
//     const payload = {
//       Filter: {
//         Page: page,
//         Limit: LIMIT,
//         OutputSelector: OUTPUT_SELECTOR,
//       },
//     };

//     // Give scanning a bit longer
//     const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 60_000 });
//     const orders = listOrders(data);
//     if (orders.length === 0) break;

//     // Prefer ebay channel first (if present)
//     const sorted = orders.slice().sort((a, b) => {
//       const aIs = isEbayOrder(a) ? 0 : 1;
//       const bIs = isEbayOrder(b) ? 0 : 1;
//       return aIs - bIs;
//     });

//     for (const order of sorted) {
//       // Only check ebay orders first; if none have SalesChannel, still works
//       const lines = extractOrderLines(order);
//       if (lines.some((l) => lineMatchesEbayKey(l, ref, compact))) return order;
//     }
//   }

//   return null;
// }

// // -------------------- handler --------------------

// export async function GET(_req: Request, ctx: { params: Promise<{ orderNumber: string }> }) {
//   const { orderNumber: raw } = await ctx.params;
//   const { ref, compact } = normalizeRef(raw);

//   if (!ref) {
//     return NextResponse.json({ ok: false, error: "Missing order ref" }, { status: 400 });
//   }

//   try {
//     let order: any | null = null;
//     let matchedQuery: string | null = null;

//     // ✅ Try both hyphenated and de-hyphenated variants
//     const candidates = buildCandidates(ref);

//     // 1) Fast filters (exact searchable fields)
//     for (const key of candidates) {
//       order = await getFirstBy({ OrderID: key });
//       if (order) {
//         matchedQuery = "OrderID";
//         break;
//       }

//       // ✅ eBay Order ID format like 22-14007-44574
//       order = await getFirstBy({ PurchaseOrderNumber: key });
//       if (order) {
//         matchedQuery = "PurchaseOrderNumber";
//         break;
//       }

//       order = await getFirstBy({ ExternalOrderReference: key });
//       if (order) {
//         matchedQuery = "ExternalOrderReference";
//         break;
//       }

//       order = await getFirstBy({ ExternalSystemIdentifier: key });
//       if (order) {
//         matchedQuery = "ExternalSystemIdentifier";
//         break;
//       }

//       order = await getFirstBy({ ExternalOrderLineReference: key });
//       if (order) {
//         matchedQuery = "ExternalOrderLineReference";
//         break;
//       }
//     }

//     // 2) Slow fallback: scan recent orders and match eBay transaction/auction/combined refs
//     if (!order) {
//       order = await scanRecentForEbayId(ref, compact);
//       if (order) matchedQuery = "scanRecentForEbayId";
//     }

//     if (!order) {
//       return NextResponse.json(
//         {
//           ok: false,
//           error: `Order not found for ref ${ref}`,
//           hint:
//             "For eBay, Neto matches PurchaseOrderNumber (eBay Order ID like 22-14007-44574) or line identifiers (TransactionID/AuctionID/ExternalOrderLineReference). The ref you entered may not exist in Neto.",
//         },
//         { status: 404 }
//       );
//     }

//     const items = extractOrderLines(order);

//     return NextResponse.json({
//       ok: true,
//       order,
//       items,
//       itemsCount: items.length,
//       matchedQuery,
//     });
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, error: e?.message ?? "Failed to fetch order from Neto" },
//       { status: 502 }
//     );
//   }
// }import { NextResponse } from "next/server";
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



  "OrderLine",
  "OrderLine.SKU",
  "OrderLine.ProductName",
  "OrderLine.Quantity",
  "OrderLine.UnitPrice",
  "OrderLine.WarehouseName",
  "OrderLine.PickQuantity",
  "OrderLine.BackorderQuantity",

  "OrderLine.ExternalSystemIdentifier",
  "OrderLine.ExternalOrderReference",
  "OrderLine.ExternalOrderLineReference",

  "OrderLine.eBay.eBayTransactionID",
  "OrderLine.eBay.eBayAuctionID",
  "OrderLine.eBayTransactionID",
  "OrderLine.eBayAuctionID",
] as const;

// ---------- helpers ----------
function listOrders(data: NetoGetOrderResponse): any[] {
  const arr = (data?.Order ?? data?.Orders ?? []) as any[];
  return Array.isArray(arr) ? arr : [];
}

function firstOrder(data: NetoGetOrderResponse) {
  return listOrders(data)[0] ?? null;
}

function extractLines(order: any): any[] {
  if (!order) return [];
  if (Array.isArray(order.OrderLine)) return order.OrderLine;

  const ol = order.OrderLine;
  if (ol && Array.isArray(ol.OrderLine)) return ol.OrderLine;
  if (ol && Array.isArray(ol.Line)) return ol.Line;
  if (ol && typeof ol === "object") return [ol];

  return [];
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

// Detect eBay PurchaseOrderNumber format: NN-NNNNN-NNNNN
function isEbayPurchaseOrderNumber(ref: string) {
  return /^\d{2}-\d{5}-\d{5}$/.test(ref);
}

// Detect transaction/auction ids
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

// ✅ scan recent orders (1-week span) and match top-level PurchaseOrderNumber
// ✅ ALWAYS tries SalesChannel="eBay" first, then falls back if unsupported
async function resolveByPurchaseOrderScan(ref: string) {
  const WINDOW_DAYS = 7;
  const LIMIT = 100;
  const MAX_PAGES = 20;

  const from = isoDateNDaysAgo(WINDOW_DAYS);
  const to = isoDateNDaysFromNow(0);

  // Strategy 1: scan eBay channel (preferred)
  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const payload = {
        Filter: {
          Page: page,
          Limit: LIMIT,
          DatePlacedFrom: from,
          DatePlacedTo: to,
          SalesChannel: "eBay", // ✅ eBay filter
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

  // Strategy 2: fallback scan without SalesChannel (still date-bounded)
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

// ✅ scan recent orders (1-week span) for line-level ids (Txn/Auction/etc)
// ✅ ALWAYS tries SalesChannel="eBay" first, then falls back if unsupported
async function resolveEbayByScan(ref: string, compact: string) {
  const WINDOW_DAYS = 7;
  const LIMIT = 100;
  const MAX_PAGES = 20;

  const from = isoDateNDaysAgo(WINDOW_DAYS);
  const to = isoDateNDaysFromNow(0);

  // Strategy 1: scan eBay channel (preferred)
  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const payload = {
        Filter: {
          Page: page,
          Limit: LIMIT,
          DatePlacedFrom: from,
          DatePlacedTo: to,
          SalesChannel: "eBay", // ✅ eBay filter
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

  // Strategy 2: fallback scan without SalesChannel (still date-bounded)
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

    // ✅ 1) Prefer PurchaseOrderNumber for eBay-style IDs
    if (preferPO) {
      for (const key of candidates) {
        order = await getFirstBy({ PurchaseOrderNumber: key });
        if (order) {
          matchedQuery = "PurchaseOrderNumber";
          break;
        }
      }
    }

    // ✅ 2) Neto OrderID
    if (!order) {
      for (const key of candidates) {
        order = await getFirstBy({ OrderID: key });
        if (order) {
          matchedQuery = "OrderID";
          break;
        }
      }
    }

    // ✅ 3) PurchaseOrderNumber fallback
    if (!order && !preferPO) {
      for (const key of candidates) {
        order = await getFirstBy({ PurchaseOrderNumber: key });
        if (order) {
          matchedQuery = "PurchaseOrderNumber";
          break;
        }
      }
    }

    // ✅ 4) Optional external refs
    if (!order) {
      for (const key of candidates) {
        order = await getFirstBy({ ExternalOrderLineReference: key });
        if (order) {
          matchedQuery = "ExternalOrderLineReference";
          break;
        }

        order = await getFirstBy({ ExternalOrderReference: key });
        if (order) {
          matchedQuery = "ExternalOrderReference";
          break;
        }
      }
    }

    // ✅ 5) Scan recent eBay orders (date-bounded) to match PurchaseOrderNumber if filtering doesn't work
    if (!order) {
      for (const key of candidates) {
        const found = await resolveByPurchaseOrderScan(key);
        if (found) {
          order = found;
          matchedQuery = "resolveByPurchaseOrderScan";
          break;
        }
      }
    }

    // ✅ 6) Scan line-level ids (Txn/Auction) within recent eBay orders (date-bounded)
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
