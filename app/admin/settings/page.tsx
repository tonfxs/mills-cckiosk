"use client";

import { useState, useEffect } from "react";
import { Archive, Calendar, Trash2, RefreshCw, Loader2, CheckCircle, XCircle } from "lucide-react";

type SheetKey = "master" | "pickups" | "returns";

type ArchiveHistoryEntry = {
  id: string;
  date: string;
  range: string;
  customStart?: string;
  customEnd?: string;
  records: number;
  archivedBy: string;
  sheets: string;
};

const RANGE_LABELS: Record<string, string> = {
  today: "Today",
  last7days: "Last 7 days",
  last30days: "Last 30 days",
  custom: "Custom Range",
};

const SHEET_OPTIONS: { key: SheetKey; label: string; description: string }[] = [
  { key: "master",  label: "Master List",  description: "MASTER LIST → Copy of ARCHIVE" },
  { key: "pickups", label: "Pickups",      description: "Copy of Pickupsv1 → Archive Pickups" },
  { key: "returns", label: "Returns",      description: "Copy of Returns → Archive Returns" },
];

const HISTORY_KEY = "kiosk_archive_history";

function loadHistory(): ArchiveHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}

function saveHistory(history: ArchiveHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export default function KioskSettingsPage() {
  const [selectedRange, setSelectedRange] = useState("last7days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedSheets, setSelectedSheets] = useState<SheetKey[]>(["master", "pickups", "returns"]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [history, setHistory] = useState<ArchiveHistoryEntry[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => { setHistory(loadHistory()); }, []);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  function toggleSheet(key: SheetKey) {
    setSelectedSheets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleArchive() {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/master-archiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          range: selectedRange,
          customStart: customStart || undefined,
          customEnd: customEnd || undefined,
          archivedBy: "Admin",
          sheets: selectedSheets,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        showToast("error", data.message ?? "Archive failed.");
        return;
      }

      const newHistory = [data.history, ...history];
      setHistory(newHistory);
      saveHistory(newHistory);
      showToast("success", `Successfully archived ${data.archivedCount.toLocaleString()} records across ${selectedSheets.length} sheet(s).`);
    } catch (err: any) {
      showToast("error", err.message ?? "Network error.");
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteHistory(id: string) {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  }

  function rangeLabel(entry: ArchiveHistoryEntry) {
    if (entry.range === "custom" && entry.customStart && entry.customEnd)
      return `${entry.customStart} → ${entry.customEnd}`;
    return RANGE_LABELS[entry.range] ?? entry.range;
  }

  const canArchive = selectedSheets.length > 0 &&
    (selectedRange !== "custom" || (!!customStart && !!customEnd));

  return (
    <div className="flex flex-col gap-6 p-6 relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Confirm Archive</h3>
            <p className="text-sm text-slate-500 mb-3">
              This will move matching records from the selected sheets into their archive tabs and permanently delete them from the source.
            </p>
            <div className="bg-slate-50 rounded-xl p-3 mb-5 flex flex-col gap-1">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Sheets to archive</p>
              {SHEET_OPTIONS.filter((s) => selectedSheets.includes(s.key)).map((s) => (
                <div key={s.key} className="text-xs text-slate-600">
                  <span className="font-medium text-slate-700">{s.label}</span>
                  <span className="text-slate-400"> — {s.description}</span>
                </div>
              ))}
              <p className="text-xs text-slate-600 mt-2">
                Range: <span className="font-semibold text-blue-600">{RANGE_LABELS[selectedRange]}</span>
                {selectedRange === "custom" && customStart && customEnd && (
                  <span className="text-slate-500"> ({customStart} → {customEnd})</span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 border border-slate-300 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 text-sm">
                Cancel
              </button>
              <button onClick={handleArchive} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
                Yes, Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow">
          <RefreshCw size={16} />
          Sync Google Sheet
        </button>
      </div>

      {/* Archive Section */}
      <div className="bg-white rounded-2xl shadow p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-1">
          <Archive className="text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">Archive Data</h2>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Select which sheets to archive and the date range. Archived rows are moved to their respective archive tabs and removed from the source.
        </p>

        {/* Sheet selector */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Select Sheets</p>
          <div className="flex flex-wrap gap-3">
            {SHEET_OPTIONS.map(({ key, label, description }) => {
              const checked = selectedSheets.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleSheet(key)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    checked
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 ${checked ? "bg-blue-500 border-blue-500" : "border-slate-300"}`}>
                    {checked && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date range + action */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Calendar size={18} className="text-slate-400" />
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="custom">Custom Range</option>
            </select>

            {selectedRange === "custom" && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-slate-400 text-sm">to</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>

          <button
            onClick={() => setConfirmOpen(true)}
            disabled={loading || !canArchive}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl shadow"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}
            {loading ? "Archiving..." : "Archive Selected Data"}
          </button>
        </div>
      </div>

      {/* Archive History */}
      <div className="bg-white rounded-2xl shadow border border-slate-200">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Archive History</h2>
          {history.length > 0 && (
            <span className="text-xs text-slate-400">{history.length} record{history.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left text-slate-600 p-4">Date Archived</th>
                <th className="text-left text-slate-600 p-4">Range</th>
                <th className="text-left text-slate-600 p-4">Sheets</th>
                <th className="text-left text-slate-600 p-4">Records</th>
                <th className="text-left text-slate-600 p-4">Archived By</th>
                <th className="text-left text-slate-600 p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-10 text-sm">No archive history yet.</td>
                </tr>
              ) : (
                history.map((entry) => (
                  <tr key={entry.id} className="border-t hover:bg-slate-50 transition-colors">
                    <td className="text-slate-600 p-4">{entry.date}</td>
                    <td className="text-slate-600 p-4">{rangeLabel(entry)}</td>
                    <td className="text-slate-500 p-4 text-xs max-w-xs">{entry.sheets ?? "—"}</td>
                    <td className="text-slate-600 p-4">{entry.records.toLocaleString()}</td>
                    <td className="text-slate-600 p-4">{entry.archivedBy}</td>
                    <td className="p-4">
                      <button onClick={() => handleDeleteHistory(entry.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm">
                        <Trash2 size={15} />
                        Delete
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
  );
}