"use client";

import { useMemo, useState } from "react";
import type { LookupResponse } from "../../types/neto-lookup";
import type { NetoOrderSummary } from "../../types/neto-lookup";

export default function AdminLookupPage() {
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResponse | null>(null);

  const canSearch = useMemo(
    () => customerName.trim().length >= 3 && !loading,
    [customerName, loading]
  );

  async function onSearch() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/neto/customer-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Lookup failed");
      }

      setResult(data.result as LookupResponse);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Customer Order Lookup</h1>
        <p className="text-slate-600 mt-1">
          Search Neto orders using the customer's full or partial name.
        </p>

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <label className="text-sm font-semibold text-slate-800">Customer Name</label>
          <div className="mt-2 flex gap-3">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              className="flex-1 rounded-xl border px-4 py-3 text-slate-600"
            />

            <button
              disabled={!canSearch}
              onClick={onSearch}
              className={`rounded-xl px-6 py-3 font-semibold text-white ${
                !canSearch
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Orders for “{result.customerName}”
            </h2>

            {result.orders.length === 0 && (
              <p className="text-slate-600">No orders found.</p>
            )}

            {result.orders.map((order) => (
              <OrderCard key={order.orderNumber} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: NetoOrderSummary }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">
          Order #{order.orderNumber}
        </h3>
        <span className="text-xs font-semibold text-slate-600">
          {order.orderStatus}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
        <KeyValue k="Customer" v={`${order.firstName} ${order.lastName}`} />
        <KeyValue k="Payment" v={order.paymentMethod} />
        <KeyValue k="Phone" v={order.phoneNumber} />
        <KeyValue k="Date Placed" v={order.datePlaced} />
      </div>
    </div>
  );
}

function KeyValue({ k, v }: { k: string; v?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 font-semibold">{k}</p>
      <p className="text-sm font-bold">{v || "—"}</p>
    </div>
  );
}
