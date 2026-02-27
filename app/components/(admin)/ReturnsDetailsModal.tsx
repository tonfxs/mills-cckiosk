"use client";

import { useEffect, useMemo, useState } from "react";

type NetoRma = {
  RmaID?: string;
  RmaNumber?: string;
  RmaStatus?: string;
  K1Status?: string;
  Agent?: string;
  DateIssued?: string;
  DateUpdated?: string;
  DateApproved?: string;

  OriginalOrderID?: string;
  OriginalOrderNumber?: string;

  CustomerEmail?: string;
  CustomerFirstName?: string;
  CustomerLastName?: string;
  CustomerPhone?: string;

  RefundTotal?: string | number;
  RefundedTotal?: string | number;
  Refund?: Array<{
    PaymentMethodID?: string;
    PaymentMethodName?: string;
    DateIssued?: string;
    DateRefunded?: string;
    RefundStatus?: string;
  }>;

  ReturnReason?: string;
  InternalNotes?: string;

  RmaLine?: Array<{
    ItemNumber?: string;
    ProductName?: string;
    Quantity?: string | number;
    ReturnQty?: string | number;
    ReturnReason?: string;
    ItemStatus?: string;
    RefundSubtotal?: string | number;
    Tax?: string | number;
    TaxCode?: string;
    WarehouseID?: string;
    WarehouseName?: string;
    WarehouseReference?: string;
    ResolutionOutcome?: string;
    ItemStatusType?: string;
    ResolutionStatus?: string;
    ManufacturerClaims?: string;
    IsRestockIssued?: boolean;
  }>;
};

/* ================================
   Helpers
================================ */

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^0-9.\-]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function money(v: any): string {
  const n = toNumber(v);
  if (n === null) return "—";
  return n.toFixed(2);
}

/**
 * Logic for the RMA Status Pill colors
 */
