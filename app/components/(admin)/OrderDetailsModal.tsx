"use client";

import type { PickupRow } from "@/app/types/pickup";
import { useEffect, useMemo, useState } from "react";

type NetoOrder = {
  OrderID?: string;
  OrderNumber?: string;
  OrderStatus?: string;
  DatePlaced?: string;
  Email?: string;
  ShipFirstName?: string;
  ShipLastName?: string;
  ShipPhone?: string;
  BillFirstName?: string;
  BillLastName?: string;
  BillPhone?: string;
  GrandTotal?: string | number;
  ShippingTotal?: string | number;
  Items?: Array<{
    SKU?: string;
    Name?: string;
    Quantity?: string | number;
    Price?: string | number;
    Total?: string | number;
  }>;
};

type ApiResponse =
  | { ok: true; order: any; items: any[]; itemsCount?: number; matchedQuery?: string }
  | { ok: false; error: string };

function getNameFromAddress(addr: any) {
  const first = addr?.FirstName ?? addr?.first_name ?? "";
  const last = addr?.LastName ?? addr?.last_name ?? "";
  return [first, last].filter(Boolean).join(" ").trim();
}

function getPhoneFromAddress(addr: any) {
  return addr?.Phone ?? addr?.phone ?? addr?.Telephone ?? addr?.telephone ?? "";
}

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

