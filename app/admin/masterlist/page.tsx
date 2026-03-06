'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import StatusPill from '@/app/components/(admin)/StatusPill';
import { OrderDetailsModal } from '@/app/components/(admin)/OrderDetailsModal';

type MasterRow = {
  timestamp: string;
  fullName: string;
  phone: string;
  orderID: string;
  rmaID: string;
  carParkBay: string;
  status: string;
  agent: string;
  type: string;
};

type ApiResponse = {
  items: MasterRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statuses: string[];
};

async function fetchMasterlist(params: {
  type?: string;
  q: string;
  status: string;
  page: number;
  pageSize: number;
  signal?: AbortSignal;
}): Promise<ApiResponse> {
  const sp = new URLSearchParams();

  if (params.type) sp.set('type', params.type);
  if (params.q) sp.set('q', params.q);
  if (params.status) sp.set('status', params.status);

  sp.set('page', String(params.page));
  sp.set('pageSize', String(params.pageSize));

  const res = await fetch(`/api/admin/masterlist-datatable?${sp.toString()}`, {
    cache: 'no-store',
    signal: params.signal,
  });

  const json = await res.json();

  if (!res.ok) {
  throw new Error(`API Error: ${res.status}`);
}

const contentType = res.headers.get('content-type');
if (!contentType?.includes('application/json')) {
  const text = await res.text();
  console.error('Non-JSON response:', text);
  throw new Error('API did not return JSON');
}

  return json.data;
}

export default function MasterlistClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

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

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<MasterRow | null>(null);

  const load = async (next?: Partial<{ page: number }>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError('');

      const d = await fetchMasterlist({
        type,
        q,
        status,
        page: next?.page ?? page,
        pageSize,
        signal: controller.signal,
      });

      setData(d);
      if (next?.page) setPage(next.page);
    } catch (e: any) {
      if (String(e?.name || '').includes('Abort')) return;
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line
  }, [type, status, pageSize]);

  const sydneyTime = useMemo(
    () =>
      new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Sydney',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date()),
    []
  );

  const openDetails = (row: MasterRow) => {
    const key = (row.orderID || row.rmaID || '').trim();
    if (!key) return setError('Missing order reference.');
    setSelectedKey(key);
    setSelectedRowData(row);
  };

  const closeModal = () => {
    setSelectedKey(null);
    setSelectedRowData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                MASTERLIST - Pickups & Returns
              </h1>
              <p className="text-sm text-gray-500">
                Sydney time: {sydneyTime}
              </p>
            </div>

            <button
              onClick={() => load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => load({ page: 1 })}
              placeholder="Search (order #, RMA, name, phone...)"
              className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm border-slate-300 text-slate-600"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm border-slate-300 text-slate-600"
            >
              <option value="">All Types</option>
              <option value="pickup product">Pickup</option>
              <option value="return product">Return</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm border-slate-300 text-slate-600"
            >
              <option value="">All statuses</option>
              {(data.statuses ?? []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm border-slate-300 text-slate-600"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
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
        <div className="rounded-2xl border bg-white shadow-sm overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 ">
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Order / RMA</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Bay</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Agent</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-4 text-slate-600">
                    Loading…
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-4">
                    No records found.
                  </td>
                </tr>
              ) : (
                data.items.map((r, idx) => (
                  <tr
                    key={`${r.orderID || r.rmaID}-${idx}`}
                    className="border-t hover:bg-gray-50 cursor-pointer "
                    onClick={() => openDetails(r)}
                  >
                    <td className="px-5 py-3 text-slate-600">{r.timestamp}</td>
                    <td className="px-5 py-3 capitalize text-slate-600">{r.type}</td>
                    <td className="px-5 py-3 font-medium text-slate-600">
                      {r.orderID || r.rmaID}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{r.fullName}</td>
                    <td className="px-5 py-3 text-slate-600">{r.phone}</td>
                    <td className="px-5 py-3 text-slate-600">{r.carParkBay}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-600">{r.agent || '—'}</td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetails(r);
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 text-slate-600"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-gray-600">
              Showing {data.items.length} of {data.total}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => load({ page: Math.max(1, page - 1) })}
                disabled={page <= 1}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm disabled:opacity-50 text-slate-600"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
                Prev
              </button>

              <div className="text-sm text-slate-600">
                Page {data.page} of {data.totalPages}
              </div>

              <button
                onClick={() =>
                  load({ page: Math.min(data.totalPages, page + 1) })
                }
                disabled={page >= data.totalPages}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm disabled:opacity-50 text-slate-600"
              >
                Next
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <OrderDetailsModal
        open={!!selectedKey}
        orderKey={selectedKey}
        rowData={selectedRowData}
        onClose={closeModal}
        onRefresh={() => load()}
      />

        {/* {selectedRow?.type?.toLowerCase() === 'pickup product' && (
          <OrderDetailsModal
            open={true}
            rowData={selectedRow}
            onClose={closeModal}
            onRefresh={load}
          />
        )}

        {selectedRow?.type?.toLowerCase() === 'return product' && (
          <ReturnDetailsModal
            open={true}
            rowData={selectedRow}
            onClose={closeModal}
            onRefresh={load}
          />
        )} */}
    </div>
  );
}