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

const LIMIT = 100;
const MAX_PAGES = 20;
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

    const dateFrom = daysAgo(7);
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
