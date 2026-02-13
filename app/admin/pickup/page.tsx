'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import StatusPill from "@/app/components/(admin)/StatusPill";
import { OrderDetailsModal } from "@/app/components/(admin)/OrderDetailsModal";
import type { PickupRow } from "@/app/types/pickup";


// export type PickupRow = {
//   timestamp: string;
//   fullName: string;
//   phone: string;

//   // kiosk ref (e.g. E9703418)
//   orderNumber: string;

//   creditCard: string;
//   validId: string;
//   paymentMethod: string;
//   carParkBay: string;
//   status: string;
//   agent: string;
//   type: string;

//   // From MASTER LIST L/M if you updated datatable route to A:M
//   notes?: string;
//   netoOrderId?: string; // ✅ may be blank for older rows
// };

type ApiResponse = {
  items: PickupRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statuses: string[];
};

async function fetchPickups(params: {
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

  const res = await fetch(`/api/admin/pickups-datatable?${sp.toString()}`, {
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
    throw new Error(json?.error || "Failed to load pickups");
  }

  return json.data as ApiResponse;
}

export default function PickupOrdersClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

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

  // ✅ modal state: store both the key and the full row data
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<PickupRow | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const refreshOrders = () => {
    load();
  };

  // const load = async (next?: Partial<{ page: number }>) => {
  //   abortRef.current?.abort();
  //   const controller = new AbortController();
  //   abortRef.current = controller;

  //   try {
  //     setError("");
  //     setLoading(true);

  //     const d = await fetchPickups({
  //       q,
  //       status,
  //       page: next?.page ?? page,
  //       pageSize,
  //       signal: controller.signal,
  //     });

  //     setData(d);
  //     setPage(d.page);
  //   } catch (e: any) {
  //     if (String(e?.name || "").includes("Abort")) return;
  //     setError(e?.message || "Failed to load");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   setPage(1);
  //   load({ page: 1 });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [q, status, pageSize]);

  // useEffect(() => {
  // // Initial load whenever filters change
  // setPage(1);
  // load({ page: 1 });

  // // Set up polling
  // const interval = setInterval(() => {
  //   // Only auto-refresh if modal is not open
  //   if (!selectedKey) {
  //     load({ page });
  //   }
  // }, 5000); // 5 seconds, adjust as needed

  // return () => clearInterval(interval);
  // }, [q, status, pageSize, page, selectedKey]); // re-run if filters, page, or modal state changes

  // // Keep modal data in sync with table updates
  // useEffect(() => {
  //   if (selectedKey && selectedRowData) {
  //     const updatedRow = data.items.find(
  //       (r) => (r.netoOrderId || r.orderNumber) === selectedKey
  //     );
  //     if (updatedRow) {
  //       setSelectedRowData((prev) => ({
  //         ...prev,
  //         ...updatedRow, // merge latest changes
  //       }));
  //     }
  //   }
  // }, [data, selectedKey]);

  // ------------------- load function -------------------
const load = async (next?: Partial<{ page: number }>, background = false) => {
  // Abort any previous request
  abortRef.current?.abort();
  const controller = new AbortController();
  abortRef.current = controller;

  try {
    if (!background) setLoading(true); // show spinner only for manual loads
    setError("");

    const d = await fetchPickups({
      q,
      status,
      page: next?.page ?? page,
      pageSize,
      signal: controller.signal,
    });

    setData(d);
    setPage(d.page);
  } catch (e: any) {
    // ignore aborted requests
    if (String(e?.name || "").includes("Abort")) return;
    setError(e?.message || "Failed to load");
  } finally {
    if (!background) setLoading(false);
  }
};

// ------------------- polling useEffect -------------------
useEffect(() => {
  let isMounted = true;

  const poll = async () => {
    if (!selectedKey && isMounted) { // don't poll while modal is open
      try {
        await load({ page }, true); // background = true
      } catch (e) {
        console.error("Background polling error:", e);
      }
    }
  };

  // initial load
  poll();

  // start interval
  const interval = setInterval(poll, 5000); // every 5s, adjust as needed

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, [page, q, status, pageSize, selectedKey]);

// ------------------- sync modal data with table -------------------
useEffect(() => {
  if (selectedKey && selectedRowData) {
    const updatedRow = data.items.find(
      (r) => (r.netoOrderId || r.orderNumber) === selectedKey
    );
    if (updatedRow) {
      setSelectedRowData((prev) => ({
        ...prev,
        ...updatedRow, // merge latest changes from table
      }));
    }
  }
}, [data, selectedKey]);



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

  function openDetails(row: PickupRow) {
    // ✅ If we have NetoOrderID use it, otherwise fallback to kiosk ref
    const key = (row.netoOrderId?.trim() || row.orderNumber?.trim() || "").trim();
    if (!key) {
      setError("Missing order reference.");
      return;
    }
    setSelectedKey(key);
    setSelectedRowData(row); // ✅ Store the entire row for comparison
  }

  function closeModal() {
    setSelectedKey(null);
    setSelectedRowData(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Pickup Orders</h1>
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

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search (order #, name, phone, bay, status...)"
              className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm outline-none border border-slate-300 text-slate-600"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm outline-none border border-slate-300 text-slate-600"
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
              className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm outline-none border border-slate-300 text-slate-600"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              {loading ? "Loading…" : `Showing ${data.items.length} of ${data.total} pickup orders`}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => load({ page: Math.max(1, page - 1) })}
                disabled={loading || page <= 1}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              <div className="text-sm text-gray-600">
                Page <span className="font-medium text-gray-900">{data.page}</span> of{" "}
                <span className="font-medium text-gray-900">{data.totalPages}</span>
              </div>

              <button
                onClick={() => load({ page: Math.min(data.totalPages, page + 1) })}
                disabled={loading || page >= data.totalPages}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1150px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Order #</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium">Bay</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Agent</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-5 py-4 text-gray-500" colSpan={9}>
                      Loading…
                    </td>
                  </tr>
                ) : data.items.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-gray-500" colSpan={9}>
                      No pickup orders found.
                    </td>
                  </tr>
                ) : (
                  data.items.map((r, idx) => (
                    <tr
                      key={`${r.orderNumber}-${idx}`}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => openDetails(r)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openDetails(r);
                      }}
                    >
                      <td className="px-5 py-3 text-gray-700">{r.timestamp}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{r.orderNumber}</td>
                      <td className="px-5 py-3 text-gray-700">{r.fullName}</td>
                      <td className="px-5 py-3 text-gray-700">{r.phone}</td>
                      <td className="px-5 py-3 text-gray-700">{r.paymentMethod}</td>
                      <td className="px-5 py-3 text-gray-700">{r.carParkBay}</td>
                      <td className="px-5 py-3">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="px-5 py-3 text-gray-700">{r.agent || "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetails(r);
                          }}
                          className="rounded-xl border px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ✅ Pass both orderKey and rowData to the modal */}
      <OrderDetailsModal
        open={!!selectedKey}
        orderKey={selectedKey}
        rowData={selectedRowData}
        onClose={closeModal}
        onRefresh={refreshOrders}
        onPatchRow={(patch) => {
          setSelectedRowData((prev) =>
            prev ? { ...prev, ...patch } : prev
          );
        }}
      />
    </div>
  );
}