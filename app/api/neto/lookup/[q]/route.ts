// import { NextResponse } from "next/server";
// import { netoRequest } from "@/app/lib/neto-client";

// type NetoGetOrderResponse = {
//   Orders?: any[];
//   Ack?: string;
// };

// function pad2(n: number) {
//   return String(n).padStart(2, "0");
// }
// function fmtNetoDate(d: Date) {
//   return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(
//     d.getMinutes()
//   )}:${pad2(d.getSeconds())}.000`;
// }

// // deep scan any object/array for substring match (mimics Neto UI search)
// function deepContains(obj: any, needle: string): boolean {
//   const n = String(needle || "").toLowerCase();
//   if (!n) return false;

//   const seen = new Set<any>();

//   const walk = (v: any): boolean => {
//     if (v == null) return false;

//     if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
//       return String(v).toLowerCase().includes(n);
//     }
//     if (typeof v !== "object") return false;

//     if (seen.has(v)) return false;
//     seen.add(v);

//     if (Array.isArray(v)) return v.some(walk);
//     return Object.values(v).some(walk);
//   };

//   return walk(obj);
// }

// const OUTPUT_SELECTOR = [
//   "ID",
//   "OrderStatus",
//   "DatePlaced",
//   "DateUpdated",
//   "Email",
//   "Username",
//   "GrandTotal",
//   "ShippingTotal",
//   "ShipAddress",
//   "BillAddress",
//   "PurchaseOrderNumber",
//   "RelatedOrderID",
//   "InternalOrderNotes",
//   "StickyNotes",
//   "OrderPayment",
//   "OrderPayment.PaymentType",
// ];

// export async function GET(
//   _req: Request,
//   ctx: { params: Promise<{ q: string }> | { q: string } }
// ) {
//   const { q } = await Promise.resolve(ctx.params);
//   const query = decodeURIComponent(q || "").trim();

//   if (!query) {
//     return NextResponse.json({ ok: false, error: "Missing query" }, { status: 400 });
//   }

//   try {
//     // Search window: last 30 days (adjust if needed)
//     const now = new Date();
//     const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

//     // 1) Pull recent orders (light but includes reference fields)
//     const list = await netoRequest<NetoGetOrderResponse>("GetOrder", {
//       Filter: {
//         DateUpdatedFrom: fmtNetoDate(from),
//         DateUpdatedTo: fmtNetoDate(now),
//       },
//       OutputSelector: OUTPUT_SELECTOR,
//     });

//     const orders = list?.Orders || [];
//     if (!orders.length) {
//       return NextResponse.json({ ok: false, error: "No orders returned by Neto in search window" }, { status: 404 });
//     }

//     // 2) Find the order that contains the kiosk ref anywhere
//     const found = orders.find((o) => deepContains(o, query));
//     if (!found?.ID) {
//       return NextResponse.json({ ok: false, error: `No Neto order found for ${query}` }, { status: 404 });
//     }

//     // 3) Fetch full details by OrderID (correct Neto way)
//     const details = await netoRequest<NetoGetOrderResponse>("GetOrder", {
//       Filter: { OrderID: [String(found.ID)] },
//       OutputSelector: [
//         ...OUTPUT_SELECTOR,
//         // Add more selectors if you want extra fields
//         "DeliveryInstruction",
//         "ShippingOption",
//         "SalesChannel",
//         "ProductSubtotal",
//         "OrderTax",
//         "TaxInclusive",
//       ],
//     });

//     const full = details?.Orders?.[0];
//     if (!full) {
//       return NextResponse.json(
//         { ok: false, error: `Matched OrderID ${found.ID} but details missing` },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       ok: true,
//       matchedQuery: query,
//       resolvedOrderId: String(found.ID),
//       order: full,
//     });
//   } catch (err: any) {
//     return NextResponse.json(
//       { ok: false, error: err?.message || "Failed to lookup Neto order" },
//       { status: 500 }
//     );
//   }
// }

// import { NextResponse } from "next/server";
// import { netoRequest } from "@/app/lib/neto-client";

// type NetoGetOrderResponse = {
//   Orders?: any[];
//   Ack?: string;
// };

// function pad2(n: number) {
//   return String(n).padStart(2, "0");
// }
// function fmtNetoDate(d: Date) {
//   return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(
//     d.getMinutes()
//   )}:${pad2(d.getSeconds())}.000`;
// }

// // Search anywhere in the order object for a string match
// function deepContains(obj: any, needle: string): boolean {
//   const n = String(needle || "").toLowerCase();
//   if (!n) return false;