function getStatusStyles(status?: string) {
  const s = status?.toLowerCase() || "";
  if (s.includes("approve") || s.includes("complete")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (s.includes("cancel") || s.includes("reject") || s.includes("closed")) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (s.includes("pending") || s.includes("active") || s.includes("open")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  return "bg-slate-50 text-slate-600 border-slate-200";
}

/* ================================
   Component
================================ */

export function RmaDetailsModal({
  open,
  rmaKey,
  orderNumber,
  initialK1Status,
  initialAgent,
  onClose,
  onRefresh
}: {
  open: boolean;
  rmaKey: string | null;
  orderNumber?: string;
  initialK1Status?: string;
  initialAgent?: string;
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rma, setRma] = useState<NetoRma | null>(null);
  const [items, setItems] = useState<any[]>([]);

  /* ================================
      Load RMA
  ================================ */

  useEffect(() => {
    if (!open || !rmaKey) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setRma(null);
      setItems([]);

      try {
        const res = await fetch(`/api/neto/rma/${encodeURIComponent(rmaKey?.trim() ?? "")}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Request failed: ${text}`);
        }

        const json = await res.json();
        if (!json?.success || !json?.data) {
          throw new Error(json?.error || "RMA not found");
        }

        const rmaData = json.data;

        // Fetch K1 Status and Agent from returns-datatable
        try {
          const sheetRes = await fetch(
            `/api/admin/returns-datatable?q=${encodeURIComponent(rmaKey?.trim() ?? "")}`,
            { cache: "no-store" }
          );

          if (sheetRes.ok) {
            const sheetJson = await sheetRes.json();
            if (sheetJson.success && sheetJson.data?.items?.length > 0) {
              const match = sheetJson.data.items.find(
                (item: any) => item.rmaID === rmaKey?.trim()
              );

              if (match) {
                rmaData.K1Status = match.status;
                rmaData.Agent = match.agent;
                rmaData.SheetOrderNumber = match.orderNumber;
              }
            }
          }
        } catch (sheetErr) {
          console.warn("Failed to fetch Google Sheet data:", sheetErr);
        }

        if (!cancelled) {
          setRma(rmaData);
          const rmaLines = rmaData.RmaLine || [];
          if (Array.isArray(rmaLines)) {
            const mappedItems = rmaLines.map((line: any) => ({
              SKU: line.SKU || line.ItemNumber || "—",
              ProductName: line.ProductName || "—",
              ReturnQty: line.Quantity || "—",
              Reason: line.ReturnReason || "—",
              Condition: line.ItemStatus || "—",
              RefundAmount: line.RefundSubtotal ?? 0,
              ResolutionOutcome: line.ResolutionOutcome || "—",
              ItemStatusType: line.ItemStatusType || "—",
              ResolutionStatus: line.ResolutionStatus || "—",
              ManufacturerClaims: line.ManufacturerClaims || "—",
            }));
            setItems(mappedItems);
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load RMA");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [open, rmaKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const customerName = useMemo(() => {
    return (
      `${rma?.CustomerFirstName ?? ""} ${rma?.CustomerLastName ?? ""}`.trim() ||
      "—"
    );
  }, [rma]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="absolute inset-x-0 top-8 mx-auto w-[min(1100px,calc(100%-2rem))]">
        <div className="rounded-2xl bg-white shadow-xl border overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800">
                  RMA Details
                </h2>
                {rma?.RmaStatus && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusStyles(rma.RmaStatus)}`}>
                    {rma.RmaStatus}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">
                Ref: <span className="font-mono text-slate-700">{rma?.RmaNumber ?? rmaKey}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <K1StatusDropdown
                rmaNumber={rma?.RmaNumber}
                currentStatus={rma?.K1Status ?? "—"}
                onUpdate={onRefresh ?? (() => { })}
              />

              <AgentDropdown
                orderNumber={orderNumber}
                rmaNumber={rma?.RmaNumber}
                currentAgent={rma?.Agent ?? "—"}
                onUpdate={onRefresh ?? (() => { })}
              />

              <button
                onClick={onClose}
                className="ml-2 rounded-xl border px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[78vh] overflow-auto p-6 space-y-8 bg-slate-50/30">
            {loading && (
              <div className="rounded-xl border bg-blue-50 p-4 text-sm text-blue-700 animate-pulse">
                Fetching RMA data from Neto...
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && rma && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* RMA Info */}
                  <Section title="RMA Information">
                    <Row label="RMA Number" value={rma.RmaNumber} />
                    <Row label="Original Order" value={rma.OriginalOrderNumber} />
                    <Row label="Date Issued" value={rma.DateIssued} />
                    <Row label="Last Updated" value={rma.DateUpdated} />
                  </Section>

                  {/* Customer */}
                  <Section title="Customer Details">
                    <Row label="Name" value={customerName} />
                    <Row label="Email" value={rma.CustomerEmail} />
                    <Row label="Phone" value={rma.CustomerPhone} />
                  </Section>

                  {/* Financials */}
                  <Section title="Refund Summary">
                    <Row
                      label="Total Refund"
                      value={`$${money(rma.RefundTotal)}`}
                      highlight
                    />
                    <Row
                      label="Actual Refunded"
                      value={`$${money(rma.RefundedTotal)}`}
                    />
                  </Section>
                </div>

                {/* Returned Items - Main Info */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                      Returned Items ({items.length})
                    </h3>
                  </div>

                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50/50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-4 py-3 text-left">SKU</th>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((i, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{i.SKU}</td>
                          <td className="px-4 py-3 text-slate-700">{i.ProductName}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{i.ReturnQty}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800">
                            ${money(i.RefundAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Item Processing Details */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                      Technical Processing Details
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50/50 text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left">SKU</th>
                          <th className="px-4 py-3 text-left">Reason</th>
                          <th className="px-4 py-3 text-left">Return Status</th>
                          <th className="px-4 py-3 text-left">Outcome</th>
                          <th className="px-4 py-3 text-left">Resolution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((i, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{i.SKU}</td>
                            <td className="px-4 py-3 text-slate-600">{i.Reason}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-600 border border-slate-200">
                                {i.Condition}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{i.ResolutionOutcome}</td>
                            <td className="px-4 py-3 text-slate-600">{i.ResolutionStatus}</td>
                          </tr>
                        ))}
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

/* ================================
   Small UI Components
================================ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 border-b pb-2">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${highlight ? "text-emerald-600" : "text-slate-800"}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

/* ================================
   K1 Status Dropdown
================================ */

function K1StatusDropdown({ rmaNumber, currentStatus, onUpdate }: { rmaNumber?: string; currentStatus: string; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { setStatus(currentStatus); }, [currentStatus]);

  const statuses = ["Item Received", "Proceed to Window", "Endorsed to WH", "Pending Verification"];

  async function update(newStatus: string) {
    if (!rmaNumber || newStatus === status || updating) return;
    setUpdating(true);
    setStatus(newStatus);
    setOpen(false);

    try {
      const res = await fetch("/api/admin/update-rma-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rmaNumber, status: newStatus })
      });
      if (!res.ok) throw new Error("Update failed");
      onUpdate();
    } catch (err) {
      setStatus(currentStatus);
      alert("Failed to update K1 status");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className="rounded-xl border px-4 py-2 text-sm font-semibold bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors"
      >
        K1: {status}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-xl z-50 py-1 overflow-hidden">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => update(s)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${s === status ? "font-bold text-blue-600 bg-blue-50/50" : "text-slate-600"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ================================
   Agent Dropdown
================================ */

function AgentDropdown({ orderNumber, rmaNumber, currentAgent, onUpdate }: { orderNumber?: string; rmaNumber?: string; currentAgent: string; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState(currentAgent);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { setAgent(currentAgent); }, [currentAgent]);

  const agents = ["JB", "KB", "CC"];

  async function update(newAgent: string) {
    const identifier = orderNumber || rmaNumber;
    if (!identifier || newAgent === agent || updating) return;
    setUpdating(true);
    setAgent(newAgent);
    setOpen(false);

    try {
      const res = await fetch("/api/admin/assign-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, rmaNumber, agent: newAgent })
      });
      if (!res.ok) throw new Error("Update failed");
      onUpdate();
    } catch (err) {
      setAgent(currentAgent);
      alert("Failed to update agent");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className="rounded-xl border px-4 py-2 text-sm font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
      >
        Agent: {agent}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white shadow-xl z-50 py-1 overflow-hidden">
            {agents.map(a => (
              <button
                key={a}
                onClick={() => update(a)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${a === agent ? "font-bold text-emerald-600 bg-emerald-50/50" : "text-slate-600"}`}
              >
                {a}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}