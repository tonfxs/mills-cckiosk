import { NextResponse } from "next/server";
import { netoRequest } from "@/app/lib/neto-client";

/* ----------------------------------------
   Types
---------------------------------------- */

type NetoGetOrderResponse = {
  Ack?: string;
  Orders?: NetoOrder[];
};

type NetoOrder = {
  OrderNumber: string;
  PurchaseOrderNumber?: string;
  BillFirstName?: string;
  BillLastName?: string;
  BillPhone?: string;
  PaymentMethod?: string;
  OrderStatus?: string;
  DatePlaced?: string;
  SalesChannel?: string;
};

/* ----------------------------------------
   Constants
---------------------------------------- */

const OUTPUT_SELECTOR = [
  "OrderNumber",
  "PurchaseOrderNumber",
  "BillFirstName",
  "BillLastName",
  "BillPhone",
  "PaymentMethod",
  "OrderStatus",
  "DatePlaced",
  "SalesChannel",
];

const ALLOWED_STATUSES = new Set([
  "Pick",
  "Pack",
  "Pick New",
]);

/* ----------------------------------------
   Route
---------------------------------------- */

export async function POST(req: Request) {
  try {
    const { customerName, ebayUsername } = await req.json();

    if (
      (!customerName || customerName.trim().length < 3) &&
      (!ebayUsername || ebayUsername.trim().length < 2)
    ) {
      return NextResponse.json(
        { ok: false, error: "Enter a customer name or an eBay username." },
        { status: 400 }
      );
    }

    const nameParts = customerName
      ? customerName.trim().split(/\s+/).filter(Boolean)
      : [];

    const firstName = nameParts[0];
    const lastName =
      nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined;

    const orders = await findOrders({
      firstName,
      lastName,
      ebayUsername,
    });

    return NextResponse.json({
      ok: true,
      result: {
        customerName: customerName || "",
        ebayUsername: ebayUsername || "",
        orders,
      },
    });
  } catch (e: any) {
    console.error("[NETO CUSTOMER LOOKUP]", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Lookup failed." },
      { status: 500 }
    );
  }
}

/* ----------------------------------------
   Neto Lookup Logic
---------------------------------------- */

async function findOrders(params: {
  firstName?: string;
  lastName?: string;
  ebayUsername?: string;
}) {
  const collected: NetoOrder[] = [];

  // 1️⃣ Name-based search
  if (params.firstName && params.lastName) {
    const res = await netoRequest<NetoGetOrderResponse>("GetOrder", {
      Filter: {
        BillFirstName: params.firstName,
        BillLastName: params.lastName,
      },
      OutputSelector: OUTPUT_SELECTOR,
      Limit: 50,
    });

    if (res?.Orders?.length) collected.push(...res.Orders);
  }

  // 2️⃣ Username fallback
  if (params.firstName) {
    const res = await netoRequest<NetoGetOrderResponse>("GetOrder", {
      Filter: {
        Username: params.firstName,
      },
      OutputSelector: OUTPUT_SELECTOR,
      Limit: 50,
    });

    if (res?.Orders?.length) collected.push(...res.Orders);
  }

  // 3️⃣ eBay username (high confidence)
  if (params.ebayUsername?.trim()) {
    const res = await netoRequest<NetoGetOrderResponse>("GetOrder", {
      Filter: {
        SalesChannel: "eBay",
        Username: params.ebayUsername.trim(),
      },
      OutputSelector: OUTPUT_SELECTOR,
      Limit: 50,
    });

    if (res?.Orders?.length) collected.push(...res.Orders);
  }

  return dedupe(collected)
    .filter(hasAllowedStatus)
    .map(mapForUI);
}

/* ----------------------------------------
   Helpers
---------------------------------------- */

function dedupe(orders: NetoOrder[]) {
  const map = new Map<string, NetoOrder>();
  for (const o of orders) {
    if (o?.OrderNumber) map.set(o.OrderNumber, o);
  }
  return [...map.values()];
}

function hasAllowedStatus(o: NetoOrder) {
  return o.OrderStatus && ALLOWED_STATUSES.has(o.OrderStatus);
}

function mapForUI(o: NetoOrder) {
  return {
    orderNumber: o.OrderNumber,
    purchaseOrderNumber: o.PurchaseOrderNumber ?? "",
    firstName: o.BillFirstName ?? "",
    lastName: o.BillLastName ?? "",
    phoneNumber: o.BillPhone ?? "",
    paymentMethod: o.PaymentMethod ?? "",
    orderStatus: o.OrderStatus ?? "",
    datePlaced: o.DatePlaced ?? "",
    salesChannel: o.SalesChannel ?? "",
  };
}