//   const seen = new Set<any>();
//   const walk = (v: any): boolean => {
//     if (v == null) return false;
//     if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
//       return String(v).toLowerCase().includes(n);
//     }
//     if (typeof v !== "object") return false;
//     if (seen.has(v)) return false;
//     seen.add(v);
//     if (Array.isArray(v)) return v.some(walk);
//     return Object.values(v).some(walk);
//   };
//   return walk(obj);
// }

// const LIST_SELECTOR = [
//   "ID",
//   "OrderStatus",
//   "DateUpdated",
//   "DatePlaced",
//   "Email",
//   "PurchaseOrderNumber",
//   "RelatedOrderID",
//   "ShipAddress",
//   "BillAddress",
// ];

// const DETAILS_SELECTOR = [
//   "ID",
//   "OrderStatus",
//   "DatePlaced",
//   "DateUpdated",
//   "Email",
//   "GrandTotal",
//   "ShippingTotal",
//   "ProductSubtotal",
//   "OrderTax",
//   "TaxInclusive",
//   "ShippingOption",
//   "DeliveryInstruction",
//   "SalesChannel",
//   "PurchaseOrderNumber",
//   "RelatedOrderID",
//   "ShipAddress",
//   "BillAddress",
//   "OrderPayment",
//   "OrderPayment.PaymentType",
//   "InternalOrderNotes",
//   "StickyNotes",
// ];

// export async function GET(
//   _req: Request,
//   ctx: { params: Promise<{ q: string }> | { q: string } }
// ) {
//   const { q } = await Promise.resolve(ctx.params);
//   const query = decodeURIComponent(q || "").trim();

//   if (!query) {
//     return NextResponse.json({ ok: false, error: "Missing query" }, { status: 400 });
//   }

//   try {
//     // ✅ Keep it small by default (3 days). You can bump this if needed.
//     const now = new Date();
//     const from = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

//     // ✅ Try a few pages instead of pulling "everything"
//     const pagesToTry = [1, 2, 3, 4]; // adjust if you want
//     const pageSize = 50;

//     let match: any | null = null;

//     for (const page of pagesToTry) {
//       // NOTE: Neto implementations vary. Many support Page / Limit.
//       // If yours doesn't, Neto will ignore them and still return… but usually it works.
//       const list = await netoRequest<NetoGetOrderResponse>(
//         "GetOrder",
//         {
//           Filter: {
//             DateUpdatedFrom: fmtNetoDate(from),
//             DateUpdatedTo: fmtNetoDate(now),
//           },
//           OutputSelector: LIST_SELECTOR,
//           Page: page,
//           Limit: pageSize,
//         },
//         { timeoutMs: 25000 } // ✅ longer for lookup
//       );

//       const orders = list?.Orders || [];
//       if (!orders.length) break;

//       match = orders.find((o) => deepContains(o, query)) || null;
//       if (match?.ID) break;

//       // If Neto returns less than a full page, no more pages
//       if (orders.length < pageSize) break;
//     }

//     if (!match?.ID) {
//       return NextResponse.json(
//         { ok: false, error: `No Neto order found for ${query} in recent updates.` },
//         { status: 404 }
//       );
//     }

//     // ✅ Fetch full details by OrderID (correct Neto way)
//     const details = await netoRequest<NetoGetOrderResponse>(
//       "GetOrder",
//       {
//         Filter: { OrderID: [String(match.ID)] },
//         OutputSelector: DETAILS_SELECTOR,
//       },
//       { timeoutMs: 25000 }
//     );

//     const full = details?.Orders?.[0];
//     if (!full) {
//       return NextResponse.json(
//         { ok: false, error: `Matched OrderID ${match.ID} but details missing` },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       ok: true,
//       matchedQuery: query,
//       resolvedOrderId: String(match.ID),
//       order: full,
//     });
//   } catch (err: any) {
//     // ✅ Clean timeout -> 504 instead of 500
//     const msg = String(err?.message || "");
//     if (msg.toLowerCase().includes("timed out")) {
//       return NextResponse.json(
//         { ok: false, error: "Neto lookup timed out. Try again, or widen the date window carefully." },
//         { status: 504 }
//       );
//     }

//     return NextResponse.json(
//       { ok: false, error: err?.message || "Failed to lookup Neto order" },
//       { status: 500 }
//     );
//   }
// }


