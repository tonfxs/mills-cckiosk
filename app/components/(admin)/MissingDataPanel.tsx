import { useState } from "react";

type MissingItem = {
  timestamp: string;
  fullName: string;
  phone: string;
  ref: string;
  paymentMethod: string;
  carParkBay: string;
  status: string;
  type: string;
  missing: string[];
};

type ArchiveStatus = "idle" | "loading" | "success" | "error";

async function callArchiveApi(items: MissingItem[]): Promise<{ archived: number; deleted: number; skipped: number; notFound: number }> {
  const res = await fetch("/api/admin/archive-invalid", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || "Archive request failed");
  }

  return json.result;
}

export default function MissingDataPanel({ items = [] }: { items?: MissingItem[] }) {
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  // Per-row archive state: key -> status
  const [rowStatus, setRowStatus] = useState<Record<string, ArchiveStatus>>({});

  // Bulk archive state
  const [bulkStatus, setBulkStatus] = useState<ArchiveStatus>("idle");
  const [bulkMessage, setBulkMessage] = useState<string>("");

  const getKey = (r: MissingItem, i: number) => `${r.type}-${r.ref}-${i}`;

  const setRowArchiveStatus = (key: string, status: ArchiveStatus) => {
    setRowStatus((prev) => ({ ...prev, [key]: status }));
  };

  // ── Per-row archive ────────────────────────────────────────────────────────
  const archiveRow = async (item: MissingItem, key: string) => {
    setRowArchiveStatus(key, "loading");
    try {
      await callArchiveApi([item]);
      setArchived((prev) => new Set(prev).add(key));
      setRowArchiveStatus(key, "success");
    } catch {
      setRowArchiveStatus(key, "error");
      // Reset error state after 3s so user can retry
      setTimeout(() => setRowArchiveStatus(key, "idle"), 3000);
    }
  };

  const restoreRow = (key: string) => {
    setArchived((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setRowArchiveStatus(key, "idle");
  };

  // ── Bulk archive all active rows ───────────────────────────────────────────
  const archiveAll = async () => {
    const activeItems = items.filter((r, i) => !archived.has(getKey(r, i)));
    if (activeItems.length === 0) return;

    setBulkStatus("loading");
    setBulkMessage("");

    try {
      const result = await callArchiveApi(activeItems);

      // Mark all as archived in UI
      const newKeys = activeItems.map((r, i) =>
        getKey(r, items.indexOf(r))
      );
      setArchived((prev) => new Set([...prev, ...newKeys]));
      setShowArchived(false);

      setBulkStatus("success");
      setBulkMessage(
        `Archived ${result.archived} row${result.archived !== 1 ? "s" : ""} — ` +
        `Deleted: ${result.deleted} • Skipped (duplicates): ${result.skipped} • Not found: ${result.notFound}`
      );

      // Clear success message after 6s
      setTimeout(() => {
        setBulkStatus("idle");
        setBulkMessage("");
      }, 6000);
    } catch (err: any) {
      setBulkStatus("error");
      setBulkMessage(err?.message || "Archive failed. Please try again.");
      setTimeout(() => {
        setBulkStatus("idle");
        setBulkMessage("");
      }, 5000);
    }
  };

  const restoreAll = () => {
    setArchived(new Set());
    setRowStatus({});
  };

  const activeItems = items.filter((r, i) => !archived.has(getKey(r, i)));
  const archivedItems = items.filter((r, i) => archived.has(getKey(r, i)));
  const displayedItems = showArchived ? archivedItems : activeItems;

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="p-5 border-b flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-gray-900">Missing Data Detector</h3>
          <p className="text-sm text-gray-500">Rows that may break handling or verification</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Archive toggle */}
          {archivedItems.length > 0 && (
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="4" width="14" height="10" rx="1.5" />
                <path d="M5 4V3a2 2 0 0 1 4 0v1" />
                <path d="M6 8h4" />
              </svg>
              {showArchived ? "Show active" : `Archived (${archivedItems.length})`}
            </button>
          )}

          {/* Restore all (when viewing archived) */}
          {showArchived && archivedItems.length > 0 && (
            <button
              onClick={restoreAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Restore all
            </button>
          )}

          {/* Archive all (when viewing active) */}
          {!showArchived && activeItems.length > 0 && (
            <button
              onClick={archiveAll}
              disabled={bulkStatus === "loading"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkStatus === "loading" ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
                  </svg>
                  Archiving…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="4" width="14" height="10" rx="1.5" />
                    <path d="M1 4l2-3h10l2 3" strokeLinejoin="round" />
                    <path d="M6 9h4" strokeLinecap="round" />
                  </svg>
                  Archive all
                </>
              )}
            </button>
          )}

          {/* Count badge */}
          <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            {activeItems.length} active
          </span>
        </div>
      </div>

      {/* Bulk status banner */}
      {bulkMessage && (
        <div
          className={`px-5 py-2.5 border-b text-xs flex items-center gap-2 ${
            bulkStatus === "success"
              ? "bg-green-50 border-green-100 text-green-700"
              : "bg-red-50 border-red-100 text-red-700"
          }`}
        >
          {bulkStatus === "success" ? (
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2.5 8.5l3.5 3.5 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3.5M8 11v.5" strokeLinecap="round" />
            </svg>
          )}
          {bulkMessage}
        </div>
      )}

      {/* Archived banner */}
      {showArchived && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="4" width="14" height="10" rx="1.5" />
            <path d="M5 4V3a2 2 0 0 1 4 0v1" />
            <path d="M6 8h4" />
          </svg>
          Viewing archived rows — saved to Google Sheet and removed from MASTER LIST. Restore to bring back to active view only.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Type</th>
              <th className="px-5 py-3 text-left font-medium">Ref</th>
              <th className="px-5 py-3 text-left font-medium">Name</th>
              <th className="px-5 py-3 text-left font-medium">Phone</th>
              <th className="px-5 py-3 text-left font-medium">Bay</th>
              <th className="px-5 py-3 text-left font-medium">Payment</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Missing</th>
              <th className="px-5 py-3 text-left font-medium">Timestamp</th>
              <th className="px-3 py-3 text-left font-medium w-10" />
            </tr>
          </thead>

          <tbody>
            {displayedItems.length === 0 ? (
              <tr className="border-t">
                <td className="px-5 py-6 text-gray-400 text-center" colSpan={10}>
                  {showArchived ? "No archived rows." : "No missing-data rows found."}
                </td>
              </tr>
            ) : (
              displayedItems.map((r) => {
                const key = getKey(r, items.indexOf(r));
                const isArchived = archived.has(key);
                const status = rowStatus[key] ?? "idle";

                return (
                  <tr
                    key={key}
                    className={`border-t transition-colors ${
                      isArchived ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-5 py-3 text-gray-700">{r.type}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{r.ref || "—"}</td>
                    <td className="px-5 py-3 text-gray-700">{r.fullName || "—"}</td>
                    <td className="px-5 py-3 text-gray-700">{r.phone || "—"}</td>
                    <td className="px-5 py-3 text-gray-700">{r.carParkBay || "—"}</td>
                    <td className="px-5 py-3 text-gray-700">{r.paymentMethod || "—"}</td>
                    <td className="px-5 py-3 text-gray-700">{r.status || "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(r.missing ?? []).map((m) => (
                          <span
                            key={m}
                            className="rounded-full border bg-red-50 text-red-700 border-red-200 px-2 py-0.5 text-xs font-medium"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{r.timestamp}</td>

                    {/* Archive / Restore / Status button */}
                    <td className="px-3 py-3">
                      {status === "loading" ? (
                        <span className="flex items-center justify-center p-1.5">
                          <svg className="w-4 h-4 animate-spin text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
                          </svg>
                        </span>
                      ) : status === "error" ? (
                        <span title="Archive failed — will retry" className="flex items-center justify-center p-1.5 text-red-400">
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="8" cy="8" r="6" />
                            <path d="M8 5v3.5M8 11v.5" strokeLinecap="round" />
                          </svg>
                        </span>
                      ) : isArchived ? (
                        <button
                          onClick={() => restoreRow(key)}
                          title="Restore to active view"
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8Z" />
                            <path d="M8 5.5v2.75l1.75 1.75" strokeLinecap="round" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => archiveRow(r, key)}
                          title="Archive row — saves to sheet & removes from MASTER LIST"
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="1" y="4" width="14" height="10" rx="1.5" />
                            <path d="M1 4l2-3h10l2 3" strokeLinejoin="round" />
                            <path d="M6 9h4" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}