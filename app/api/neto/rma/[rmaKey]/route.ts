import { NextResponse } from "next/server";
import { netoRequest } from "@/app/lib/neto-client";

type NetoGetRmaResponse = {
  Ack?: string;
  Rma?: any;
};

type NetoGetOrderResponse = {
  Ack?: string;
  Order?: any[];
  Orders?: any[];
};

// ✅ Based on Neto API documentation - only include supported fields
const RMA_OUTPUT_SELECTOR = [
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

// ✅ Order fields for customer details
const ORDER_OUTPUT_SELECTOR = [
  "ID",
  "OrderID",
  "OrderNumber",
  "PurchaseOrderNumber",
  "Email",
  "Username",
  "BillFirstName",
  "BillLastName",
  "BillPhone",
  "BillMobilePhone",
  "ShipFirstName",
  "ShipLastName",
  "ShipPhone",
  "ShipMobilePhone",
  "ShipAddress",
  "BillAddress",
  "SalesChannel",
] as const;

// ---------- helpers ----------
function cleanInternalNotes(notes: string | null | undefined): string {
  if (!notes) return "";

  return notes
    .replace(/\t+/g, "")
    .replace(/[#\$\+]{3,}/g, "")
    .replace(/["']/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s*:\s*/g, ": ")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n")
    .trim();
}

function extractLines(rma: any): any[] {
  if (!rma) return [];

  if (rma.RmaLines?.RmaLine) {
    const lines = rma.RmaLines.RmaLine;
    return Array.isArray(lines) ? lines : [lines];
  }

  if (rma.RmaLine) {
    return Array.isArray(rma.RmaLine) ? rma.RmaLine : [rma.RmaLine];
  }

  return [];
}

function extractRefunds(rma: any): any[] {
  if (!rma) return [];

  if (rma.Refunds?.Refund) {
    const refunds = rma.Refunds.Refund;
    return Array.isArray(refunds) ? refunds : [refunds];
  }

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

// ✅ Fetch order by OrderID
async function getOrderByOrderID(orderID: string) {
  if (!orderID) return null;

  try {
    const payload = {
      Filter: {
        OrderID: orderID,
        OutputSelector: ORDER_OUTPUT_SELECTOR,
      },
    };

    console.log("[NETO GetOrder REQUEST for RMA]", JSON.stringify(payload, null, 2));

    const data = await netoRequest<NetoGetOrderResponse>(
      "GetOrder",
      payload,
      { timeoutMs: 30_000 }
    );

    console.log("[NETO GetOrder RAW RESPONSE for RMA]", JSON.stringify(data, null, 2));

    if (data?.Ack !== "Success") return null;

    const orders = data?.Order ?? data?.Orders ?? [];
    const orderArray = Array.isArray(orders) ? orders : [];

    return orderArray[0] ?? null;
  } catch (e: any) {
    console.error("[NETO ORDER LOOKUP ERROR for RMA]", e);
    return null;
  }
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
    // Fetch RMA
    const payload = {
      Filter: {
        RmaID: digitsOnly,
        OutputSelector: RMA_OUTPUT_SELECTOR,
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

    // ✅ Fetch original order for customer details
    let originalOrder = null;
    if (data.Rma.OrderID) {
      originalOrder = await getOrderByOrderID(data.Rma.OrderID);
    }

    console.log("[NETO RESOLVED RMA]", JSON.stringify(data.Rma, null, 2));
    console.log("[NETO RESOLVED RMA LINES]", JSON.stringify(rmaLines, null, 2));
    console.log("[NETO RESOLVED REFUNDS]", JSON.stringify(refunds, null, 2));
    console.log("[NETO RESOLVED ORIGINAL ORDER]", JSON.stringify(originalOrder, null, 2));

    const rmaData = {
      RmaID: data.Rma.RmaID || digitsOnly,
      RmaNumber: data.Rma.RmaNumber || digitsOnly,
      RmaStatus: data.Rma.RmaStatus,
      DateIssued: data.Rma.DateIssued,
      DateUpdated: data.Rma.DateUpdated,
      DateApproved: data.Rma.DateApproved,
      OriginalOrderID: data.Rma.OrderID,
      OriginalOrderNumber: data.Rma.PurchaseOrderNumber,
      CustomerEmail: originalOrder?.Email || data.Rma.CustomerUsername || null,
      CustomerUsername: originalOrder?.Username || data.Rma.CustomerUsername || null,
      CustomerFirstName: originalOrder?.BillFirstName || data.Rma.CustomerFirstName || null,
      CustomerLastName: originalOrder?.BillLastName || data.Rma.CustomerLastName || null,
      CustomerPhone: originalOrder?.BillPhone || originalOrder?.BillMobilePhone || data.Rma.CustomerPhone || null,
      BillingAddress: originalOrder?.BillAddress || null,
      ShippingAddress: originalOrder?.ShipAddress || null,
      SalesChannel: originalOrder?.SalesChannel || null,
      RefundTotal: data.Rma.RefundTotal,
      RefundSubtotal: data.Rma.RefundSubtotal,
      RefundTaxTotal: data.Rma.RefundTaxTotal,
      ReturnReason: data.Rma.ReturnReason,
      InternalNotes: cleanInternalNotes(data.Rma.InternalNotes),

      ResolutionOutcome: rmaLines[0]?.ResolutionOutcome || null,
      ItemStatusType: rmaLines[0]?.ItemStatusType || null,
      ResolutionStatus: rmaLines[0]?.ResolutionStatus || null,
      ManufacturerClaims: rmaLines[0]?.ManufacturerClaims || null,


      RmaLine: rmaLines,
      Refund: refunds,
      // ✅ Include full order object if you need more fields
      OriginalOrder: originalOrder,
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