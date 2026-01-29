// import { NextResponse } from "next/server";

// type LookupRequest = { id: string };

// function clean(v: unknown) {
//   return String(v ?? "").trim();
// }

// function netoErrorMessage(data: any) {
//   // Neto often returns: { Ack:"Error", Messages:{ Error:{ Message:"Invalid Request" } } }
//   const msg =
//     data?.Messages?.Error?.Message ??
//     data?.Messages?.Errors?.[0]?.Message ??
//     data?.Messages?.Message ??
//     data?.Message ??
//     null;

//   return clean(msg) || "Neto request failed.";
// }

// async function netoRequest(payload: unknown) {
//   const endpoint = process.env.NETO_API_URL?.trim();
//   const apiKey = process.env.NETO_API_KEY?.trim();
//   const username = process.env.NETO_API_USERNAME?.trim();

//   if (!endpoint || !apiKey || !username) {
//     throw new Error("Missing NETO credentials (NETO_API_URL / NETO_API_KEY / NETO_API_USERNAME).");
//   }

//   const res = await fetch(endpoint, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       NETOAPI_KEY: apiKey,
//       NETOAPI_USERNAME: username,
//       Accept: "application/json, */*",
//     } as Record<string, string>,
//     body: JSON.stringify(payload),
//     cache: "no-store",
//   });

//   const raw = await res.text();
//   let data: any;

//   try {
//     data = JSON.parse(raw);
//   } catch {
//     // If Neto ever returns XML/HTML, show a clean snippet
//     throw new Error(`Neto returned non-JSON (${res.status}). First chars: ${raw.slice(0, 120)}`);
//   }

//   // HTTP errors
//   if (!res.ok) {
//     throw new Error(`Neto HTTP ${res.status}: ${netoErrorMessage(data)}`);
//   }

//   // ✅ CRITICAL: Neto can return 200 but still fail via Ack:"Error"
//   if (String(data?.Ack || "").toLowerCase() === "error") {
//     throw new Error(netoErrorMessage(data));
//   }

//   return data;
// }

// /**
//  * ✅ ORDER lookup
//  * Uses the classic Neto method "GetOrder" which returns "Orders".
//  * If your Neto uses a different method name, tell me your working one and I’ll swap it.
//  */
// async function lookupOrder(id: string) {
//   const payload = {
//     GetOrder: {
//       // Neto filters vary. This is the most flexible approach:
//       // - If id is an order number, it should match OrderNumber
//       // - If your Neto wants OrderID instead, change this to OrderID
//       Filter: {
//         OrderNumber: id,
//         // If your Neto does NOT accept OrderNumber filter, comment the above and use:
//         // OrderID: id,
//       },
//       OutputSelector: [
//         "OrderNumber",
//         "BillAddress",
//         "Payment",
//       ],
//     },
//   };

//   const data = await netoRequest(payload);

//   const order = data?.Orders?.[0] ?? null;
//   if (!order) return null;

//   const bill = order?.BillAddress ?? {};
//   const payment = order?.Payment ?? {};

//   return {
//     matchedAs: "ORDER" as const,
//     orderNumber: clean(order?.OrderNumber),
//     firstName: clean(bill?.FirstName),
//     lastName: clean(bill?.LastName),
//     paymentMethod: clean(payment?.PaymentMethod ?? payment?.Method),
//     phoneNumber: clean(bill?.Phone),
//     rmaNumber: "",
//   };
// }

// /**
//  * ✅ RMA lookup
//  * Uses "GetRma" (common) which returns "Rmas" or "RMA".
//  * Your Neto may differ; if it errors, we’ll adjust.
//  */
// async function lookupRma(id: string) {
//   const payload = {
//     GetRma: {
//       Filter: {
//         RmaNumber: id,
//         // Sometimes it’s RmaID instead:
//         // RmaID: id,
//       },
//       OutputSelector: [
//         "RmaNumber",
//         "OrderNumber",
//         "BillAddress",
//         "Payment",
//       ],
//     },
//   };

//   const data = await netoRequest(payload);

//   const rma = data?.Rmas?.[0] ?? data?.RMA?.[0] ?? null;
//   if (!rma) return null;

//   const bill = rma?.BillAddress ?? {};
//   const payment = rma?.Payment ?? {};

//   return {
//     matchedAs: "RMA" as const,
//     orderNumber: clean(rma?.OrderNumber),
//     firstName: clean(bill?.FirstName),
//     lastName: clean(bill?.LastName),
//     paymentMethod: clean(payment?.PaymentMethod ?? payment?.Method),
//     phoneNumber: clean(bill?.Phone),
//     rmaNumber: clean(rma?.RmaNumber),
//   };
// }

// export async function POST(req: Request) {
//   try {
//     const body = (await req.json()) as LookupRequest;
//     const id = clean(body?.id);

//     if (!id) {
//       return NextResponse.json({ ok: false, error: "Missing field: id" }, { status: 400 });
//     }

