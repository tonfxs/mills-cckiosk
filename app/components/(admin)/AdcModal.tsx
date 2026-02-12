"use client";

import { useEffect, useMemo, useState } from "react";

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

function pickLineField(line: any, ...keys: string[]) {
  for (const k of keys) {
    const val = line?.[k];
    if (val !== undefined && val !== null && String(val).trim() !== "") return val;
  }
  return undefined;
}

function getNameFromAddress(addr: any) {
  const first = addr?.FirstName ?? addr?.first_name ?? "";
  const last = addr?.LastName ?? addr?.last_name ?? "";
  return [first, last].filter(Boolean).join(" ").trim();
}

function getPhoneFromAddress(addr: any) {
  return addr?.Phone ?? addr?.phone ?? addr?.Telephone ?? addr?.telephone ?? "";
}

interface AdcModalProps {
  open: boolean;
  orderKey: string | null;
  onClose: () => void;
}

export default function AdcModal({
  open,
  orderKey,
  onClose,
}: AdcModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !orderKey) return;

    const key = orderKey.trim();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setOrder(null);
      setItems([]);

      try {
        const res = await fetch(`/api/neto/orders/${encodeURIComponent(key)}`, {
          cache: "no-store",
        });

        const text = await res.text();
        let data: any;

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`API returned non-JSON (${res.status}): ${text.slice(0, 120)}`);
        }

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || `Request failed (${res.status})`);
        }

        if (!cancelled) {
          setOrder(data.order ?? null);
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load order");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, orderKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const shipAddr = order?.ShipAddress ?? null;
  const billAddr = order?.BillAddress ?? null;

  const fullName = useMemo(() => {
    const shipName = shipAddr ? getNameFromAddress(shipAddr) : "";
    const billName = billAddr ? getNameFromAddress(billAddr) : "";
    const flat =
      [order?.ShipFirstName, order?.ShipLastName].filter(Boolean).join(" ").trim() ||
      [order?.BillFirstName, order?.BillLastName].filter(Boolean).join(" ").trim();
    return shipName || billName || flat || "—";
  }, [shipAddr, billAddr, order]);

  const phone = useMemo(() => {
    const shipPhone = shipAddr ? getPhoneFromAddress(shipAddr) : "";
    const billPhone = billAddr ? getPhoneFromAddress(billAddr) : "";
    const flat = order?.ShipPhone || order?.BillPhone || "";
    return shipPhone || billPhone || flat || "—";
  }, [shipAddr, billAddr, order]);

  const orderNumberDisplay = String(order?.OrderID ?? order?.OrderNumber ?? "—");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close modal" />

      {/* Panel */}
      <div className="absolute inset-x-0 top-8 mx-auto w-[min(1100px,calc(100%-2rem))]">
        <div className="rounded-2xl bg-white shadow-xl border overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b">
            <div>
              <h2 className="text-lg text-slate-600 font-bold">Order Details</h2>
              <p className="text-sm text-slate-600 mt-1">
                Order: <span className="font-mono">{orderKey}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="rounded-xl border px-3 py-2 text-sm text-red-600 font-semibold hover:bg-red-50 active:bg-red-100"
              >
                Close
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[78vh] overflow-auto p-5 space-y-5">
            {loading && (
              <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
                Loading order from Neto…
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && order && (
              <>
                {/* Order Data */}
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 overflow-hidden">
                  <div className="px-4 py-3 bg-blue-100 border-b border-blue-200">
                    <h3 className="font-bold text-blue-900">Order Information</h3>
                    <p className="text-xs text-blue-700 mt-0.5">Data from Neto API</p>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Order Info */}
                    <DataSection title="Order Details">
                      <DataRow label="Order #" value={orderNumberDisplay} />
                      <DataRow label="Date Placed" value={String(order?.DatePlaced ?? "—")} />
                      <DataRow label="Sales Channel" value={String(order?.SalesChannel ?? "—")} />
                      <DataRow label="Payment Method" value={String(order?.DefaultPaymentType ?? "—")} />
                    </DataSection>

                    {/* Customer Info */}
                    <DataSection title="Customer">
                      <DataRow label="Name" value={fullName} />
                      <DataRow label="Phone" value={phone} />
                      <DataRow label="Email" value={String(order?.Email ?? "—")} />
                    </DataSection>

                    {/* Shipping Address */}
                    <DataSection title="Shipping Address">
                      <DataRow
                        label="Street"
                        value={String(order?.ShipStreetLine1 ?? order?.ShipAddress1 ?? "—")}
                      />
                      <DataRow
                        label="City"
                        value={String(order?.ShipCity ?? "—")}
                      />
                      <DataRow
                        label="State/Postcode"
                        value={`${order?.ShipState ?? "—"} ${order?.ShipPostCode ?? "—"}`}
                      />
                      <DataRow
                        label="Country"
                        value={String(order?.ShipCountry ?? "—")}
                      />
                    </DataSection>

                    {/* Totals */}
                    <DataSection title="Order Totals">
                      <DataRow label="Grand Total" value={`$${money(order?.GrandTotal)}`} />
                      <DataRow label="Shipping Total" value={`$${money(order?.ShippingTotal)}`} />
                    </DataSection>

                    {/* Notes */}
                    {/* Notes */}
                    {(order?.StickyNotes?.Title || order?.StickyNotes?.Description || order?.InternalOrderNotes) && (
                      <DataSection title="Notes">
                        {order?.StickyNotes?.Title && (
                          <DataRow
                            label="Sticky Note Title"
                            value={String(order.StickyNotes.Title)}
                          />
                        )}
                        {order?.StickyNotes?.Description && (
                          <DataRow
                            label="Sticky Note Description"
                            value={String(order.StickyNotes.Description)}
                            multiline
                          />
                        )}
                        {order?.InternalOrderNotes && (
                          <DataRow
                            label="Internal Order Notes"
                            value={String(order.InternalOrderNotes)}
                            multiline
                          />
                        )}
                      </DataSection>
                    )}
                  </div>
                </div>

                {/* Items Table from Neto */}
                <div className="rounded-2xl border-2 border-blue-200 bg-white overflow-hidden">
                  <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                    <h3 className="font-semibold text-blue-900">Order Items</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold">SKU</th>
                          <th className="text-left px-4 py-3 font-semibold">Name</th>
                          <th className="text-left px-4 py-3 font-semibold">Warehouse</th>
                          <th className="text-right px-4 py-3 font-semibold">Qty</th>
                          <th className="text-right px-4 py-3 font-semibold">Price</th>
                          <th className="text-right px-4 py-3 font-semibold">Total</th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((line, idx) => {
                          const sku = pickLineField(line, "SKU", "ItemSKU", "ProductSKU") ?? "—";
                          const name =
                            pickLineField(line, "ProductName", "Name", "ItemName", "Title") ?? "—";
                          const warehouse = pickLineField(line, "WarehouseName", "Warehouse") ?? "—";
                          const qtyRaw = pickLineField(line, "Quantity", "Qty", "OrderLineQty");
                          const priceRaw = pickLineField(line, "UnitPrice", "Price", "LinePrice");

                          const qty = toNumber(qtyRaw) ?? 0;
                          const price = toNumber(priceRaw);

                          const lineTotal =
                            toNumber(pickLineField(line, "Total", "LineTotal")) ??
                            (price !== null ? qty * price : null);

                          return (
                            <tr key={idx} className="border-t hover:bg-blue-50">
                              <td className="px-4 py-3 font-mono text-slate-700">{String(sku)}</td>
                              <td className="px-4 py-3 text-slate-700">{String(name)}</td>
                              <td className="px-4 py-3 text-slate-700">{String(warehouse)}</td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {qtyRaw ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                ${priceRaw != null ? money(priceRaw) : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-700">
                                ${lineTotal != null ? money(lineTotal) : "—"}
                              </td>
                            </tr>
                          );
                        })}

                        {items.length === 0 && (
                          <tr>
                            <td className="px-4 py-4 text-slate-500 text-center" colSpan={6}>
                              No items returned by Neto.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DataRow({
  label,
  value,
  multiline = false
}: {
  label: string;
  value: string | number | undefined | null;
  multiline?: boolean;
}) {
  const displayValue = value ?? "—";

  if (multiline) {
    return (
      <div className="text-sm">
        <span className="text-slate-600 font-medium block mb-1">{label}:</span>
        <div className="text-slate-900 font-mono text-xs bg-slate-50 p-3 rounded-lg border whitespace-pre-wrap break-words">
          {displayValue}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-start gap-3 text-sm">
      <span className="text-slate-600 font-medium">{label}:</span>
      <span className="text-slate-900 font-semibold text-right break-words max-w-[60%]">
        {displayValue}
      </span>
    </div>
  );
}