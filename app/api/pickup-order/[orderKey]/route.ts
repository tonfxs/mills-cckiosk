// import { NextResponse } from "next/server";
// import { netoRequest } from "@/app/lib/neto-client"; // adjust if your file name/path differs

// type NetoOrder = any;

// type NetoGetOrderResponse = {
//   Ack?: "Error" | "Warning" | "Success";
//   Orders?: NetoOrder[];
//   Messages?: { Error?: { Message?: string } };
//   Errors?: Array<{ Description?: string }>;
// };

// async function getFirstOrder(filter: Record<string, string>) {
//   const body = {
//     Filter: filter,
//     OutputSelector: [
//       "OrderID",
//       "OrderNumber",
//       "OrderStatus",
//       "DatePlaced",
//       "Email",
//       "ShipFirstName",
//       "ShipLastName",
//       "ShipPhone",
//       "BillFirstName",
//       "BillLastName",
//       "BillPhone",
//       "GrandTotal",
//       "ShippingTotal",
//       "Items",
//     ],
//   };

//   const res = await netoRequest<NetoGetOrderResponse>("GetOrder", body);
//   return res?.Orders?.[0] ?? null;
// }

// export async function GET(_req: Request, { params }: { params: { orderKey: string } }) {
//   const key = decodeURIComponent(params.orderKey || "").trim();
//   if (!key) {
//     return NextResponse.json({ ok: false, error: "Missing orderKey" }, { status: 400 });
//   }

//   try {
//     // Works whether your table uses OrderID or OrderNumber
//     const order =
//       (await getFirstOrder({ OrderID: key })) ||
//       (await getFirstOrder({ OrderNumber: key }));

//     if (!order) {
//       return NextResponse.json({ ok: false, error: `No order found for ${key}` }, { status: 404 });
//     }

//     return NextResponse.json({ ok: true, order });
//   } catch (err: any) {
//     return NextResponse.json(
//       { ok: false, error: err?.message || "Failed to fetch order from Neto" },
//       { status: 500 }
//     );
//   }
// }


// import { NextResponse } from "next/server";

// type NetoProxyResponse = any;

// export async function GET(
//   _req: Request,
//   ctx: { params: Promise<{ orderKey: string }> | { orderKey: string } }
// ) {
//   const { orderKey } = await Promise.resolve(ctx.params);
//   const key = decodeURIComponent(orderKey || "").trim();

//   if (!key) {
//     return NextResponse.json({ ok: false, error: "Missing orderKey" }, { status: 400 });
//   }

//   try {
//     // IMPORTANT:
//     // This calls your existing Neto proxy route (app/api/neto/route.ts)
//     // using the SAME action naming pattern you already use elsewhere in your app.
//     //
//     // You must match the "action" string to your neto proxy implementation.
//     // Based on your Postman label: "get orders specific orderid"
//     // I’ll use: "get orders specific orderid" (you can rename to whatever your proxy expects)
//     const res = await fetch(new URL("/api/neto", _req.url), {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       // Adjust the body to match what your /api/neto expects:
//       body: JSON.stringify({
//         action: "get orders specific orderid",
//         orderId: key, // or OrderID: key, depending on your existing proxy
//       }),
//       cache: "no-store",
//     });

//     const text = await res.text();
//     let json: NetoProxyResponse;
//     try {
//       json = JSON.parse(text);
//     } catch {
//       return NextResponse.json(
//         { ok: false, error: `Neto proxy returned non-JSON (${res.status}): ${text.slice(0, 140)}` },
//         { status: 502 }
//       );
//     }

//     if (!res.ok) {
//       return NextResponse.json(
//         { ok: false, error: json?.error || `Neto proxy failed (${res.status})` },
//         { status: 502 }
//       );
//     }

//     // Now normalize the response into { ok: true, order }
//     // You may need to adjust this depending on your proxy's output structure.
//     const order =
//       json?.order ||
//       json?.data?.order ||
//       json?.data?.Orders?.[0] ||
//       json?.Orders?.[0] ||
//       null;

//     if (!order) {
//       return NextResponse.json(
//         { ok: false, error: `No order returned for ${key}` },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ ok: true, order });
//   } catch (err: any) {
//     return NextResponse.json(
//       { ok: false, error: err?.message || "Failed to fetch order via Neto proxy" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";

// This route should call YOUR NETO proxy endpoint.
// You said you have app/api/neto/route.ts in your structure screenshot.
// We'll forward to that.

export async function GET(
  req: Request,
  ctx: { params: Promise<{ orderNumber: string }> | { orderNumber: string } }
) {
  const { orderNumber } = await Promise.resolve(ctx.params);
  const key = decodeURIComponent(orderNumber || "").trim();

  if (!key) {
    return NextResponse.json({ ok: false, error: "Missing orderNumber" }, { status: 400 });
  }

  try {
    // Forward to your NETO proxy route.
    // NOTE: we MUST match the payload your /api/neto expects.
    // So for now we send a generic "action" and "body" pattern.
    const netoRes = await fetch(new URL("/api/neto", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        action: "get orders specific orderid", // change to whatever your /api/neto expects
        orderId: key,                          // or orderNumber: key depending on your proxy
      }),
    });

    const text = await netoRes.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { ok: false, error: `Neto returned non-JSON (${netoRes.status}): ${text.slice(0, 160)}` },
        { status: 502 }
      );
    }

    if (!netoRes.ok) {
      return NextResponse.json(
        { ok: false, error: json?.error || `Neto request failed (${netoRes.status})` },
        { status: 502 }
      );
    }

    // Normalize output: find an "order" anywhere reasonable
    const order =
      json?.order ||
      json?.data?.order ||
      json?.data?.Orders?.[0] ||
      json?.Orders?.[0] ||
      null;

    if (!order) {
      return NextResponse.json({ ok: false, error: `No order found for ${key}` }, { status: 404 });
    }

    return NextResponse.json({ ok: true, order });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to fetch Neto order details" },
      { status: 500 }
    );
  }
}