//     // Try Order first
//     const order = await lookupOrder(id);
//     if (order) return NextResponse.json({ ok: true, result: order });

//     // Then RMA
//     const rma = await lookupRma(id);
//     if (rma) return NextResponse.json({ ok: true, result: rma });

//     return NextResponse.json({ ok: false, error: "No Order/RMA found in Neto." }, { status: 404 });
//   } catch (e: any) {
//     // ✅ If Neto says "Invalid Request", return 502 so you don't confuse it with "not found"
//     const message = e?.message ?? "Unknown error";
//     const status = message.toLowerCase().includes("invalid request") ? 502 : 500;

//     console.error("[LOOKUP_API_ERROR]", e);
//     return NextResponse.json({ ok: false, error: message }, { status });
//   }
// }

// app/api/neto/route.ts
import { NextResponse } from "next/server";
import { netoRequest } from "@/app/lib/neto-client";

type LookupRequest = { id: string };

function clean(v: unknown) {
  return String(v ?? "").trim();
}

type LookupResult = {
  matchedAs: "ORDER" | "RMA";
  orderNumber: string;
  firstName: string;
  lastName: string;
  paymentMethod: string;
  phoneNumber: string;
  rmaNumber: string;
};

function normalizeOrderLike(obj: any) {
  const bill = obj?.BillAddress ?? obj?.BillTo ?? obj?.BillingAddress ?? {};
  const pay = obj?.Payment ?? obj?.Payments?.[0] ?? {};

  return {
    orderNumber: clean(obj?.OrderNumber ?? obj?.OrderNo ?? obj?.OrderID ?? ""),
    firstName: clean(bill?.FirstName ?? obj?.CustomerFirstName ?? ""),
    lastName: clean(bill?.LastName ?? obj?.CustomerLastName ?? ""),
    paymentMethod: clean(pay?.PaymentMethod ?? pay?.Method ?? obj?.PaymentMethod ?? ""),
    phoneNumber: clean(bill?.Phone ?? obj?.CustomerPhone ?? obj?.Phone ?? ""),
  };
}

/**
 * Neto body wrapper helper:
 * Some Neto actions require payload to be wrapped under "Request".
 * We'll try both unwrapped and wrapped automatically.
 */
async function callNetoWithFallback<T>(action: string, body: any): Promise<T> {
  // Attempt 1: unwrapped (what you currently do)
  try {
    return await netoRequest<T>(action, body, { timeoutMs: 12000 });
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    // If it looks like a "Request Error", try wrapped.
    if (!msg.toLowerCase().includes("request error")) throw e;
  }

  // Attempt 2: wrapped
  return await netoRequest<T>(action, { Request: body }, { timeoutMs: 12000 });
}

async function lookupOrder(id: string): Promise<LookupResult | null> {
  // Try the most common actions used in Neto setups
  const actions = ["GetOrder", "OrderGet", "SalesOrderGet"];

  const baseBody = {
    Filter: { OrderNumber: id },
    OutputSelector: ["OrderNumber", "BillAddress", "Payment"],
  };

  for (const action of actions) {
    let data: any;
    try {
      data = await callNetoWithFallback<any>(action, baseBody);
    } catch (e: any) {
      // keep trying other actions
      continue;
    }

    const order = data?.Orders?.[0] ?? data?.SalesOrders?.[0] ?? null;
    if (!order) continue;

    const normalized = normalizeOrderLike(order);
    return {
      matchedAs: "ORDER",
      rmaNumber: "",
      ...normalized,
    };
  }

  return null;
}

async function lookupRma(id: string): Promise<LookupResult | null> {
  const actions = ["GetRma", "RmaGet", "ReturnGet"];

  const baseBody = {
    Filter: { RmaNumber: id },
    OutputSelector: ["RmaNumber", "OrderNumber", "BillAddress", "Payment"],
  };

  for (const action of actions) {
    let data: any;
    try {
      data = await callNetoWithFallback<any>(action, baseBody);
    } catch (e: any) {
      // keep trying other actions
      continue;
    }

    const rma =
      data?.Rmas?.[0] ??
      data?.RMA?.[0] ??
      data?.Returns?.[0] ??
      data?.Return?.[0] ??
      null;

    if (!rma) continue;

    const normalized = normalizeOrderLike(rma);
    return {
      matchedAs: "RMA",
      rmaNumber: clean(rma?.RmaNumber ?? rma?.RMA ?? rma?.RmaID ?? ""),
      ...normalized,
    };
  }

  return null;
}


export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LookupRequest;
    const id = clean(body?.id);

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing field: id" }, { status: 400 });
    }

    const order = await lookupOrder(id);
    if (order) return NextResponse.json({ ok: true, result: order });

    const rma = await lookupRma(id);
    if (rma) return NextResponse.json({ ok: true, result: rma });

    return NextResponse.json({ ok: false, error: "No Order/RMA found in Neto." }, { status: 404 });
  } catch (e: any) {
    console.error("[LOOKUP_API_ERROR]", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Lookup failed" },
      { status: 502 }
    );
  }
}