// app/api/kiosk/orders/[refId]/route.ts
// import { NextResponse } from "next/server";
// import { google } from "googleapis";
// import { netoRequest } from "@/app/lib/neto-client";

// type SheetRow = {
//   orderId?: string; // Neto internal OrderID saved in sheet
//   refId?: string;   // whatever your kiosk used as key (order number / etc.)
// };

// const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
// const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || "Master List";

// // NOTE: Adjust columns based on your sheet layout.
// // Example: A=timestamp, B=fullName, C=phone, D=refId, ... and maybe OrderID is in column L, etc.
// const RANGE = `${SHEET_TAB}!A:Z`;

// type NetoGetOrderResponse = {
//   Ack?: "Success" | "Warning" | "Error";
//   Orders?: any[];
//   Errors?: Array<{ ErrorCode?: string; Description?: string }>;
// };

// function jsonError(message: string, status = 400, extra?: unknown) {
//   return NextResponse.json({ ok: false, message, extra }, { status });
// }

// async function getSheetsClient() {
//   const auth = new google.auth.GoogleAuth({
//     credentials: {
//       client_email: process.env.GOOGLE_CLIENT_EMAIL,
//       private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//     },
//     scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
//   });

//   return google.sheets({ version: "v4", auth });
// }

// function headerIndex(headers: string[]) {
//   const map = new Map<string, number>();
//   headers.forEach((h, i) => map.set(h.trim().toLowerCase(), i));
//   return map;
// }

// async function findOrderIdByRefId(refId: string): Promise<string | null> {
//   const sheets = await getSheetsClient();
//   const res = await sheets.spreadsheets.values.get({
//     spreadsheetId: SHEET_ID,
//     range: RANGE,
//     valueRenderOption: "UNFORMATTED_VALUE",
//   });

//   const values = res.data.values || [];
//   if (values.length < 2) return null;

//   const headers = (values[0] as string[]).map(String);
//   const idx = headerIndex(headers);

//   // These header names must match your sheet header row (case-insensitive).
//   const refIdCol = idx.get("refid");
//   const orderIdCol = idx.get("orderid");

//   if (refIdCol == null) throw new Error(`Sheet missing header: refId`);
//   if (orderIdCol == null) throw new Error(`Sheet missing header: OrderID`);

//   for (let r = 1; r < values.length; r++) {
//     const row = values[r] as any[];
//     const rowRef = String(row[refIdCol] ?? "").trim();
//     if (!rowRef) continue;

//     if (rowRef === refId.trim()) {
//       const orderId = String(row[orderIdCol] ?? "").trim();
//       return orderId || null;
//     }
//   }

//   return null;
// }

// export async function GET(
//   _req: Request,
//   { params }: { params: { refId: string } }
// ) {
//   try {
//     const refId = decodeURIComponent(params.refId || "").trim();
//     if (!refId) return jsonError("Missing refId", 400);

//     const orderId = await findOrderIdByRefId(refId);
//     if (!orderId) return jsonError(`No OrderID found in sheet for refId=${refId}`, 404);

//     // Neto GetOrder expects internal OrderID in OrderIDFilter (works for internal IDs).
//     const body = {
//       Filter: {
//         OrderIDFilter: [orderId],
//       },
//       // Choose selectors you actually need on the frontend
//       OutputSelector: [
//         "ID",
//         "OrderID",
//         "OrderNumber",
//         "OrderStatus",
//         "DatePlaced",
//         "DateUpdated",
//         "Email",
//         "ShipAddress",
//         "BillAddress",
//         "GrandTotal",
//         "ShippingTotal",
//         "ProductSubtotal",
//         "OrderTax",
//         "TaxInclusive",
//         "ShippingOption",
//         "DeliveryInstruction",
//         "SalesChannel",
//         "OrderPayment",
//         "OrderPayment.PaymentType",
//         "OrderLines",
//         "OrderLines.OrderLine",
//       ],
//     };

//     const neto = await netoRequest<NetoGetOrderResponse>("GetOrder", body, { timeoutMs: 20000 });

//     if (neto?.Ack === "Error") {
//       return jsonError("Neto GetOrder failed", 502, neto.Errors ?? neto);
//     }

//     const order = neto?.Orders?.[0];
//     if (!order) return jsonError(`Order not found in Neto for OrderID=${orderId}`, 404);

//     return NextResponse.json({
//       ok: true,
//       refId,
//       orderId,
//       order,
//     });
//   } catch (err: any) {
//     return jsonError(err?.message || "Unexpected server error", 500);
//   }
// }
