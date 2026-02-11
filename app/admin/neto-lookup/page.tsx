"use client";

import { useMemo, useState } from "react";

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
  customerFullName?: string; // Added by backend
  itemsCount?: number; // Added by backend
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

  const canSearch = useMemo(
    () => customerName.trim().length >= 3 && !loading,
    [customerName, loading]
  );

  async function onSearch() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        customerName: customerName.trim(),
      };

      console.log("Sending payload to /api/neto/customer-orders:", payload);

      const res = await fetch("/api/neto/customer-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Lookup failed");
      }

      console.log("API Response:", data);

      setResult(data.result);
    } catch (err: any) {
      console.error("Lookup error:", err);
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Map Neto orders to display format
  const mappedOrders: NetoOrderSummary[] = useMemo(() => {
    if (!result?.orders) return [];

    return result.orders.map((o: NetoOrder) => {
      // Get payment info from OrderPayment array
      const payment = Array.isArray(o.OrderPayment) && o.OrderPayment.length > 0
        ? o.OrderPayment[0]
        : null;

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
              onKeyDown={(e) => e.key === "Enter" && canSearch && onSearch()}
              placeholder="e.g. Juan Dela Cruz"
              className="flex-1 rounded-xl border px-4 py-3 text-slate-600"
            />

            <button
              disabled={!canSearch}
              onClick={onSearch}
              className={`rounded-xl px-6 py-3 font-semibold text-white ${!canSearch
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {result.filter.customerName
                  ? `Orders for "${result.filter.customerName}"`
                  : "All Orders"}
              </h2>
              <p className="text-sm text-slate-600">
                Showing {result.totalFiltered} of {result.totalFetched} orders
              </p>
            </div>

            {mappedOrders.length === 0 && (
              <div className="rounded-2xl border bg-slate-50 p-8 text-center">
                <p className="text-slate-600">
                  No orders found for "{result.filter.customerName}"
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Try a different name or check the date range
                </p>
              </div>
            )}

            {mappedOrders.map((order) => (
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
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">Order #{order.orderNumber}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {order.salesChannel && (
              <span className="inline-block bg-slate-100 px-2 py-1 rounded text-xs font-semibold mr-2">
                {order.salesChannel}
              </span>
            )}
            {(order.itemCount ?? 0) > 0 && (
              <span className="text-xs text-slate-600">
                {order.itemCount ?? 0} item{(order.itemCount ?? 0) !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${order.orderStatus === "Dispatched"
            ? "bg-green-100 text-green-700"
            : order.orderStatus === "Pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-slate-100 text-slate-700"
          }`}>
          {order.orderStatus || "—"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <KeyValue k="Customer" v={`${order.firstName} ${order.lastName}`.trim() || "—"} />
        <KeyValue k="Email" v={order.email} />
        <KeyValue k="Payment Method" v={order.paymentMethod} />
        <KeyValue k="Amount" v={order.paymentAmount ? `$${order.paymentAmount}` : "—"} />
        <KeyValue k="Phone" v={order.phoneNumber} />
        <KeyValue
          k="Date Placed"
          v={order.datePlaced ? new Date(order.datePlaced).toLocaleDateString() : "—"}
        />
      </div>
    </div>
  );
}

function KeyValue({ k, v }: { k: string; v?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{k}</p>
      <p className="text-sm font-semibold text-slate-900 mt-1">{v || "—"}</p>
    </div>
  );
}