"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import OrderCard from "../../components/(admin)/OrderCard";
import AdcModal from "../../components/(admin)/AdcModal";
import OrderCardSkeleton from "../../components/(admin)/OrderCardSkeleton";

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

  // Use a ref to store the AbortController so we can access it across renders
  const abortControllerRef = useRef<AbortController | null>(null);

  const canSearch = useMemo(() => customerName.trim().length >= 3 && !loading, [customerName, loading]);

  const handleOrderClick = useCallback((order: NetoOrderSummary) => {
    setSelectedOrderKey(order.orderNumber);
    setModalOpen(true);
  }, []);

  const onCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setProgress("Search cancelled.");
    }
  }, []);

  const [progress, setProgress] = useState("");

  const onSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("Initializing...");

    // Create a new AbortController for this specific search session
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);
      const filterConfig = {
        customerName: customerName.trim(),
        dateFrom: dateFrom.toISOString().slice(0, 10),
        dateTo: new Date().toISOString().slice(0, 10),
      };

      const LIMIT = 100;
      const MAX_PAGES = 20;
      let allOrders: NetoOrder[] = [];
      let page = 1;

      while (page <= MAX_PAGES) {
        // Check if we were aborted before starting a new fetch
        if (controller.signal.aborted) break;

        setProgress(`Fetching page ${page}...`);

        const payload = {
          customerName: filterConfig.customerName,
          page,
          limit: LIMIT,
        };

        const res = await fetch("/api/neto/customer-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal, // Pass the signal to the fetch request
        });

        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Lookup failed");

        allOrders = [...allOrders, ...data.result.orders];

        setResult({
          totalFetched: allOrders.length,
          totalFiltered: allOrders.length,
          orders: allOrders,
          filter: filterConfig,
        });

        if (data.result.orders.length < LIMIT) break;
        page++;
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Search aborted by user");
      } else {
        console.error(err);
        setError(err?.message || "Something went wrong.");
      }
    } finally {
      // Only set loading to false if this was the active controller
      if (abortControllerRef.current === controller) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [customerName]);

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

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <label className="text-sm font-semibold text-slate-800">Customer Name</label>
          <div className="mt-2 flex gap-3">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSearch && onSearch()}
              placeholder="e.g. Juan Dela Cruz"
              disabled={loading}
              className="flex-1 rounded-xl border px-4 py-3 text-slate-600 outline-none focus:ring-2 focus:ring-slate-900/5 transition-all disabled:bg-slate-50"
            />

            {loading ? (
              <button
                onClick={onCancel}
                className="rounded-xl px-6 py-3 font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200"
              >
                Cancel
              </button>
            ) : (
              <button
                disabled={!canSearch}
                onClick={onSearch}
                className={`rounded-xl px-6 py-3 font-semibold text-white transition-colors ${!canSearch ? "bg-slate-300 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"
                  }`}
              >
                Search
              </button>
            )}
          </div>
          {loading && <p className="mt-2 text-xs text-slate-400 italic animate-pulse">{progress}</p>}
          {error && <div className="mt-4 rounded-xl bg-red-50 p-4 text-red-700 text-sm border border-red-100">{error}</div>}
        </div>

        {(result || loading) && (
          <div className="mt-8 space-y-4">
            {result && (
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {result.filter.customerName ? `Orders for "${result.filter.customerName}"` : "All Orders"}
                </h2>
                <div className="flex items-center gap-3">
                  {loading && <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />}
                  <p className="text-sm text-slate-600">Found {result.totalFiltered} orders</p>
                </div>
              </div>
            )}

            {mappedOrders.map((order) => (
              <div
                key={order.orderNumber}
                onClick={() => handleOrderClick(order)}
                className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <OrderCard order={order} />
              </div>
            ))}

            {loading && (
              <>
                {mappedOrders.length === 0 ? (
                  <>
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                  </>
                ) : (
                  <OrderCardSkeleton />
                )}
              </>
            )}

            {!loading && result && mappedOrders.length === 0 && (
              <div className="rounded-2xl border bg-slate-50 p-8 text-center">
                <p className="text-slate-600 font-medium">No orders found for "{result.filter.customerName}"</p>
                <p className="text-sm text-slate-500 mt-1">Try a different name or broaden your search.</p>
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
