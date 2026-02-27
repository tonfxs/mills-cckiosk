"use client";

import { useEffect, useState } from "react";

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

type SaveData = {
  bayNumber: string;
  agent: string;
  status: string;
  timestamp: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: SaveData) => void;
  orderNumber?: string;
  rowData?: AdcRow | null;
};

const AGENTS = ["KB", "CC", "JB", "SA"];

export default function AdcCurrentModal({ open, onClose, onSave, rowData }: Props) {
  const [bayNumber, setBayNumber] = useState("");
  const [agent, setAgent] = useState("KB");
  const [status, setStatus] = useState("Completed");
  const [timestamp, setTimestamp] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (open) {
      setTimestamp(
        new Intl.DateTimeFormat("en-AU", {
          timeZone: "Australia/Sydney",
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", hour12: true,
        }).format(new Date())
      );
      setSaveError("");
      setBayNumber("");
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!rowData) { setSaveError("No order data available."); return; }

    setSaving(true);
    setSaveError("");

    try {
      const formData: SaveData = { bayNumber, agent, status, timestamp };
      const payload = { ...formData, ...rowData };

      const saveRes = await fetch("/api/admin/adc-current-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const saveJson = await saveRes.json();
      if (!saveJson.success) throw new Error(saveJson.error || "Failed to save");

      const deleteRes = await fetch("/api/admin/adc-current-orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: rowData.orderNumber }),
      });
      const deleteJson = await deleteRes.json();
      if (!deleteJson.success) throw new Error(deleteJson.error || "Failed to remove from source");

      onSave(formData);
      onClose();
    } catch (e: any) {
      setSaveError(e.message || "Something went wrong during the move.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-start mb-4 shrink-0">
          <h2 className="text-xl text-slate-900 font-bold">Move Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">

          {/* Order info */}
          {rowData && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
              <Field label="Order ID" value={rowData.orderNumber} />
              <Field label="Customer" value={rowData.name} />
              <Field label="Item" value={rowData.itemName} />
              <Field label="SKU" value={rowData.externalSku} />
            </div>
          )}

          {/* Bay number */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              Bay Assignment
            </label>
            <input
              autoFocus
              placeholder="e.g. 12 or A4"
              value={bayNumber}
              onChange={(e) => setBayNumber(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Agent + status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Agent</label>
              <select
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Not yet">Not yet</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {saveError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium shrink-0">
            {saveError}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 shrink-0">
          <p className="text-[10px] text-gray-400 font-mono italic">TS: {timestamp}</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-500 font-semibold text-sm hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !bayNumber}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-blue-200"
            >
              {saving ? "Processing..." : "Move Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-gray-700 font-medium truncate">{value || "—"}</span>
    </div>
  );
}

function XIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}