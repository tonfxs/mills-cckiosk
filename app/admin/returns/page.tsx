'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import StatusPill from "@/app/components/(admin)/StatusPill";
import { RmaDetailsModal } from "@/app/components/(admin)/ReturnsDetailsModal";

type ReturnRow = {
  timestamp: string;
  fullName: string;
  phone: string;
  rmaID: string;
  carParkBay: string;
  status: string;
  agent: string;
  type: string;
};

type ApiResponse = {
  items: ReturnRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statuses: string[];
};

async function fetchReturns(params: {
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

  const res = await fetch(`/api/admin/returns-datatable?${sp.toString()}`, {
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

  if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to load returns");

  return json.data as ApiResponse;
}

export default function ReturnsClient() {
  const [firstLoad, setFirstLoad] = useState(true);
  const [loading, setLoading] = useState(false);
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

  const abortRef = useRef<AbortController | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRma, setSelectedRma] = useState<{
    rmaKey: string;
    orderNumber: string;
    k1Status: string;
    agent: string;
  } | null>(null);

  const load = async (
    next?: Partial<{ page: number }>,
    background = false
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (!background) setLoading(true);
      setError("");

      const d = await fetchReturns({
        q,
        status,
        page: next?.page ?? page,
        pageSize,
        signal: controller.signal,
      });

      setData(d);
      if (next?.page) setPage(next.page);
    } catch (e: any) {
      if (String(e?.name || "").includes("Abort")) return;
      setError(e?.message || "Failed to load");
    } finally {
      if (!background) setLoading(false);
    }
  };

  // ------------------- SSE -------------------
  useEffect(() => {
    const es = new EventSource("/api/admin/returns-stream");

    es.onmessage = (event) => {
      const d = JSON.parse(event.data);
      setData(d);
      if (firstLoad) setFirstLoad(false);
    };

    es.onerror = () => console.log("Returns SSE disconnected");

    return () => es.close();
  }, [firstLoad]);

  // ------------------- modal sync -------------------
  useEffect(() => {
    if (modalOpen && selectedRma) {
      const updatedRow = data.items.find((r) => r.rmaID === selectedRma.rmaKey);
      if (updatedRow) {
        setSelectedRma((prev) =>
          prev
            ? { ...prev, k1Status: updatedRow.status, agent: updatedRow.agent || "—" }
            : prev
        );
      }
    }
  }, [data, modalOpen, selectedRma]);

  const sydneyTime = useMemo(
    () =>
      new Intl.DateTimeFormat("en-AU", {
        timeZone: "Australia/Sydney",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date()),
    []
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Return Orders</h1>
              <p className="text-sm text-gray-500">Sydney time: {sydneyTime}</p>
            </div>
            <button
              onClick={() => load()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search (RMA, name, phone, bay, status...)"
              className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm outline-none border-slate-300 text-slate-600"
              onBlur={() => load({ page: 1 })}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm outline-none border-slate-300 text-slate-600"
              onBlur={() => load({ page: 1 })}
            >
              <option value="">All statuses</option>
              {data.statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm outline-none border-slate-300 text-slate-600"
              onBlur={() => load({ page: 1 })}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              {firstLoad ? "Loading…" : `Showing ${data.items.length} of ${data.total} return orders (live)`}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => load({ page: Math.max(1, page - 1) })}
                disabled={firstLoad || page <= 1}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>

              <div className="text-sm text-gray-600">
                Page <span className="font-medium text-gray-900">{data.page}</span> of{" "}
                <span className="font-medium text-gray-900">{data.totalPages}</span>
              </div>

              <button
                onClick={() => load({ page: Math.min(data.totalPages, page + 1) })}
                disabled={firstLoad || page >= data.totalPages}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">RMA ID</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Bay</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Agent</th>
                </tr>
              </thead>

              <tbody>
                {firstLoad ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-4 text-gray-500">Loading…</td>
                  </tr>
                ) : data.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-4 text-gray-500">No return orders found.</td>
                  </tr>
                ) : (
                  data.items.map((r, idx) => (
                    <tr key={`${r.rmaID}-${idx}`} className="border-t hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700">{r.timestamp}</td>
                      <td
                        className="px-5 py-3 font-medium text-gray-900 cursor-pointer hover:underline"
                        onClick={() => {
                          setSelectedRma({
                            rmaKey: r.rmaID,
                            orderNumber: r.rmaID,
                            k1Status: r.status,
                            agent: r.agent || "—"
                          });
                          setModalOpen(true);
                        }}
                      >
                        {r.rmaID}
                      </td>
                      <td className="px-5 py-3 text-gray-700">{r.fullName}</td>
                      <td className="px-5 py-3 text-gray-700">{r.phone}</td>
                      <td className="px-5 py-3 text-gray-700">{r.carParkBay}</td>
                      <td className="px-5 py-3"><StatusPill status={r.status} /></td>
                      <td className="px-5 py-3 text-gray-700">{r.agent || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && selectedRma && (
        <RmaDetailsModal
          open={modalOpen}
          rmaKey={selectedRma.rmaKey}
          orderNumber={selectedRma.orderNumber}
          initialK1Status={selectedRma.k1Status}
          initialAgent={selectedRma.agent}
          onClose={() => setModalOpen(false)}
          onRefresh={() => load()}
        />
      )}
    </div>
  );
}
