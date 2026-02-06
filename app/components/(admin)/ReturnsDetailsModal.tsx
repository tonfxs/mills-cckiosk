"use client";

import { useEffect, useMemo, useState } from "react";

type NetoRma = {
  RmaID?: string;
  RmaNumber?: string;
  RmaStatus?: string;
  DateIssued?: string;
  DateUpdated?: string;
  DateApproved?: string;

  OriginalOrderID?: string;
  OriginalOrderNumber?: string;

  CustomerEmail?: string;
  CustomerFirstName?: string;
  CustomerLastName?: string;
  CustomerPhone?: string;

  RefundTotal?: string | number;
  RefundedTotal?: string | number;
  Refund?: Array<{
    PaymentMethodID?: string;
    PaymentMethodName?: string;
    DateIssued?: string;
    DateRefunded?: string;
    RefundStatus?: string;
  }>;

  ReturnReason?: string;
  InternalNotes?: string;

  RmaLine?: Array<{
    ItemNumber?: string;
    ProductName?: string;
    Quantity?: string | number;
    ReturnQty?: string | number;
    ReturnReason?: string;
    ItemStatus?: string;
    RefundSubtotal?: string | number;
    Tax?: string | number;
    TaxCode?: string;
    WarehouseID?: string;
    WarehouseName?: string;
    WarehouseReference?: string;
    ResolutionOutcome?: string;
    ItemStatusType?: string;
    ResolutionStatus?: string;
    ManufacturerClaims?: string;
    IsRestockIssued?: boolean;
  }>;
};

/* ================================
   Helpers
================================ */

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^0-9.\-]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function money(v: any): string {
  const n = toNumber(v);
  if (n === null) return "—";
  return n.toFixed(2);
}

/* ================================
   Component
================================ */

