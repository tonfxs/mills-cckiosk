import { NextResponse } from "next/server";
import { netoRequest } from "@/app/lib/neto-client";

/* ----------------------------------------
   Types
---------------------------------------- */

type NetoGetOrderResponse = {
  Ack?: string;
  Order?: NetoOrder[];
};

type NetoAddress = {
  FirstName?: string;
  LastName?: string;
  Phone?: string;
  Company?: string;
  StreetLine1?: string;
  StreetLine2?: string;
  City?: string;
  State?: string;
  PostCode?: string;
  Country?: string;
};

type NetoOrder = {
  OrderID: string;
  ShipAddress?: NetoAddress;
  BillAddress?: NetoAddress;
  OrderStatus?: string;
  DatePlaced?: string;
  SalesChannel?: string;
  Username?: string;
  PurchaseOrderNumber?: string;
  OrderLine?: Array<{ eBay?: { eBayStoreName?: string } }>;
  [key: string]: any;
};

/* ----------------------------------------
   Constants
---------------------------------------- */

const OUTPUT_SELECTOR = [
  "OrderID",
  "PurchaseOrderNumber",
  "ShipAddress",
  "BillAddress",
  "OrderStatus",
  "DatePlaced",
  "SalesChannel",
  "Username",
  "OrderLine",
  "OrderLine.eBay.eBayStoreName",
] as const;

const LIMIT = 100;
const MAX_PAGES = 10;

/* ----------------------------------------
   Helpers
---------------------------------------- */

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mapForUI(o: NetoOrder) {
  return {
    orderNumber: o.OrderID,
    purchaseOrderNumber: o.PurchaseOrderNumber ?? "",
    firstName: o.BillAddress?.FirstName ?? o.ShipAddress?.FirstName ?? "",
    lastName: o.BillAddress?.LastName ?? o.ShipAddress?.LastName ?? "",
    phoneNumber: o.BillAddress?.Phone ?? o.ShipAddress?.Phone ?? "",
    orderStatus: o.OrderStatus ?? "",
    datePlaced: o.DatePlaced ?? "",
    salesChannel: o.SalesChannel ?? "",
  };
}

/* ----------------------------------------
   Route
---------------------------------------- */

export async function POST(req: Request) {
  try {
    const { customerName } = await req.json();
    console.log("[INPUT CUSTOMER NAME]", customerName);

    const normalizedCustomerName = customerName ? customerName.toLowerCase() : "";
    console.log("[NORMALIZED INPUT]", normalizedCustomerName);

    const result = await fetchOrdersFromPastWeek();

    console.log("[TOTAL ORDERS RETRIEVED]", result.orders.length);

    return NextResponse.json({
      ok: true,
      result: {
        customerName,
        orders: result.orders,
        totalFetched: result.totalFetched,
        totalPages: result.totalPages,
      },
    });
  } catch (err: any) {
    console.error("[ERROR]", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Lookup failed." },
      { status: 500 }
    );
  }
}

/* ----------------------------------------
   Fetch Orders
---------------------------------------- */

async function fetchOrdersFromPastWeek() {
  const collected: NetoOrder[] = [];
  const dateFrom = daysAgo(7);
  let page = 1;
  let totalFetched = 0;

  console.log("[DATE FROM]", dateFrom);

  try {
    while (page <= MAX_PAGES) {
      console.log(`\n[FETCHING ORDERS] Page ${page}`);

      const payload = {
        Filter: {
          DatePlacedFrom: dateFrom,
          Page: page,
          Limit: LIMIT,
        },
        OutputSelector: OUTPUT_SELECTOR,
      };

      console.log("[NETO REQUEST PAYLOAD]", JSON.stringify(payload, null, 2));

      const res = await netoRequest<NetoGetOrderResponse>("GetOrder", payload, { timeoutMs: 60000 });
      const orders = res?.Order ?? [];
      totalFetched += orders.length;

      console.log(`[ORDERS RECEIVED ON PAGE ${page}] ${orders.length}`);

      if (!orders.length) break;

      collected.push(...orders);

      if (orders.length < LIMIT) break;
      page++;
    }

    return {
      orders: collected.map(mapForUI),
      totalFetched,
      totalPages: page,
    };
  } catch (err: any) {
    console.error("[NETO FETCH FAILED]", err);
    return { orders: [], totalFetched: 0, totalPages: 0 };
  }
}
