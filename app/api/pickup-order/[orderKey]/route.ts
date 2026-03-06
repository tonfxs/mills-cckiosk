import { NextRequest, NextResponse } from "next/server";

// Supports both object params and promise params (some Next builds type it as Promise)
type Ctx =
  | { params: { orderKey: string } }
  | { params: Promise<{ orderKey: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { orderKey } = await Promise.resolve((ctx as any).params);
  const key = decodeURIComponent(orderKey || "").trim();

  if (!key) {
    return NextResponse.json({ ok: false, error: "Missing orderKey" }, { status: 400 });
  }

  try {
    // Forward to your NETO proxy route (/api/neto)
    const netoRes = await fetch(new URL("/api/neto", request.url), {
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
