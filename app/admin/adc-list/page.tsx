"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, RefreshCw, MoveRight, X,
  Users, Package, ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react";
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

// ── Grouping types ─────────────────────────────────────────────────────────────
type CustomerGroup = {
  name: string;
  rows: AdcRow[];
  /** Shared bay number for all orders in this group */
  bayNumber: string;
  collapsed: boolean;
};

const AGENTS = ["KB", "CC", "JB", "SA"] as const;

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
  try { json = JSON.parse(text); } catch {
    throw new Error(`API returned non-JSON: ${text.slice(0, 200)}`);
  }
  if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to load ADC data");
  return json.data as ApiResponse;
}

// ── Grouped Review Panel ───────────────────────────────────────────────────────
function GroupedReviewPanel({
  groups,
  onGroupsChange,
  agent,
  onAgentChange,
  status,
  onStatusChange,
  onProceed,
  onCancel,
  moving,
}: {
  groups: CustomerGroup[];
  onGroupsChange: (groups: CustomerGroup[]) => void;
  agent: string;
  onAgentChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  onProceed: () => void;
  onCancel: () => void;
  moving: boolean;
}) {
  const totalOrders = groups.reduce((sum, g) => sum + g.rows.length, 0);
  const groupedCount = groups.filter((g) => g.rows.length > 1).length;
  const allBaysFilled = groups.every((g) => g.bayNumber.trim() !== "");

  const updateBay = (name: string, bay: string) => {
    onGroupsChange(groups.map((g) => g.name === name ? { ...g, bayNumber: bay } : g));
  };

  const toggleCollapse = (name: string) => {
    onGroupsChange(groups.map((g) => g.name === name ? { ...g, collapsed: !g.collapsed } : g));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 shrink-0">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Review Bulk Move</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalOrders} orders · {groups.length} customer{groups.length !== 1 ? "s" : ""}
                {groupedCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-medium px-1.5 py-0.5 rounded-full border border-blue-100">
                    {groupedCount} grouped
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grouping notice */}
        {groupedCount > 0 && (
          <div className="mx-6 mt-4 shrink-0 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Orders from the same customer have been grouped together. They&apos;ll share one bay number — enter it once per group below.
            </span>
          </div>
        )}

        {/* Groups list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {groups.map((group) => {
            const isGrouped = group.rows.length > 1;
            return (
              <div
                key={group.name}
                className={`rounded-xl border transition-colors ${isGrouped
                    ? "border-blue-200 bg-blue-50/40"
                    : "border-gray-200 bg-white"
                  }`}
              >
                {/* Group header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Avatar */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${isGrouped ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}>
                    {group.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + order count */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{group.name}</p>
                      {isGrouped && (
                        <span className="shrink-0 inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          <Package className="h-3 w-3" />
                          {group.rows.length} orders
                        </span>
                      )}
                    </div>
                    {/* Order numbers preview */}
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {group.rows.map((r) => r.orderNumber).join(" · ")}
                    </p>
                  </div>

                  {/* Bay number input */}
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Bay #</label>
                    <input
                      type="text"
                      value={group.bayNumber}
                      onChange={(e) => updateBay(group.name, e.target.value)}
                      placeholder="—"
                      className={`w-20 text-xs text-center rounded-lg border px-2 py-1.5 outline-none transition-colors font-mono ${group.bayNumber.trim()
                          ? "border-gray-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                          : "border-orange-300 bg-orange-50 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 placeholder-orange-300"
                        }`}
                    />
                  </div>

                  {/* Collapse toggle for grouped */}
                  {isGrouped && (
                    <button
                      onClick={() => toggleCollapse(group.name)}
                      className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
                    >
                      {group.collapsed
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronUp className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                {/* Expanded order list (grouped only) */}
                {isGrouped && !group.collapsed && (
                  <div className="border-t border-blue-100 mx-4 mb-3">
                    <div className="pt-2 space-y-1">
                      {group.rows.map((row) => (
                        <div
                          key={row.orderNumber}
                          className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <span className="text-xs font-mono font-medium text-blue-600 w-[120px] shrink-0">
                            {row.orderNumber}
                          </span>
                          <span className="text-xs text-gray-500 truncate flex-1">
                            {row.itemName || row.externalSku || "—"}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">{row.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 space-y-3">
          {/* Agent + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Agent</label>
              <select
                value={agent}
                onChange={(e) => onAgentChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Not yet">Not yet</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            {!allBaysFilled && (
              <p className="text-xs text-orange-600 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Fill in all bay numbers to continue
              </p>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={onCancel}
                disabled={moving}
                className="text-sm font-medium text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onProceed}
                disabled={!allBaysFilled || moving}
                className="inline-flex items-center gap-2 text-sm font-medium text-white bg-blue-600 rounded-xl px-5 py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {moving ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" />Moving…</>
                ) : (
                  <><MoveRight className="h-4 w-4" />Move {totalOrders} Orders</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdcClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState<ApiResponse>({
    items: [], total: 0, page: 1, pageSize: 25, totalPages: 1, statuses: [],
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedRow, setSelectedRow] = useState<AdcRow | null>(null);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Grouped review panel state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [reviewAgent, setReviewAgent] = useState("KB");
  const [reviewStatus, setReviewStatus] = useState("Completed");
  const [bulkMoving, setBulkMoving] = useState(false);
  const [bulkError, setBulkError] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  const load = async (next?: Partial<{ page: number }>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setError("");
      setLoading(true);
      const d = await fetchAdc({ q, status, page: next?.page ?? page, pageSize, signal: controller.signal });
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

  const allPageKeys = data.items.map((r) => r.orderNumber);
  const allSelected = allPageKeys.length > 0 && allPageKeys.every((k) => selectedKeys.has(k));

  const toggleRow = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allSelected) allPageKeys.forEach((k) => next.delete(k));
      else allPageKeys.forEach((k) => next.add(k));
      return next;
    });
  };

  // Build grouped structure from selected rows, then open review panel
  const openReview = () => {
    const selectedRows = data.items.filter((r) => selectedKeys.has(r.orderNumber));

    // Group by name (case-insensitive, trimmed)
    const map = new Map<string, AdcRow[]>();
    for (const row of selectedRows) {
      const key = row.name.trim().toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }

    const built: CustomerGroup[] = Array.from(map.entries()).map(([, rows]) => ({
      name: rows[0].name, // use original casing from first row
      rows,
      bayNumber: "",
      collapsed: false,
    }));

    setGroups(built);
    setReviewOpen(true);
  };

  // Execute the actual bulk move using bay numbers from groups
  const handleProceed = async () => {
    // Flatten groups back to a per-order bay map
    const bayMap: Record<string, string> = {};
    for (const group of groups) {
      for (const row of group.rows) {
        bayMap[row.orderNumber] = group.bayNumber;
      }
    }

    const timestamp = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(new Date());

    const rowsToMove = data.items.filter((r) => selectedKeys.has(r.orderNumber));
    const keysToRemove = new Set(rowsToMove.map((r) => r.orderNumber));

    setBulkMoving(true);
    setBulkError("");

    const results = await Promise.allSettled(
      rowsToMove.map(async (row) => {
        const bayNumber = bayMap[row.orderNumber] ?? "";

        const res = await fetch("/api/admin/adc-current-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...row,
            bayNumber,
            agent: reviewAgent,
            status: reviewStatus,
            timestamp,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);

        return fetch("/api/admin/adc-current-orders", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: row.orderNumber }),
        });
      })
    );

    setBulkMoving(false);
    const failed = results.filter((r) => r.status === "rejected").length;

    if (failed > 0) {
      setBulkError(`${failed} order${failed > 1 ? "s" : ""} failed to move. Refreshing...`);
      setReviewOpen(false);
      load();
    } else {
      setData((prev) => ({
        ...prev,
        items: prev.items.filter((r) => !keysToRemove.has(r.orderNumber)),
        total: Math.max(0, prev.total - keysToRemove.size),
      }));
      setReviewOpen(false);
    }
    setSelectedKeys(new Set());
  };

  const sydneyTime = useMemo(() => {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney", weekday: "short", year: "numeric", month: "short",
      day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).format(new Date());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Grouped Review Panel */}
      {reviewOpen && (
        <GroupedReviewPanel
          groups={groups}
          onGroupsChange={setGroups}
          agent={reviewAgent}
          onAgentChange={setReviewAgent}
          status={reviewStatus}
          onStatusChange={setReviewStatus}
          onProceed={handleProceed}
          onCancel={() => setReviewOpen(false)}
          moving={bulkMoving}
        />
      )}

      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ADC Completed List</h1>
            <p className="text-sm text-gray-500">Sydney time: {sydneyTime}</p>
          </div>

          <div className="flex items-center gap-2">
            {selectedKeys.size > 0 && (
              <button
                onClick={openReview}
                disabled={bulkMoving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
              >
                <MoveRight className="h-4 w-4" />
                {bulkMoving ? "Moving..." : `Move ${selectedKeys.size} Selected`}
              </button>
            )}
            <button
              onClick={() => load()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (Order #, SKU, name...)"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm outline-none"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm outline-none"
          >
            <option value="">All statuses</option>
            {data.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm outline-none"
          >
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
      </div>

      {bulkError && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex justify-between">
            {bulkError}
            <X className="h-4 w-4 cursor-pointer" onClick={() => setBulkError("")} />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 table-fixed text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3 w-[40px]">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
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
                <tr><td colSpan={12} className="px-4 py-10 text-center text-gray-500">Loading...</td></tr>
              ) : data.items.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-gray-500">No results found</td></tr>
              ) : (
                data.items.map((row, i) => (
                  <tr
                    key={row.orderNumber + i}
                    className={`hover:bg-gray-50 border cursor-pointer transition-colors ${selectedKeys.has(row.orderNumber) ? "bg-blue-50/50" : ""}`}
                    onClick={() => {
                      setSelectedRow(row);
                      setSelectedOrder(row.orderNumber);
                      setModalOpen(true);
                    }}
                  >
                    <td className="px-4 py-3" onClick={(e) => toggleRow(e, row.orderNumber)}>
                      <input type="checkbox" checked={selectedKeys.has(row.orderNumber)} readOnly className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3 text-gray-900">{row.date || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{row.age || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${String(row.collected).toLowerCase() === "yes" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {row.collected || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600 hover:underline">{row.orderNumber || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{row.externalSku || "-"}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{row.name || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{row.itemName || "-"}</td>
                    <td className="px-4 py-3 text-gray-900 break-words line-clamp-2">{row.orderDetails || "-"}</td>
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
          <p className="text-sm text-gray-600">Page {data.page} of {data.totalPages} • {data.total} total</p>
          <div className="flex items-center gap-2">
            <button disabled={data.page <= 1} onClick={() => load({ page: data.page - 1 })} className="rounded-lg border px-3 py-1 border-slate-400 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={data.page >= data.totalPages} onClick={() => load({ page: data.page + 1 })} className="rounded-lg border px-3 py-1 border-slate-400 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* Single order modal */}
      <AdcCurrentModal
        open={modalOpen}
        orderNumber={selectedOrder}
        rowData={selectedRow}
        onClose={() => setModalOpen(false)}
        onSave={() => { setModalOpen(false); load(); }}
      />
    </div>
  );
}