export function OrderDetailsModal({
  open,
  orderKey,
  rowData,
  onClose,
  onRefresh,
  onPatchRow,
}: {
  open: boolean;
  orderKey: string | null;
  rowData?: PickupRow | null;
  onClose: () => void;
  onRefresh?: () => void;
  onPatchRow?: (patch: Partial<PickupRow>) => void;
}) {
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
        let data: ApiResponse;

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`API returned non-JSON (${res.status}): ${text.slice(0, 120)}`);
        }

        if (!res.ok || !data?.ok) {
          throw new Error((data as any)?.error || `Request failed (${res.status})`);
        }

        if (!cancelled) {
          setOrder((data as any).order ?? null);
          setItems(Array.isArray((data as any).items) ? (data as any).items : []);
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
              <h2 className="text-lg text-slate-600 font-bold">Pickup Order Details</h2>
              <p className="text-sm text-slate-600 mt-1">
                Selected: <span className="font-mono">{orderKey}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {rowData && (
                <UpdateStatusDropdown
                  orderNumber={rowData.orderNumber}
                  currentStatus={rowData.status || "—"}
                  onUpdate={() => {
                    onRefresh?.();
                  }}
                />
              )}

              {rowData && (
                <AssignAgentDropdown
                  orderNumber={rowData.orderNumber}
                  currentAgent={rowData.agent || "—"}
                  onUpdate={() => {
                    onRefresh?.();
                  }}
                />
              )}

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
                {/* Data Comparison Section */}
                {rowData && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-blue-900">Data Comparison</h3>
                    </div>
                    <p className="text-sm text-blue-800">
                      Compare kiosk input data (left) with Neto source data (right)
                    </p>
                  </div>
                )}

                {/* Side-by-Side Comparison Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Kiosk Input Data */}
                  {rowData && (
                    <div className="rounded-2xl border-2 border-green-200 bg-green-50 overflow-hidden">
                      <div className="px-4 py-3 bg-green-100 border-b border-green-200">
                        <h3 className="font-bold text-green-900">Kiosk Input Data</h3>
                        <p className="text-xs text-green-700 mt-0.5">Data from table/user input</p>
                      </div>
                      <div className="p-4 space-y-4">
                        <DataSection title="Order Information">
                          <DataRow label="Order #" value={rowData.orderNumber} />
                          <DataRow label="Status" value={rowData.status} />
                          <DataRow label="Time" value={rowData.timestamp} />
                        </DataSection>

                        <DataSection title="Customer">
                          <DataRow label="Name" value={rowData.fullName} />
                          <DataRow label="Phone" value={rowData.phone} />
                        </DataSection>

                        <DataSection title="Pickup Details">
                          <DataRow label="Payment" value={rowData.paymentMethod} />
                          <DataRow label="Car Park Bay" value={rowData.carParkBay} />
                        </DataSection>
                      </div>
                    </div>
                  )}

                  {/* Neto API Data */}
                  <div className="rounded-2xl border-2 border-green-200 bg-green-50 overflow-hidden">
                    <div className="px-4 py-3 bg-green-100 border-b border-green-200">
                      <h3 className="font-bold text-green-900">Neto Source Data</h3>
                      <p className="text-xs text-green-700 mt-0.5">Data from Neto API</p>
                    </div>
                    <div className="p-4 space-y-4">
                      <DataSection title="Order Information">
                        <DataRow label="Order #" value={orderNumberDisplay} />
                        <DataRow label="Status" value={String(order?.OrderStatus ?? "—")} />
                        <DataRow label="Date Placed" value={String(order?.DatePlaced ?? "—")} />
                        <DataRow label="Sales Channel" value={String(order?.SalesChannel ?? "—")} />
                        <DataRow label="Payment Method" value={String(order?.DefaultPaymentType ?? "—")} />
                      </DataSection>

                      <DataSection title="Sticky Notes">
                        <DataRow label="Title" value={String(order?.StickyNotes?.Title ?? "—")} />
                        <DataRow label="Description" value={String(order?.StickyNotes?.Description ?? "—")} />
                      </DataSection>

                      <DataSection title="Customer">
                        <DataRow label="Name" value={fullName} />
                        <DataRow label="Phone" value={phone} />
                        <DataRow label="Email" value={String(order?.Email ?? "—")} />
                      </DataSection>

                      <DataSection title="Order Totals">
                        <DataRow label="Grand Total" value={money(order?.GrandTotal)} />
                        <DataRow label="Shipping Total" value={money(order?.ShippingTotal)} />
                      </DataSection>
                    </div>
                  </div>
                </div>

                {/* --- FIXED INTERNAL NOTES SECTION (Full Width) --- */}
                {order?.InternalOrderNotes && (
                  <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 overflow-hidden">
                    <div className="px-4 py-3 bg-amber-100 border-b border-amber-200 flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <h3 className="font-bold text-amber-900 text-sm uppercase">Internal Order Notes</h3>
                    </div>
                    <div className="p-4">
                      <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {order.InternalOrderNotes}
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Table from Neto */}
                <div className="rounded-2xl border-2 border-green-200 bg-white overflow-hidden">
                  <div className="px-4 py-3 bg-green-50 border-b border-green-200">
                    <h3 className="font-semibold text-green-900">Order Items (from Neto)</h3>
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
                          const name = pickLineField(line, "ProductName", "Name", "ItemName", "Title") ?? "—";
                          const warehouse = pickLineField(line, "WarehouseName", "Warehouse") ?? "—";
                          const qtyRaw = pickLineField(line, "Quantity", "Qty", "OrderLineQty");
                          const priceRaw = pickLineField(line, "UnitPrice", "Price", "LinePrice");

                          const qty = toNumber(qtyRaw) ?? 0;
                          const price = toNumber(priceRaw);
                          const lineTotal =
                            toNumber(pickLineField(line, "Total", "LineTotal")) ??
                            (price !== null ? qty * price : null);

                          return (
                            <tr key={idx} className="border-t hover:bg-green-50">
                              <td className="px-4 py-3 font-mono text-slate-700">{String(sku)}</td>
                              <td className="px-4 py-3 text-slate-700">{String(name)}</td>
                              <td className="px-4 py-3 text-slate-700">{String(warehouse)}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{qtyRaw ?? "—"}</td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {priceRaw != null ? money(priceRaw) : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-700">
                                {lineTotal != null ? money(lineTotal) : "—"}
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

// --- Helper Layout Components ---

function DataSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  const displayValue = value ?? "—";
  return (
    <div className="flex justify-between items-start gap-3 text-sm">
      <span className="text-slate-600 font-medium">{label}:</span>
      <span className="text-slate-900 font-semibold text-right">{displayValue}</span>
    </div>
  );
}

// --- Dropdowns ---

function UpdateStatusDropdown({ orderNumber, currentStatus, onUpdate }: { orderNumber: string; currentStatus: string; onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayStatus, setDisplayStatus] = useState(currentStatus);

  useEffect(() => { setDisplayStatus(currentStatus); }, [currentStatus]);

  const statuses = ["Pending Verification", "Pending Pickup", "Endorsed to WH", "Proceed to Window", "Order Collected", "Item Received"];

  const handleUpdateStatus = async (newStatus: string) => {
    if (newStatus === displayStatus) { setIsOpen(false); return; }
    setUpdating(true);
    setError(null);
    const previousStatus = displayStatus;
    setDisplayStatus(newStatus);
    setIsOpen(false);

    try {
      const res = await fetch('/api/admin/update-pickup-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status');
      setUpdating(false);
      setTimeout(() => onUpdate(), 300);
    } catch (e: any) {
      setDisplayStatus(previousStatus);
      setError(e.message || 'Failed to update status');
      setUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={updating}
        className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 flex items-center gap-2"
      >
        <span className="text-xs text-blue-600">Status:</span>
        <span>{updating ? 'Updating...' : displayStatus}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-white shadow-lg z-50">
            <div className="p-2 space-y-1">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 ${status === displayStatus ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AssignAgentDropdown({ orderNumber, currentAgent, onUpdate }: { orderNumber: string; currentAgent: string; onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [displayAgent, setDisplayAgent] = useState(currentAgent);

  useEffect(() => { setDisplayAgent(currentAgent); }, [currentAgent]);

  const agents = ["JB", "CC", "KB"];

  const handleAssignAgent = async (newAgent: string) => {
    if (newAgent === displayAgent) { setIsOpen(false); return; }
    setUpdating(true);
    const previousAgent = displayAgent;
    setDisplayAgent(newAgent);
    setIsOpen(false);

    try {
      const res = await fetch('/api/admin/assign-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, agent: newAgent })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Failed');
      setUpdating(false);
      setTimeout(() => onUpdate(), 300);
    } catch (e) {
      setDisplayAgent(previousAgent);
      setUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={updating}
        className="rounded-xl border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50 flex items-center gap-2"
      >
        <span className="text-xs text-green-600">Agent:</span>
        <span>{updating ? 'Updating...' : displayAgent}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-white shadow-lg z-50">
            <div className="p-2 space-y-1">
              {agents.map((agent) => (
                <button
                  key={agent}
                  onClick={() => handleAssignAgent(agent)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 ${agent === displayAgent ? 'bg-green-50 text-green-700 font-semibold' : 'text-slate-700'}`}
                >
                  {agent}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}