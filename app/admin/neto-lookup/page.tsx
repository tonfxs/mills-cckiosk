"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import OrderCard from "../../components/(admin)/OrderCard";
import AdcModal from "../../components/(admin)/AdcModal";

type NetoOrder = {
  OrderID: string;
  BillFirstName?: string;
  BillLastName?: string;
  ShipFirstName?: string;
  ShipLastName?: string;
  Email?: string;
  ShipPhone?: string;
  BillPhone?: string;
  DatePlaced?: string;
  OrderStatus?: string;
  GrandTotal?: string;
  SalesChannel?: string;
  PurchaseOrderNumber?: string;
  OrderPayment?: Array<{ Amount?: string; DatePaid?: string; PaymentType?: string }>;
  OrderLine?: Array<{ SKU?: string; Quantity?: string; ProductName?: string }>;
  customerFullName?: string;
  itemsCount?: number;
  [key: string]: any;
};

type LookupResponse = {
  totalFetched: number;
  totalFiltered: number;
  orders: NetoOrder[];
  filter: {
    customerName: string | null;
    dateFrom: string;
    dateTo: string;
  };
};

type NetoOrderSummary = {
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  paymentMethod: string;
  paymentAmount: string;
  phoneNumber: string;
  datePlaced?: string;
  orderStatus?: string;
  grandTotal?: string;
  salesChannel?: string;
  itemCount?: number;
};

export default function AdminLookupPage() {
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [selectedOrderKey, setSelectedOrderKey] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const canSearch = useMemo(() => customerName.trim().length >= 3 && !loading, [customerName, loading]);

  const handleOrderClick = useCallback((order: NetoOrderSummary) => {
    setSelectedOrderKey(order.orderNumber);
    setModalOpen(true);
  }, []);

  // --- Incremental / batched search ---
  const onSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);
      const filter = {
        customerName: customerName.trim(),
        dateFrom: dateFrom.toISOString().slice(0, 10),
        dateTo: new Date().toISOString().slice(0, 10),
      };

      const LIMIT = 100;
      const MAX_PAGES = 20;
      let allOrders: NetoOrder[] = [];
      let page = 1;

      while (page <= MAX_PAGES) {
        const payload = {
          customerName: filter.customerName,
          page,
          limit: LIMIT,
        };

        const res = await fetch("/api/neto/customer-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Lookup failed");

        // Append new batch
        allOrders = [...allOrders, ...data.result.orders];

        // Update UI immediately
        setResult({
          totalFetched: allOrders.length,
          totalFiltered: allOrders.length, // can filter client-side later if needed
          orders: allOrders,
          filter,
        });

        // Stop if last page
        if (data.result.orders.length < LIMIT) break;
        page++;
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [customerName]);

  // --- Map orders for display ---
  const mappedOrders: NetoOrderSummary[] = useMemo(() => {
    if (!result?.orders) return [];

    return result.orders.map((o: NetoOrder) => {
      const payment = Array.isArray(o.OrderPayment) && o.OrderPayment.length > 0 ? o.OrderPayment[0] : null;
      return {
        orderNumber: o.OrderID,
        firstName: o.BillFirstName || o.ShipFirstName || "",
        lastName: o.BillLastName || o.ShipLastName || "",
        email: o.Email || "",
        paymentMethod: payment?.PaymentType || o.DefaultPaymentType || "—",
        paymentAmount: payment?.Amount || o.GrandTotal || "—",
        phoneNumber: o.ShipPhone || o.BillPhone || "—",
        datePlaced: o.DatePlaced,
        orderStatus: o.OrderStatus,
        grandTotal: o.GrandTotal,
        salesChannel: o.SalesChannel,
        itemCount: o.itemsCount || 0,
      };
    });
  }, [result]);

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">ADC Active Order Lookup</h1>
        <p className="text-slate-600 mt-1">Search Neto orders using the customer's full or partial name.</p>

        {/* Search box */}
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <label className="text-sm font-semibold text-slate-800">Customer Name</label>
          <div className="mt-2 flex gap-3">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSearch && onSearch()}
              placeholder="e.g. Juan Dela Cruz"
              className="flex-1 rounded-xl border px-4 py-3 text-slate-600"
            />
            <button
              disabled={!canSearch}
              onClick={onSearch}
              className={`rounded-xl px-6 py-3 font-semibold text-white ${!canSearch ? "bg-slate-300 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"}`}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
          {error && <div className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
        </div>

        {/* Orders list */}
        {result && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {result.filter.customerName ? `Orders for "${result.filter.customerName}"` : "All Orders"}
              </h2>
              <p className="text-sm text-slate-600">
                Showing {result.totalFiltered} of {result.totalFetched} orders
              </p>
            </div>

            {mappedOrders.length === 0 && (
              <div className="rounded-2xl border bg-slate-50 p-8 text-center">
                <p className="text-slate-600">No orders found for "{result.filter.customerName}"</p>
                <p className="text-sm text-slate-500 mt-2">Try a different name or check the date range</p>
              </div>
            )}

            {mappedOrders.map((order) => (
              <div key={order.orderNumber} onClick={() => handleOrderClick(order)}>
                <OrderCard order={order} />
              </div>
            ))}

            {/* Loading placeholder for incremental batches */}
            {loading && (
              <div className="text-center text-slate-500 py-4">
                Loading more orders…
              </div>
            )}
          </div>
        )}
      </div>

      <AdcModal
        open={modalOpen}
        orderKey={selectedOrderKey}
        onClose={() => {
          setModalOpen(false);
          setSelectedOrderKey(null);
        }}
      />
    </div>
  );
}