export function RmaDetailsModal({
  open,
  rmaKey,
  onClose,
  onRefresh
}: {
  open: boolean;
  rmaKey: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rma, setRma] = useState<NetoRma | null>(null);
  const [items, setItems] = useState<any[]>([]);

  /* ================================
     Load RMA
  ================================ */

  useEffect(() => {
    if (!open || !rmaKey) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setRma(null);
      setItems([]);

      try {
        const res = await fetch(`/api/neto/rma/${encodeURIComponent(rmaKey?.trim() ?? "")}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Request failed: ${text}`);
        }

        const json = await res.json();
        console.log("API Response:", json);

        if (!json?.success || !json?.data) {
          throw new Error(json?.error || "RMA not found");
        }

        const rmaData = json.data;
        console.log("RMA Data received:", rmaData);
        console.log("RmaLine array:", rmaData.RmaLine);

        setRma(rmaData);

        // Map RmaLine to items for display
        const rmaLines = rmaData.RmaLine || [];
        console.log("Processing RmaLines, count:", rmaLines.length);

        if (Array.isArray(rmaLines)) {
          const mappedItems = rmaLines.map((line: any, idx: number) => {
            console.log(`Line ${idx}:`, line);
            return {
              SKU: line.SKU || line.ItemNumber || "—",
              ProductName: line.ProductName || "—",
              ReturnQty: line.Quantity || "—", // Neto returns Quantity field in the actual data
              Reason: line.ReturnReason || "—",
              Condition: line.ItemStatus || "—",
              RefundAmount: line.RefundSubtotal ?? 0,
            };
          });
          console.log("Mapped items:", mappedItems);
          setItems(mappedItems);
        } else {
          console.warn("RmaLine is not an array:", rmaLines);
          setItems([]);
        }
      } catch (err: any) {
        console.error("Error loading RMA:", err);
        setError(err?.message ?? "Failed to load RMA");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, rmaKey]);

  /* ================================
     ESC close
  ================================ */

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const customerName = useMemo(() => {
    return (
      `${rma?.CustomerFirstName ?? ""} ${rma?.CustomerLastName ?? ""}`.trim() ||
      "—"
    );
  }, [rma]);

  if (!open) return null;

  /* ================================
     Render
  ================================ */

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="absolute inset-x-0 top-8 mx-auto w-[min(1100px,calc(100%-2rem))]">
        <div className="rounded-2xl bg-white shadow-xl border overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-slate-700">
                RMA Details
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                RMA Ref:{" "}
                <span className="font-mono">
                  {rma?.RmaNumber ?? rmaKey}
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <RmaStatusDropdown
                rmaNumber={rma?.RmaNumber}
                currentStatus={rma?.RmaStatus ?? "—"}
                onUpdate={onRefresh ?? (() => { })}
              />

              <button
                onClick={onClose}
                className="rounded-xl border px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Close
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[78vh] overflow-auto p-5 space-y-6">
            {loading && (
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-blue-700">
                Loading RMA from Neto…
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && rma && (
              <>
                {/* RMA Info */}
                <Section title="RMA Information">
                  <Row label="RMA #" value={rma.RmaNumber} />
                  <Row label="Status" value={rma.RmaStatus} />
                  <Row label="Created" value={rma.DateIssued} />
                  <Row
                    label="Original Order"
                    value={rma.OriginalOrderNumber}
                  />
                </Section>

                {/* Customer */}
                <Section title="Customer">
                  <Row label="Name" value={customerName} />
                  <Row label="Phone" value={rma.CustomerPhone} />
                  <Row label="Email" value={rma.CustomerEmail} />
                </Section>

                {/* Refund */}
                <Section title="Refund">
                  <Row
                    label="Total Refund"
                    value={money(rma.RefundTotal)}
                    highlight
                  />
                </Section>

                {/* Notes */}
                <Section title="Notes">
                  <Row label="Reason" value={rma.ReturnReason} />
                  <Row label="Internal" value={rma.InternalNotes} multiline />
                </Section>

                {/* Returned Items */}
                <div className="rounded-2xl border overflow-hidden">
                  <div className="px-4 py-3 bg-slate-200 border-b border-slate-200 ">
                    <h3 className="font-semibold text-slate-700">
                      Returned Items ({items.length})
                    </h3>
                  </div>

                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left">SKU</th>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-left">Reason</th>
                        <th className="px-4 py-3 text-left">Condition</th>
                        <th className="px-4 py-3 text-right">Refund</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-3 font-mono text-slate-500">{i.SKU}</td>
                          <td className="px-4 py-3 text-slate-500">{i.ProductName}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{i.ReturnQty}</td>
                          <td className="px-4 py-3 text-slate-500">{i.Reason}</td>
                          <td className="px-4 py-3 text-slate-500">{i.Condition}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-500">
                            {money(i.RefundAmount)}
                          </td>
                        </tr>
                      ))}

                      {items.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-6 text-center text-slate-500"
                          >
                            No returned items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================
   Small UI Components
================================ */

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  multiline
}: {
  label: string;
  value: any;
  highlight?: boolean;
  multiline?: boolean;
}) {
  const displayValue = value ?? "—";

  if (multiline && displayValue !== "—") {
    return (
      <div className="text-sm">
        <span className="text-slate-600 block mb-1">{label}</span>
        <div className="font-semibold text-slate-800 whitespace-pre-line bg-slate-50 rounded-lg p-3 text-xs leading-relaxed">
          {displayValue}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-slate-600">{label}</span>
      <span
        className={`font-semibold ${highlight ? "text-emerald-700" : "text-slate-800"
          }`}
      >
        {displayValue}
      </span>
    </div>
  );
}

/* ================================
   RMA Status Dropdown
================================ */

function RmaStatusDropdown({
  rmaNumber,
  currentStatus,
  onUpdate
}: {
  rmaNumber?: string;
  currentStatus: string;
  onUpdate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const statuses = [
    "Pending Verification",
    "Pending Pickup",
    "Proceed to Window",
    "Endorsed to WH",
    "Order Collected",
    "Item Received"
  ];

  async function update(newStatus: string) {
    if (!rmaNumber || newStatus === status) return;
    setStatus(newStatus);
    setOpen(false);

    await fetch("/api/admin/update-rma-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rmaNumber, status: newStatus })
    });

    onUpdate();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-xl border px-4 py-2 text-sm font-semibold bg-slate-50 text-slate-700 border-slate-400 hover:bg-slate-100"
      >
        Status: {status}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg z-50">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => update(s)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-600 ${s === status ? "font-semibold bg-slate-50" : ""
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
