// // app/api/neto/customer-orders/route.ts
// import { NextRequest } from "next/server";
// import { netoRequest } from "@/app/lib/neto-client";

// /* ----------------------------------------
//    Types
// ---------------------------------------- */
// type NetoGetOrderResponse = {
//   Ack?: string;
//   Order?: any[];
//   Orders?: any[];
// };

// /* ----------------------------------------
//    Constants
// ---------------------------------------- */
// const OUTPUT_SELECTOR = [
//   "OrderID",
//   "OrderStatus",
//   "DatePlaced",
//   "Email",
//   // Top-level name fields
//   "BillFirstName",
//   "BillLastName",
//   "ShipFirstName",
//   "ShipLastName",
//   // Container objects (Crucial for Neto to actually return the names)
  
//   "Customer",
  
//   "ShipPhone",
//   "BillPhone",
//   "GrandTotal",
//   "ShippingTotal",
//   "SalesChannel",
//   "DefaultPaymentType",
//   "InternalOrderNotes",
//   "StickyNotes",

//   "OrderLine.SKU",
//   "OrderLine.ProductName",
//   "OrderLine.Quantity",
//   "OrderLine.UnitPrice",
//   "OrderLine.WarehouseName",
//   "OrderLine.eBay.eBayStoreName",
//   "OrderLine.eBay.eBayUsername",
// ] as const;

// const LIMIT = 20; 
// const REQUIRED_EBAY_STORE = "SecondsToYou";
// const DAYS_LOOKBACK = 60; // Expanded lookback for better debug coverage

// /* ----------------------------------------
//    Helpers
// ---------------------------------------- */
// function daysAgo(days: number) {
//   const d = new Date();
//   d.setDate(d.getDate() - days);
//   return d.toISOString().slice(0, 10);
// }

// function listOrders(data: NetoGetOrderResponse): any[] {
//   const orders = data?.Order ?? data?.Orders ?? [];
//   return Array.isArray(orders) ? orders : [];
// }

// function extractOrderLines(order: any): any[] {
//   if (!order?.OrderLine) return [];
//   const lines = order.OrderLine;
//   if (Array.isArray(lines)) return lines;
//   if (Array.isArray(lines.OrderLine)) return lines.OrderLine;
//   if (Array.isArray(lines.Line)) return lines.Line;
//   return typeof lines === "object" ? [lines] : [];
// }

// /**
//  * Robust Name Extraction
//  * Neto often hides names inside the BillingAddress or ShippingAddress objects
//  */
// function getFullName(order: any): string {
//   const bFirst = order.BillFirstName || order.BillingAddress?.BillFirstName || "";
//   const bLast = order.BillLastName || order.BillingAddress?.BillLastName || "";
//   const sFirst = order.ShipFirstName || order.ShippingAddress?.ShipFirstName || "";
//   const sLast = order.ShipLastName || order.ShippingAddress?.ShipLastName || "";

//   const billName = `${bFirst} ${bLast}`.trim();
//   const shipName = `${sFirst} ${sLast}`.trim();

//   return billName || shipName || "Unknown Customer";
// }

// /* ----------------------------------------
//    Route
// ---------------------------------------- */
// export async function POST(req: NextRequest) {
//   const body = await req.json().catch(() => ({}));
//   const customerNameSearch = String(body?.customerName || "").trim().toLowerCase();

//   const encoder = new TextEncoder();

//   const stream = new ReadableStream({
//     async start(controller) {
//       try {
//         const dateFrom = daysAgo(DAYS_LOOKBACK);

//         controller.enqueue(
//           encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Fetching orders from Neto...' })}\n\n`)
//         );

//         const payload = {
//           Filter: {
//             DatePlacedFrom: dateFrom,
//             Page: 1,
//             Limit: LIMIT,
//             // We remove OrderStatus: "pick" during debug to see why names might be missing in other statuses
//             OutputSelector: OUTPUT_SELECTOR,
//           },
//         };

//         const data = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 60000 });
//         const orders = listOrders(data);

//         console.log(`[NETO DEBUG] Retrieved ${orders.length} orders.`);

//         for (const order of orders) {
//           const fullName = getFullName(order);
//           const lines = extractOrderLines(order);
//           const ebayStore = lines[0]?.eBay?.eBayStoreName || "Unknown";
          
//           // Debugging logging to server console
//           console.log(`Order: ${order.OrderID} | Name: ${fullName} | Store: ${ebayStore}`);

//           // Filter logic
//           const matchesName = !customerNameSearch || fullName.toLowerCase().includes(customerNameSearch);
//           const matchesStore = ebayStore === REQUIRED_EBAY_STORE;

//           if (matchesName) {
//             controller.enqueue(
//               encoder.encode(`data: ${JSON.stringify({
//                 type: 'order',
//                 order: {
//                   id: order.OrderID,
//                   customer: fullName,
//                   total: order.GrandTotal,
//                   status: order.OrderStatus,
//                   store: ebayStore,
//                   isCorrectStore: matchesStore,
//                   date: order.DatePlaced
//                 }
//               })}\n\n`)
//             );
//           }
//         }

//         controller.enqueue(
//           encoder.encode(`data: ${JSON.stringify({ type: 'complete', message: `Processed ${orders.length} orders.` })}\n\n`)
//         );
//         controller.close();
//       } catch (err: any) {
//         console.error("[NETO ROUTE ERROR]", err);
//         controller.enqueue(
//           encoder.encode(`data: ${JSON.stringify({ type: 'error', error: err?.message || "Internal Server Error" })}\n\n`)
//         );
//         controller.close();
//       }
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       'Content-Type': 'text/event-stream',
//       'Cache-Control': 'no-cache',
//       'Connection': 'keep-alive',
//     },
//   });
// }


