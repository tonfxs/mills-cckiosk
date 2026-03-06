"use client";

import type { PickupRow } from "@/app/types/pickup";
import { useEffect, useMemo, useState } from "react";

/* =========================
   TYPES
========================= */

type Address = {
  FirstName?: string;
  LastName?: string;
  Phone?: string;
  [key: string]: any;
};

type MasterlistOrder = {
  OrderID?: string;
  OrderNumber?: string;
  OrderStatus?: string;
  DatePlaced?: string;
  Email?: string;
  SalesChannel?: string;
  DefaultPaymentType?: string;
  ShippingOption?: string;
  ShippingMethod?: string;
  CustomerEmail?: string;

  ShipFirstName?: string;
  ShipLastName?: string;
  ShipPhone?: string;

  BillFirstName?: string;
  BillLastName?: string;
  BillPhone?: string;

  ShipAddress?: Address;
  BillAddress?: Address;

  GrandTotal?: string | number;
  ShippingTotal?: string | number;
};

type ApiResponse =
  | { ok: true; order: MasterlistOrder; items: any[] }
  | { ok: false; error: string };

/* =========================
   HELPERS
========================= */

function getNameFromAddress(addr?: Address) {
  if (!addr) return "";
  return [addr.FirstName, addr.LastName].filter(Boolean).join(" ").trim();
}

function getPhoneFromAddress(addr?: Address) {
  if (!addr) return "";
  return addr.Phone ?? "";
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function money(v: any) {
  const n = toNumber(v);
  return n !== null ? n.toFixed(2) : "—";
}

/* =========================
   SMALL UI COMPONENTS
========================= */

function StatusPill({ label }: { label?: string }) {
  if (!label) return null;

  const lower = label.toLowerCase();

  const color =
    lower.includes("complete") || lower.includes("paid")
      ? "bg-green-100 text-green-700 border-green-200"
      : lower.includes("pending")
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : lower.includes("cancel")
      ? "bg-red-100 text-red-700 border-red-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border font-semibold ${color}`}>
      {label}
    </span>
  );
}

function DataSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">
        {value ?? "—"}
      </span>
    </div>
  );
}

/* =========================
   MAIN MODAL
========================= */

export function OrderDetailsModal({
  open,
  orderKey,
  rowData,
  onClose,
}: {
  open: boolean;
  orderKey: string | null;
  rowData?: PickupRow | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<MasterlistOrder | null>(null);
  const [items, setItems] = useState<any[]>([]);

  /* =========================
     FETCH MASTERLIST
  ========================= */

useEffect(() => {
  if (!open || !orderKey) return;

  let cancelled = false;

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/masterlist-datatable`,
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("Failed to fetch masterlist");

      const data = await res.json();

      // assuming API returns array of orders
      const foundOrder = Array.isArray(data)
        ? data.find((o: any) => 
            o.OrderNumber === orderKey || 
            o.OrderID === orderKey
          )
        : null;

      if (!foundOrder) {
        throw new Error("Order not found");
      }

      if (!cancelled) {
        setOrder(foundOrder);
        setItems(foundOrder.Items ?? []);
      }

    } catch (err: any) {
      if (!cancelled) setError(err.message);
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  load();

  return () => {
    cancelled = true;
  };
}, [open, orderKey]);

  /* =========================
     ESC TO CLOSE
  ========================= */

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  /* =========================
     DERIVED VALUES
  ========================= */

  const fullName = useMemo(() => {
    if (!order) return "—";

    return (
      getNameFromAddress(order.ShipAddress) ||
      getNameFromAddress(order.BillAddress) ||
      [order.ShipFirstName, order.ShipLastName]
        .filter(Boolean)
        .join(" ") ||
      [order.BillFirstName, order.BillLastName]
        .filter(Boolean)
        .join(" ") ||
      "—"
    );
  }, [order]);

  const phone = useMemo(() => {
    if (!order) return "—";

    return (
      getPhoneFromAddress(order.ShipAddress) ||
      getPhoneFromAddress(order.BillAddress) ||
      order.ShipPhone ||
      order.BillPhone ||
      "—"
    );
  }, [order]);

  /* =========================
     UI
  ========================= */

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 top-10 mx-auto w-[min(1000px,calc(100%-2rem))]">
        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">

          {/* Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-slate-700">
                Order Details (Masterlist)
              </h2>
              <p className="text-sm text-slate-500">
                {orderKey}
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-red-600 font-semibold text-sm"
            >
              Close
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-auto">

            {loading && <div>Loading...</div>}
            {error && <div className="text-red-600">{error}</div>}

            {order && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Kiosk */}
                  {rowData && (
                    <div className="border rounded-xl p-4 bg-green-50">
                      <h3 className="font-bold text-green-800 mb-4">
                        Kiosk Data
                      </h3>

                      <DataSection title="Customer">
                        <DataRow label="Name" value={rowData.fullName} />
                        <DataRow label="Phone" value={rowData.phone} />
                      </DataSection>

                      <DataSection title="Order">
                        <DataRow label="Order #" value={rowData.orderNumber} />
                        <DataRow label="Status" value={rowData.status} />
                      </DataSection>
                    </div>
                  )}

                  {/* Masterlist */}
                  <div className="border rounded-xl p-4 bg-slate-50">
                    <h3 className="font-bold text-slate-800 mb-4">
                      Masterlist Data
                    </h3>

                    <div className="flex gap-2 mb-4">
                      <StatusPill label={order.OrderStatus} />
                      <StatusPill label={order.ShippingOption} />
                    </div>

                    <DataSection title="Customer">
                      <DataRow label="Name" value={fullName} />
                      <DataRow label="Phone" value={phone} />
                      <DataRow label="Email" value={order.Email} />
                    </DataSection>

                    <DataSection title="Totals">
                      <DataRow label="Grand Total" value={money(order.GrandTotal)} />
                      <DataRow label="Shipping" value={money(order.ShippingTotal)} />
                    </DataSection>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold mb-3">Items</h3>

                  <div className="overflow-x-auto border rounded-xl">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-left">SKU</th>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-right">Qty</th>
                          <th className="px-4 py-2 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-4 py-2">{item.SKU ?? "—"}</td>
                            <td className="px-4 py-2">{item.Name ?? "—"}</td>
                            <td className="px-4 py-2 text-right">
                              {item.Quantity ?? "—"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {money(item.Price)}
                            </td>
                          </tr>
                        ))}

                        {items.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                              No items found
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

// --- AgentNotesInline, DataSection, DataRow, UpdateStatusDropdown, AssignAgentDropdown ---
// ... keep the same as your original code, unchanged