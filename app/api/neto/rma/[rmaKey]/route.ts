import { NextResponse } from "next/server";
import { netoRequest } from "@/app/lib/neto-client";

type GetRmaResponse = {
  Ack: "Success" | "Error";
  Rma?: any;
};

const OUTPUT_SELECTOR = [
  "OrderID",
  "InvoiceNumber",
  "CustomerUsername",
  "StaffUsername",
  "PurchaseOrderNumber",
  "InternalNotes",
  "CurrencyCode",
  "RmaStatus",
  "ShippingRefundAmount",
  "ShippingRefundTaxCode",
  "SurchargeRefundAmount",
  "RefundSubtotal",
  "RefundTotal",
  "RefundTaxTotal",
  "TaxInclusive",
  "DateIssued",
  "DateUpdated",
  "DateApproved",
  "RmaLines.RmaLine",
  "RmaLines.RmaLine.ItemNumber",
  "RmaLines.RmaLine.ProductName",
  "RmaLines.RmaLine.Quantity",
  "RmaLines.RmaLine.ReturnReason",
  "RmaLines.RmaLine.ItemStatus",
  "RmaLines.RmaLine.RefundSubtotal",
  "RmaLines.RmaLine.Tax",
  "RmaLines.RmaLine.TaxCode",
  "RmaLines.RmaLine.WarehouseID",
  "RmaLines.RmaLine.WarehouseName",
  "RmaLines.RmaLine.WarehouseReference",
  "RmaLines.RmaLine.ResolutionOutcome",
  "RmaLines.RmaLine.ItemStatusType",
  "RmaLines.RmaLine.ResolutionStatus",
  "RmaLines.RmaLine.ManufacturerClaims",
  "RmaLines.RmaLine.IsRestockIssued",
  "Refunds.Refund",
  "Refunds.Refund.PaymentMethodID",
  "Refunds.Refund.PaymentMethodName",
  "Refunds.Refund.DateIssued",
  "Refunds.Refund.DateRefunded",
  "Refunds.Refund.RefundStatus",
] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ rmaKey: string }> }
) {
  try {
    const { rmaKey } = await params;
    const rawKey = rmaKey?.trim();
    if (!rawKey) return NextResponse.json({ success: false, error: "Missing RMA ID" }, { status: 400 });

    // Only numeric RMA IDs
    const numericRmaId = rawKey.replace(/\D+/g, "");
    if (!numericRmaId) return NextResponse.json({ success: false, error: "Invalid RMA ID" }, { status: 400 });

    console.log("[NETO GetRma] Searching numeric RMA:", numericRmaId);

    const response = await netoRequest<GetRmaResponse>(
      "GetRma",
      { Filter: { RmaID: numericRmaId }, OUTPUT_SELECTOR },
      { timeoutMs: 60_000 }
    );

    console.log("[NETO GetRma RAW RESPONSE]", JSON.stringify(response, null, 2));

    const rma = response?.Rma;
    if (!rma) return NextResponse.json({ success: false, error: `RMA not found for ID ${numericRmaId}` }, { status: 404 });

    // Ensure RmaLine is always an array
    let rmaLines: any[] = [];
    if (rma.RmaLines?.RmaLine) {
      rmaLines = Array.isArray(rma.RmaLines.RmaLine) ? rma.RmaLines.RmaLine : [rma.RmaLines.RmaLine];
    }

    // Ensure Refund is always an array
    let refunds: any[] = [];
    if (rma.Refunds?.Refund) {
      refunds = Array.isArray(rma.Refunds.Refund) ? rma.Refunds.Refund : [rma.Refunds.Refund];
    }

    const rmaData = {
      ...rma,
      RmaNumber: numericRmaId,
      OriginalOrderID: rma.OrderID,
      OriginalOrderNumber: rma.PurchaseOrderNumber,
      RmaLine: rmaLines,
      Refund: refunds,
    };

    return NextResponse.json({ success: true, data: rmaData });
  } catch (err: any) {
    console.error("[NETO RMA LOOKUP ERROR]", err);
    return NextResponse.json({ success: false, error: err?.message ?? "Request Error" }, { status: 502 });
  }
}


// import { NextResponse } from "next/server";
// import { netoRequest } from "@/app/lib/neto-client";

// type NetoGetRmaResponse = {
//   Ack?: string;
//   Rma?: any;
// };

// const OUTPUT_SELECTOR = [
//   "RmaID",
//   "RmaStatus",
//   "DateIssued",
//   "OrderID",
//   "PurchaseOrderNumber",
//   "CustomerUsername",
//   "CustomerFirstName",
//   "CustomerLastName",
//   "CustomerPhone",
//   "RmaLine",
//   "RmaLine.ItemNumber",
//   "RmaLine.ProductName",
//   "RmaLine.Quantity",
//   "RmaLine.ReturnReason",
//   "RmaLine.ItemStatus",
//   "RmaLine.RefundSubtotal",
// ] as const;

// // ---------- helpers ----------
// function extractLines(rma: any): any[] {
//   if (!rma) return [];
//   if (Array.isArray(rma.RmaLine)) return rma.RmaLine;

//   const rl = rma.RmaLine;
//   if (rl && Array.isArray(rl.RmaLine)) return rl.RmaLine;
//   if (rl && typeof rl === "object") return [rl];

//   return [];
// }

// function normalizeRmaRef(raw: string) {
//   const ref = decodeURIComponent(raw || "").trim();
//   const digitsOnly = ref.replace(/\D/g, "");
//   return { ref, digitsOnly };
// }

// export async function GET(
//   _req: Request,
//   ctx: { params: Promise<{ rmaKey: string }> }
// ) {
//   const { rmaKey: raw } = await ctx.params;
//   const { ref, digitsOnly } = normalizeRmaRef(raw);

//   if (!digitsOnly) {
//     return NextResponse.json(
//       { ok: false, error: "Invalid RMA reference" },
//       { status: 400 }
//     );
//   }

//   try {
//     const payload = {
//       Filter: {
//         RmaID: digitsOnly,
//         OutputSelector: OUTPUT_SELECTOR,
//       },
//     };

//     const data = await netoRequest<NetoGetRmaResponse>(
//       "GetRma",
//       payload,
//       { timeoutMs: 25_000 }
//     );

//     if (data?.Ack !== "Success" || !data?.Rma) {
//       return NextResponse.json(
//         { ok: false, error: `RMA not found for ref ${ref}` },
//         { status: 404 }
//       );
//     }

//     const rma = {
//       ...data.Rma,
//       RmaNumber: digitsOnly,
//       OriginalOrderID: data.Rma.OrderID,
//       OriginalOrderNumber: data.Rma.PurchaseOrderNumber,
//       CustomerEmail: data.Rma.CustomerUsername ?? null,
//     };

//     const items = extractLines(data.Rma);

//     return NextResponse.json({
//       ok: true,
//       rma,
//       items,
//       itemsCount: items.length,
//       matchedQuery: "RmaID",
//     });
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, error: e?.message ?? "Failed to fetch RMA from Neto" },
//       { status: 502 }
//     );
//   }
// }
