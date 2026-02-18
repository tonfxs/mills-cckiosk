"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import AdcCurrentModal from "@/app/components/(admin)/AdcCurrentModal";

type AdcRow = {
  date: string;
  age: string;
  collected: string;
  orderNumber: string;
  externalSku: string;
  name: string;
  itemName: string;
  orderDetails: string;
  salesChannel: string;
  location: string;
  notes: string;
};

type ApiResponse = {
  items: AdcRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statuses: string[];
};

async function fetchAdc(params: {
  q: string;
  status: string;
  page: number;
  pageSize: number;
  signal?: AbortSignal;
}): Promise<ApiResponse> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  sp.set("page", String(params.page));
  sp.set("pageSize", String(params.pageSize));

  const res = await fetch(`/api/admin/adc-datatable?${sp.toString()}`, {
    cache: "no-store",
    signal: params.signal,
  });

  const text = await res.text();
  let json: any;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`API returned non-JSON: ${text.slice(0, 200)}`);
  }

  if (!res.ok || !json?.success) {
    throw new Error(json?.error || "Failed to load ADC data");
  }

  return json.data as ApiResponse;
}

export default function AdcClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState<ApiResponse>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
    totalPages: 1,
    statuses: [],
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedRow, setSelectedRow] = useState<AdcRow | null>(null);

  const handleSave = (modalData: any) => {
    console.log("Saved order:", selectedOrder, modalData);
  };

  const abortRef = useRef<AbortController | null>(null);

  const load = async (next?: Partial<{ page: number }>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setError("");
      setLoading(true);

      const d = await fetchAdc({
        q,
        status,
        page: next?.page ?? page,
        pageSize,
        signal: controller.signal,
      });

      setData(d);
      setPage(d.page);
    } catch (e: any) {
      if (String(e?.name || "").includes("Abort")) return;
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load({ page: 1 });
  }, [q, status, pageSize]);

  const sydneyTime = useMemo(() => {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              ADC Completed List
            </h1>
            <p className="text-sm text-gray-500">Sydney time: {sydneyTime}</p>
          </div>

          <button
            onClick={() => load()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (Order #, SKU, name, item, channel, location...)"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm outline-none"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm outline-none"
          >
            <option value="">All statuses</option>
            {data.statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm outline-none"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 table-fixed text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3 w-[120px]">Date</th>
                <th className="px-4 py-3 w-[60px]">Age</th>
                <th className="px-4 py-3 w-[100px]">Collected?</th>
                <th className="px-4 py-3 w-[140px]">Order #</th>
                <th className="px-4 py-3 w-[120px]">SKU</th>
                <th className="px-4 py-3 w-[140px]">Name</th>
                <th className="px-4 py-3 w-[140px]">Item</th>
                <th className="px-4 py-3 w-[200px]">Order Details</th>
                <th className="px-4 py-3 w-[120px]">Channel</th>
                <th className="px-4 py-3 w-[120px]">Location</th>
                <th className="px-4 py-3 w-[120px]">Notes</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-gray-500">
                    No results found
                  </td>
                </tr>
              ) : (
                data.items.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 border cursor-pointer"
                    onClick={() => {
                      setSelectedRow(row);
                      setSelectedOrder(row.orderNumber);
                      setModalOpen(true);
                    }}
                  >
                    <td className="px-4 py-3 text-gray-900">{row.date || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{row.age || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          String(row.collected).toLowerCase() === "yes"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.collected || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.orderNumber || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{row.externalSku || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{row.name || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{row.itemName || "-"}</td>
                    <td className="px-4 py-3 text-gray-900 break-words">{row.orderDetails || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{row.salesChannel || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{row.location || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{row.notes || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">
            Page {data.page} of {data.totalPages} • {data.total} total
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={data.page <= 1}
              onClick={() => load({ page: data.page - 1 })}
              className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40 border-slate-400"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>

            <button
              disabled={data.page >= data.totalPages}
              onClick={() => load({ page: data.page + 1 })}
              className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40 border-slate-400"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      <AdcCurrentModal
        open={modalOpen}
        orderNumber={selectedOrder}
        rowData={selectedRow}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}