// app/api/neto/customer-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { netoRequest } from "@/app/lib/neto-client";

/* ----------------------------------------
   Types
---------------------------------------- */
type NetoGetOrderResponse = {
  Ack?: string;
  Order?: any[];
  Orders?: any[];
};

type NetoOrder = {
  OrderID: string;
  OrderLine?: any;
  BillFirstName?: string;
  BillLastName?: string;
  [key: string]: any;
};

/* ----------------------------------------
   Constants
---------------------------------------- */
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
  "ShipFirstName",
  "ShipLastName",

  "DefaultPaymentType",
  "DeliveryInstruction",
  "CompleteStatus",
  "UserGroup",

  "OrderLine",
  "OrderLine.SKU",
  "OrderLine.ProductName",
  "OrderLine.Quantity",
  "OrderLine.UnitPrice",
  "OrderLine.WarehouseName",
  "OrderLine.PickQuantity",
  "OrderLine.BackorderQuantity",

  // eBay
  "OrderLine.eBay.eBayUsername",
  "OrderLine.eBay.eBayStoreName",
  "OrderLine.eBay.eBayTransactionID",
  "OrderLine.eBay.eBayAuctionID",
  "OrderLine.eBay.ListingType",
  "OrderLine.eBay.DateCreated",
  "OrderLine.eBay.DatePaid",
] as const;

const LIMIT = 2000;
const MAX_PAGES = 100;
const BATCH_DELAY_MS = 300;
const REQUIRED_EBAY_STORE = "SecondsToYou";

/* ----------------------------------------
   Helpers
---------------------------------------- */
function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function listOrders(data: NetoGetOrderResponse): any[] {
  const orders = data?.Order ?? data?.Orders ?? [];
  return Array.isArray(orders) ? orders : [];
}

function extractOrderLines(order: any): any[] {
  if (!order?.OrderLine) return [];

  if (Array.isArray(order.OrderLine)) return order.OrderLine;
  if (Array.isArray(order.OrderLine.OrderLine)) return order.OrderLine.OrderLine;
  if (Array.isArray(order.OrderLine.Line)) return order.OrderLine.Line;

  return typeof order.OrderLine === "object" ? [order.OrderLine] : [];
}

function normalize(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

function getCustomerFullName(order: any): string {
  const first = String(order?.BillFirstName || "").trim();
  const last = String(order?.BillLastName || "").trim();
  return `${first} ${last}`.trim();
}

function matchesCustomerName(order: any, search: string): boolean {
  if (!search) return true;
  return normalize(getCustomerFullName(order)).includes(normalize(search));
}

/* ----------------------------------------
   eBay Guard (HARD FILTER)
---------------------------------------- */
function isSecondsToYouOrder(order: any): boolean {
  const firstLine = extractOrderLines(order)[0];
  return firstLine?.eBay?.eBayStoreName === REQUIRED_EBAY_STORE;
}

function extractEbayData(order: any) {
  const firstLine = extractOrderLines(order)[0];
  const ebay = firstLine?.eBay;

  return {
    ebayStoreName: REQUIRED_EBAY_STORE,
    ebayUsername: ebay?.eBayUsername ?? null,
    ebayTransactionID: ebay?.eBayTransactionID ?? null,
    ebayAuctionID: ebay?.eBayAuctionID ?? null,
    listingType: ebay?.ListingType ?? null,
    dateCreated: ebay?.DateCreated ?? null,
    datePaid: ebay?.DatePaid ?? null,
  };
}

/* ----------------------------------------
   Route
---------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const customerName = String(body?.customerName || "").trim();

    const dateFrom = daysAgo(30);
    const validOrders: NetoOrder[] = [];
    let page = 1;

    console.log("[NETO] Fetch start", {
      dateFrom,
      customerName: customerName || "(all)",
      store: REQUIRED_EBAY_STORE,
    });

    while (page <= MAX_PAGES) {
      const payload = {
        Filter: {
          DatePlacedFrom: dateFrom,
          Page: page,
          Limit: LIMIT,
          SalesChannel: "eBay",
          OrderStatus: "pick",
          OutputSelector: OUTPUT_SELECTOR,
        },
      };

      const data = await netoRequest<NetoGetOrderResponse>(
        "GetOrder",
        payload,
        { timeoutMs: 60000 }
      );

      const orders = listOrders(data);
      if (!orders.length) break;

      // 🔥 DROP NON-SecondsToYou ORDERS IMMEDIATELY
      for (const order of orders) {
        if (isSecondsToYouOrder(order)) {
          validOrders.push(order);
        }
      }

      if (orders.length < LIMIT) break;

      page++;
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }

    console.log("[NETO] SecondsToYou orders:", validOrders.length);

    const processedOrders = validOrders
      .map(order => {
        const lines = extractOrderLines(order);

        return {
          ...order,
          OrderLine: lines,
          itemsCount: lines.length,
          customerFullName: getCustomerFullName(order),
          ...extractEbayData(order),
        };
      })
      .filter(order => matchesCustomerName(order, customerName));

    return NextResponse.json({
      ok: true,
      result: {
        totalFetched: validOrders.length,
        totalFiltered: processedOrders.length,
        orders: processedOrders,
        filter: {
          customerName: customerName || null,
          store: REQUIRED_EBAY_STORE,
          dateFrom,
          dateTo: new Date().toISOString().slice(0, 10),
        },
      },
    });
  } catch (err: any) {
    console.error("[NETO ERROR]", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Customer order lookup failed" },
      { status: 500 }
    );
  }
}