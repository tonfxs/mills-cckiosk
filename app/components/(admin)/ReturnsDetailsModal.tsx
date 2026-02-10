"use client";

import { useEffect, useMemo, useState } from "react";

type NetoRma = {
  RmaID?: string;
  RmaNumber?: string;
  RmaStatus?: string;
  K1Status?: string;  // ✅ Add this
  Agent?: string;     // ✅ Add this
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

/* ================================
   Component
================================ */

export function RmaDetailsModal({
  open,
  rmaKey,
  initialK1Status,
  initialAgent,
  onClose,
  onRefresh
}: {
  open: boolean;
  rmaKey: string | null;
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
        // ✅ Fetch RMA from Neto
        const res = await fetch(`/api/neto/rma/${encodeURIComponent(rmaKey?.trim() ?? "")}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Request failed: ${text}`);
        }

        const json = await res.json();
        console.log("API Response:", json);

        if (!json?.success || !json?.data) {
          throw new Error(json?.error || "RMA not found");
        }

        const rmaData = json.data;
        console.log("RMA Data received:", rmaData);
        console.log("RmaLine array:", rmaData.RmaLine);

        // ✅ Fetch K1 Status and Agent from returns-datatable
        try {
          const sheetRes = await fetch(
            `/api/admin/returns-datatable?q=${encodeURIComponent(rmaKey?.trim() ?? "")}`,
            { cache: "no-store" }
          );

          if (sheetRes.ok) {
            const sheetJson = await sheetRes.json();
            console.log("Returns datatable response:", sheetJson);

            if (sheetJson.success && sheetJson.data?.items?.length > 0) {
              // Find exact match
              const match = sheetJson.data.items.find(
                (item: any) => item.rmaID === rmaKey?.trim()
              );

              if (match) {
                rmaData.K1Status = match.status;
                rmaData.Agent = match.agent;
                console.log("Found K1 Status:", match.status, "Agent:", match.agent);
              }
            }
          }
        } catch (sheetErr) {
          console.warn("Failed to fetch Google Sheet data:", sheetErr);
          // Continue without sheet data
        }

        setRma(rmaData);

        // Map RmaLine to items for display
        const rmaLines = rmaData.RmaLine || [];
        console.log("Processing RmaLines, count:", rmaLines.length);

        if (Array.isArray(rmaLines)) {
          const mappedItems = rmaLines.map((line: any, idx: number) => {
            console.log(`Line ${idx}:`, line);
            return {
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
            };
          });
          console.log("Mapped items:", mappedItems);
          setItems(mappedItems);
        } else {
          console.warn("RmaLine is not an array:", rmaLines);
          setItems([]);
        }
      } catch (err: any) {
        console.error("Error loading RMA:", err);
        setError(err?.message ?? "Failed to load RMA");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, rmaKey]);

  /* ================================
     ESC close
  ================================ */

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

  /* ================================
     Render
  ================================ */

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="absolute inset-x-0 top-8 mx-auto w-[min(1100px,calc(100%-2rem))]">
        <div className="rounded-2xl bg-white shadow-xl border overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-slate-700">
                RMA Details
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                RMA Ref:{" "}
                <span className="font-mono">
                  {rma?.RmaNumber ?? rmaKey}
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              {/* ✅ K1 Status Dropdown */}
              <K1StatusDropdown
                rmaNumber={rma?.RmaNumber}
                currentStatus={rma?.K1Status ?? "—"}
                onUpdate={onRefresh ?? (() => { })}
              />

              {/* ✅ Agent Dropdown */}
              <AgentDropdown
                rmaNumber={rma?.RmaNumber}
                currentAgent={rma?.Agent ?? "—"}
                onUpdate={onRefresh ?? (() => { })}
              />

              <button
                onClick={onClose}
                className="rounded-xl border px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Close
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[78vh] overflow-auto p-5 space-y-6">
            {loading && (
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-blue-700">
                Loading RMA from Neto…
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && rma && (
              <>
                {/* RMA Info */}
                <Section title="RMA Information">
                  <Row label="RMA #" value={rma.RmaNumber} />
                  <Row label="Status" value={rma.RmaStatus} />
                  <Row label="Created" value={rma.DateIssued} />
                  <Row
                    label="Original Order"
                    value={rma.OriginalOrderNumber}
                  />
                </Section>

                {/* Customer */}
                <Section title="Customer">
                  <Row label="Name" value={customerName} />
                  <Row label="Phone" value={rma.CustomerPhone} />
                  <Row label="Email" value={rma.CustomerEmail} />
                </Section>

                {/* Refund */}
                <Section title="Refund">
                  <Row
                    label="Total Refund"
                    value={money(rma.RefundTotal)}
                    highlight
                  />
                </Section>

                {/* Returned Items - Main Info */}
                <div className="rounded-2xl border overflow-hidden">
                  <div className="px-4 py-3 bg-slate-200 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-700">
                      Returned Items ({items.length})
                    </h3>
                  </div>

                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left">SKU</th>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Refund</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-3 font-mono text-slate-500">{i.SKU}</td>
                          <td className="px-4 py-3 text-slate-500">{i.ProductName}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{i.ReturnQty}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-500">
                            {money(i.RefundAmount)}
                          </td>
                        </tr>
                      ))}

                      {items.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-slate-500"
                          >
                            No returned items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Returned Items - Details */}
                <div className="rounded-2xl border overflow-hidden">
                  <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-700">
                      Item Details
                    </h3>
                  </div>

                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left">SKU</th>
                        <th className="px-4 py-3 text-left">Reason</th>
                        <th className="px-4 py-3 text-left">Returned Item Status</th>
                        <th className="px-4 py-3 text-left">Item Status Type</th>
                        <th className="px-4 py-3 text-left">Outcome</th>
                        <th className="px-4 py-3 text-left">RMA Status</th>
                        <th className="px-4 py-3 text-left">Manufacturing Claims</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-3 font-mono text-slate-500">{i.SKU}</td>
                          <td className="px-4 py-3 text-slate-500">{i.Reason}</td>
                          <td className="px-4 py-3 text-slate-500">{i.Condition}</td>
                          <td className="px-4 py-3 text-slate-500">{i.ItemStatusType}</td>
                          <td className="px-4 py-3 text-slate-500">{i.ResolutionOutcome}</td>
                          <td className="px-4 py-3 text-slate-500">{i.ResolutionStatus}</td>
                          <td className="px-4 py-3 text-slate-500">{i.ManufacturerClaims}</td>
                        </tr>
                      ))}

                      {items.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-6 text-center text-slate-500"
                          >
                            No returned items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  multiline
}: {
  label: string;
  value: any;
  highlight?: boolean;
  multiline?: boolean;
}) {
  const displayValue = value ?? "—";

  if (multiline && displayValue !== "—") {
    return (
      <div className="text-sm">
        <span className="text-slate-600 block mb-1">{label}</span>
        <div className="font-semibold text-slate-800 whitespace-pre-line bg-slate-50 rounded-lg p-3 text-xs leading-relaxed">
          {displayValue}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-slate-600">{label}</span>
      <span
        className={`font-semibold ${highlight ? "text-emerald-700" : "text-slate-800"
          }`}
      >
        {displayValue}
      </span>
    </div>
  );
}

/* ================================
   K1 Status Dropdown
================================ */

function K1StatusDropdown({
  rmaNumber,
  currentStatus,
  onUpdate
}: {
  rmaNumber?: string;
  currentStatus: string;
  onUpdate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const statuses = [
    "Item Received",
    "Proceed to Window",
    "Endorsed to WH",
    "Pending Verification",
  ];

  async function update(newStatus: string) {
    if (!rmaNumber || newStatus === status || updating) return;

    setUpdating(true);
    setStatus(newStatus);
    setOpen(false);

    try {
      const res = await fetch("/api/admin/update-rma-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rmaNumber,
          status: newStatus
        })
      });

      if (!res.ok) {
        throw new Error("Failed to update K1 status");
      }

      onUpdate();
    } catch (err) {
      console.error("Error updating K1 status:", err);
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
        className="rounded-xl border px-4 py-2 text-sm font-semibold bg-blue-50 text-blue-700 border-blue-400 hover:bg-blue-100 disabled:opacity-50"
      >
        Status: {status}
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg z-50">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => update(s)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-600 ${s === status ? "font-semibold bg-slate-50" : ""
                  }`}
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

function AgentDropdown({
  rmaNumber,
  currentAgent,
  onUpdate
}: {
  rmaNumber?: string;
  currentAgent: string;
  onUpdate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState(currentAgent);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setAgent(currentAgent);
  }, [currentAgent]);

  const agents = [
    "JB",
    "KB",
    "CC",
  ];

  async function update(newAgent: string) {
    if (!rmaNumber || newAgent === agent || updating) return;

    setUpdating(true);
    setAgent(newAgent);
    setOpen(false);

    try {
      console.log("[AGENT UPDATE] Sending request:", { orderNumber: rmaNumber, agent: newAgent });

      const res = await fetch("/api/admin/assign-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: rmaNumber,
          agent: newAgent
        })
      });

      console.log("[AGENT UPDATE] Response status:", res.status);

      const responseData = await res.json();
      console.log("[AGENT UPDATE] Response data:", responseData);

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to update agent");
      }

      console.log("[AGENT UPDATE] Success!");
      onUpdate();
    } catch (err) {
      console.error("[AGENT UPDATE] Error:", err);
      setAgent(currentAgent);
      alert("Failed to update agent: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className="rounded-xl border px-4 py-2 text-sm font-semibold bg-green-50 text-green-700 border-green-400 hover:bg-green-100 disabled:opacity-50"
      >
        Agent: {agent}
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg z-50">
            {agents.map(a => (
              <button
                key={a}
                onClick={() => update(a)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-600 ${a === agent ? "font-semibold bg-slate-50" : ""
                  }`}
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