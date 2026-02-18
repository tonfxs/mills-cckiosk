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

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    bayNumber: string;
    agent: string;
    status: string;
    timestamp: string;
  }) => void;
  orderNumber?: string;
  rowData?: AdcRow | null;
};

export default function AdcCurrentModal({
  open,
  onClose,
  onSave,
  orderNumber,
  rowData,
}: Props) {
  const [bayNumber, setBayNumber] = useState("");
  const [agent, setAgent] = useState("KB");
  const [status, setStatus] = useState("Completed");
  const [timestamp, setTimestamp] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (open) {
      console.log("🟢 Modal opened");
      console.log("📦 rowData received:", rowData);
      console.log("🔢 orderNumber received:", orderNumber);

      const time = new Intl.DateTimeFormat("en-AU", {
        timeZone: "Australia/Sydney",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date());
      setTimestamp(time);
      setSaveError("");
    }
  }, [open, rowData]);

  if (!open) return null;

  const handleSave = async () => {
    if (!rowData) {
      setSaveError("No order data available. Please close and reopen.");
      return;
    }

    const payload = {
      timestamp,
      bayNumber,
      agent,
      status,
      orderNumber: rowData.orderNumber,
      externalSku: rowData.externalSku,
      name: rowData.name,
      itemName: rowData.itemName,
      notes: rowData.notes,
      salesChannel: rowData.salesChannel,
      location: rowData.location,
    };

    console.log("📤 Saving payload:", payload);
    setSaving(true);
    setSaveError("");

    try {
      // Step 1 — Write to Current Orders
      const saveRes = await fetch("/api/admin/adc-current-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const saveJson = await saveRes.json();
      console.log("📡 Save response:", saveJson);
      if (!saveJson.success) throw new Error(saveJson.error || "Failed to save");

      console.log("✅ Saved to Current Orders:", saveJson.updatedRange);

      // Step 2 — Clear from Completed Orders
      const clearRes = await fetch("/api/admin/adc-current-orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: rowData.orderNumber }),
      });

      const clearJson = await clearRes.json();
      console.log("📡 Clear response:", clearJson);

      if (!clearJson.success) {
        // Don't block the user — just warn, data was already saved
        console.warn("⚠️ Saved OK but failed to clear source row:", clearJson.error);
      } else {
        console.log("🗑️ Cleared from Completed Orders:", clearJson.clearedRange);
      }

      onSave({ bayNumber, agent, status, timestamp });
      onClose();
      setBayNumber("");
    } catch (e: any) {
      console.error("❌ Save error:", e);
      setSaveError(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-gray-700 font-medium">{value || "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-[480px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg text-slate-600 font-semibold mb-4">
          Order {orderNumber}
        </h2>

        {/* Debug banner — remove once working */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs text-yellow-800 font-mono break-all">
          <p className="font-bold mb-1">🐛 Debug — rowData:</p>
          <p>{rowData ? JSON.stringify(rowData, null, 2) : "⚠️ NULL / UNDEFINED"}</p>
        </div>

        {/* Read-only order info */}
        {rowData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 border border-gray-100">
            <Field label="Date" value={rowData.date} />
            <Field label="Age" value={rowData.age} />
            <Field label="Collected?" value={rowData.collected} />
            <Field label="SKU" value={rowData.externalSku} />
            <Field label="Customer" value={rowData.name} />
            <Field label="Item" value={rowData.itemName} />
            <Field label="Order Details" value={rowData.orderDetails} />
            <Field label="Channel" value={rowData.salesChannel} />
            <Field label="Location" value={rowData.location} />
            <Field label="Notes" value={rowData.notes} />
          </div>
        )}

        {/* Editable fields */}
        <input
          placeholder="Bay Number"
          value={bayNumber}
          onChange={(e) => setBayNumber(e.target.value)}
          className="w-full border border-slate-200 rounded-lg p-2 mb-3 text-slate-600"
        />

        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          className="w-full border rounded-lg p-2 mb-3 text-slate-600 border-slate-200"
        >
          <option value=" "></option>
          <option value="KB">KB</option>
          <option value="CC">CC</option>
          <option value="JB">JB</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border rounded-lg p-2 mb-3 border-slate-200 text-slate-600"
        >
          <option value=" "></option>
          <option value="Completed">Completed</option>
          <option value="Not yet">Not yet</option>
        </select>

        <div className="text-sm text-gray-500 mb-4">Time: {timestamp}</div>

        {saveError && (
          <p className="text-sm text-red-500 mb-3 bg-red-50 p-2 rounded-lg">{saveError}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="border px-4 py-2 rounded-lg border-red-400 text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}