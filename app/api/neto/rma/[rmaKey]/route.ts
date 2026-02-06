import { NextResponse } from "next/server";
import { netoRequest } from "@/app/lib/neto-client";

type NetoGetRmaResponse = {
  Ack?: string;
  Rma?: any;
};

// ✅ Based on Neto API documentation - only include supported fields
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
  
  "RmaLine",
  "RmaLine.ItemNumber",
  "RmaLine.Extra",
  "RmaLine.ExtraOptions",
  "RmaLine.ItemNotes",
  "RmaLine.ProductName",
  "RmaLine.RefundSubtotal",
  "RmaLine.Tax",
  "RmaLine.TaxCode",
  "RmaLine.WarehouseID",
  "RmaLine.WarehouseName",
  "RmaLine.WarehouseReference",
  "RmaLine.ResolutionOutcome",
  "RmaLine.ReturnReason",
  "RmaLine.ItemStatusType",
  "RmaLine.ItemStatus",
  "RmaLine.ResolutionStatus",
  "RmaLine.ManufacturerClaims",
  "RmaLine.IsRestockIssued",
  
  "RefundedTotal",
  "Refund",
  "Refund.PaymentMethodID",
  "Refund.PaymentMethodName",
  "Refund.DateIssued",
  "Refund.DateRefunded",
  "Refund.RefundStatus",
] as const;

// ---------- helpers ----------
function cleanInternalNotes(notes: string | null | undefined): string {
  if (!notes) return "";
  
  return notes
    // Remove tabs, replace with nothing
    .replace(/\t+/g, "")
    // Remove special character patterns like ###, +++, $$$
    .replace(/[#\$\+]{3,}/g, "")
    // Remove quotes around standalone words
    .replace(/["']/g, "")
    // Normalize line breaks (convert \r\n to \n, remove extra blank lines)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    // Clean up spacing around colons
    .replace(/\s*:\s*/g, ": ")
    // Remove leading/trailing whitespace from each line
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n")
    .trim();
}

function extractLines(rma: any): any[] {
  if (!rma) return [];
  
  // Check for RmaLines.RmaLine (nested structure)
  if (rma.RmaLines?.RmaLine) {
    const lines = rma.RmaLines.RmaLine;
    return Array.isArray(lines) ? lines : [lines];
  }
  
  // Check for direct RmaLine
  if (rma.RmaLine) {
    return Array.isArray(rma.RmaLine) ? rma.RmaLine : [rma.RmaLine];
  }

  return [];
}

function extractRefunds(rma: any): any[] {
  if (!rma) return [];
  
  // Check for Refunds.Refund (nested structure)
  if (rma.Refunds?.Refund) {
    const refunds = rma.Refunds.Refund;
    return Array.isArray(refunds) ? refunds : [refunds];
  }
  
  // Check for direct Refund
  if (rma.Refund) {
    return Array.isArray(rma.Refund) ? rma.Refund : [rma.Refund];
  }

  return [];
}

function normalizeRmaRef(raw: string) {
  const ref = decodeURIComponent(raw || "").trim();
  const digitsOnly = ref.replace(/\D/g, "");
  return { ref, digitsOnly };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ rmaKey: string }> }
) {
  const { rmaKey: raw } = await ctx.params;
  const { ref, digitsOnly } = normalizeRmaRef(raw);

  if (!digitsOnly) {
    return NextResponse.json(
      { success: false, error: "Invalid RMA reference" },
      { status: 400 }
    );
  }

  try {
    // Same pattern as GetOrder - OutputSelector inside Filter
    const payload = {
      Filter: {
        RmaID: digitsOnly,
        OutputSelector: OUTPUT_SELECTOR,
      },
    };

    console.log("[NETO GetRma REQUEST]", JSON.stringify(payload, null, 2));

    const data = await netoRequest<NetoGetRmaResponse>(
      "GetRma",
      payload,
      { timeoutMs: 60_000 }
    );

    console.log("[NETO GetRma RAW RESPONSE]", JSON.stringify(data, null, 2));

    if (data?.Ack !== "Success" || !data?.Rma) {
      return NextResponse.json(
        { success: false, error: `RMA not found for ref ${ref}` },
        { status: 404 }
      );
    }

    const rmaLines = extractLines(data.Rma);
    const refunds = extractRefunds(data.Rma);

    console.log("[NETO RESOLVED RMA]", JSON.stringify(data.Rma, null, 2));
    console.log("[NETO RESOLVED RMA LINES]", JSON.stringify(rmaLines, null, 2));
    console.log("[NETO RESOLVED REFUNDS]", JSON.stringify(refunds, null, 2));

    const rmaData = {
      RmaID: data.Rma.RmaID || digitsOnly,
      RmaNumber: data.Rma.RmaNumber || digitsOnly,
      RmaStatus: data.Rma.RmaStatus,
      DateIssued: data.Rma.DateIssued,
      DateUpdated: data.Rma.DateUpdated,
      DateApproved: data.Rma.DateApproved,
      OriginalOrderID: data.Rma.OrderID,
      OriginalOrderNumber: data.Rma.PurchaseOrderNumber,
      CustomerEmail: data.Rma.CustomerUsername ?? null,
      CustomerFirstName: data.Rma.CustomerFirstName,
      CustomerLastName: data.Rma.CustomerLastName,
      CustomerPhone: data.Rma.CustomerPhone,
      RefundTotal: data.Rma.RefundTotal,
      RefundSubtotal: data.Rma.RefundSubtotal,
      RefundTaxTotal: data.Rma.RefundTaxTotal,
      ReturnReason: data.Rma.ReturnReason,
      InternalNotes: cleanInternalNotes(data.Rma.InternalNotes),
      RmaLine: rmaLines,
      Refund: refunds,
    };

    return NextResponse.json({
      success: true,
      data: rmaData,
      itemsCount: rmaLines.length,
      matchedQuery: "RmaID",
    });
  } catch (e: any) {
    console.error("[NETO RMA LOOKUP ERROR]", e);
    return NextResponse.json(
      { success: false, error: e?.message ?? "Failed to fetch RMA from Neto" },
      { status: 502 }
    );
  }
}