"use client";

import { useState, useEffect, useRef } from "react";
import {
  Archive, Trash2, Loader2, CheckCircle, XCircle, ArrowUpDown,
  History, Search, ChevronLeft, ChevronRight, RefreshCw,
  LogIn, Users, Clock, Calendar, Filter, ShieldCheck, X, Wifi,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import SheetHealthPanel from "@/app/components/(admin)/SheetHealthPanel";
import { subscribeToLoginHistory, subscribeToOnlineUsers, LoginRecord } from "../../services/userService";

type SheetKey = "master" | "pickups" | "returns";
type Tab = "archive" | "edit-history" | "login-history";

type ArchiveHistoryEntry = {
  id: string; date: string; range: string;
  customStart?: string; customEnd?: string;
  records: number; archivedBy: string; sheets: string;
};

type EditHistoryRow = {
  timestamp: string; action: string; orderNumber: string; agent: string;
  bayNumber: string; name: string; itemName: string; externalSku: string;
  salesChannel: string; location: string; notes: string;
};

type EditHistoryApi = {
  items: EditHistoryRow[]; total: number; page: number;
  pageSize: number; totalPages: number; agents: string[]; actions: string[];
};

const RANGE_LABELS: Record<string, string> = {
  today: "Today", last7days: "Last 7 days",
  last30days: "Last 30 days", custom: "Custom Range",
};

const SHEET_OPTIONS: { key: SheetKey; label: string; description: string }[] = [
  { key: "master",  label: "Master List",  description: "MASTER LIST → ARCHIVE" },
  { key: "pickups", label: "Pickups",      description: "Copy of Pickupsv1 → Archive Pickups" },
  { key: "returns", label: "Returns",      description: "Copy of Returns → Archive Returns" },
];

const HISTORY_KEY = "kiosk_archive_history";

const AGENT_COLORS: Record<string, string> = {
  KB: "bg-violet-100 text-violet-700",
  CC: "bg-emerald-100 text-emerald-700",
  JB: "bg-amber-100 text-amber-700",
  SA: "bg-rose-100 text-rose-700",
};

const ROLE_STYLES: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-700 border-purple-200",
  admin:      "bg-blue-100 text-blue-700 border-blue-200",
  staff:      "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function loadHistory(): ArchiveHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); } catch { return []; }
}
function saveHistory(h: ArchiveHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    MOVED_TO_CURRENT: "bg-blue-50 text-blue-700 border border-blue-200",
    DELETED:          "bg-red-50 text-red-700 border border-red-200",
  };
  const labels: Record<string, string> = {
    MOVED_TO_CURRENT: "Moved to Current", DELETED: "Deleted",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[action] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>
      {labels[action] ?? action}
    </span>
  );
}

function AgentBadge({ agent }: { agent: string }) {
  const cls = AGENT_COLORS[agent.toUpperCase()] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${cls}`}>
      {agent.toUpperCase()}
    </span>
  );
}

const AVATAR_COLORS = [
  "from-blue-500 to-blue-600", "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600", "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600", "from-sky-500 to-cyan-600",
];

function Avatar({ name, uid, isOnline }: { name: string; uid: string; isOnline?: boolean }) {
  const color = AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className="relative shrink-0">
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
        {name?.[0]?.toUpperCase() ?? "?"}
      </div>
      {/* Online dot */}
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_STYLES[role] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      <ShieldCheck className="w-3 h-3" />{role}
    </span>
  );
}

function formatDate(ts: any) {
  if (!ts?.seconds) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(ts: any) {
  if (!ts?.seconds) return "";
  return new Date(ts.seconds * 1000).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function timeAgo(ts: any) {
  if (!ts?.seconds) return "";
  const diff  = Date.now() - ts.seconds * 1000;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return formatDate(ts);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KioskSettingsPage() {
  const { user, profile, role } = useAuth();
  const displayName = profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Unknown";
  const isSuperAdmin = role === "superadmin";

  const [activeTab, setActiveTab] = useState<Tab>("archive");

  // ── Archive state ──────────────────────────────────────────────────────────
  const [selectedRange, setSelectedRange]     = useState("last7days");
  const [customStart, setCustomStart]         = useState("");
  const [customEnd, setCustomEnd]             = useState("");
  const [selectedSheets, setSelectedSheets]   = useState<SheetKey[]>(["master", "pickups", "returns"]);
  const [loading, setLoading]                 = useState(false);
  const [sorting, setSorting]                 = useState(false);
  const [toast, setToast]                     = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [history, setHistory]                 = useState<ArchiveHistoryEntry[]>([]);
  const [confirmOpen, setConfirmOpen]         = useState(false);
  const [sortConfirmOpen, setSortConfirmOpen] = useState(false);

  // ── Edit History state ─────────────────────────────────────────────────────
  const [editHistory, setEditHistory] = useState<EditHistoryApi>({
    items: [], total: 0, page: 1, pageSize: 10, totalPages: 1, agents: [], actions: [],
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState("");
  const [editQ, setEditQ]             = useState("");
  const [editAction, setEditAction]   = useState("");
  const [editAgent, setEditAgent]     = useState("");
  const [editPage, setEditPage]       = useState(1);
  const editAbortRef = useRef<AbortController | null>(null);

  // ── Login + Presence state ─────────────────────────────────────────────────
  const [loginRecords, setLoginRecords]       = useState<LoginRecord[]>([]);
  const [loginConnected, setLoginConnected]   = useState(false);
  const [onlineUids, setOnlineUids]           = useState<Set<string>>(new Set());
  const [loginSearch, setLoginSearch]         = useState("");
  const [loginFilterRole, setLoginFilterRole] = useState("all");
  const [loginFilterDate, setLoginFilterDate] = useState("all");

  useEffect(() => { setHistory(loadHistory()); }, []);
  useEffect(() => { setEditPage(1); loadEditHistory({ page: 1 }); }, [editQ, editAction, editAgent]);

  // ── Real-time login history ────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToLoginHistory((records) => {
      setLoginRecords(records);
      setLoginConnected(true);
    });
    return unsub;
  }, []);

  // ── Real-time online presence ──────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToOnlineUsers((uids) => setOnlineUids(uids));
    return unsub;
  }, []);

  // ── Login History filtering ────────────────────────────────────────────────
  const filteredLogin = loginRecords.filter((r) => {
    const q = loginSearch.toLowerCase();
    const matchSearch = !q || r.displayName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    const matchRole   = loginFilterRole === "all" || r.role === loginFilterRole;
    let matchDate = true;
    if (r.loginAt?.seconds && loginFilterDate !== "all") {
      const ms  = r.loginAt.seconds * 1000;
      const now = Date.now();
      if (loginFilterDate === "today") matchDate = now - ms < 86400000;
      if (loginFilterDate === "week")  matchDate = now - ms < 604800000;
      if (loginFilterDate === "month") matchDate = now - ms < 2592000000;
    }
    return matchSearch && matchRole && matchDate;
  });

  const loginTodayCount  = loginRecords.filter((r) => r.loginAt?.seconds && Date.now() - r.loginAt.seconds * 1000 < 86400000).length;
  const loginUniqueUsers = new Set(loginRecords.map((r) => r.uid)).size;
  const onlineCount      = onlineUids.size;
  const loginRoles       = [...new Set(loginRecords.map((r) => r.role))].filter(Boolean);

  // ── Edit History fetch ─────────────────────────────────────────────────────
  async function loadEditHistory(next?: Partial<{ page: number }>) {
    editAbortRef.current?.abort();
    const controller = new AbortController();
    editAbortRef.current = controller;
    const sp = new URLSearchParams();
    if (editQ)      sp.set("q", editQ);
    if (editAction) sp.set("action", editAction);
    if (editAgent)  sp.set("agent", editAgent);
    sp.set("page", String(next?.page ?? editPage));
    sp.set("pageSize", "10");
    try {
      setEditError(""); setEditLoading(true);
      const res  = await fetch(`/api/admin/edit-history?${sp.toString()}`, { cache: "no-store", signal: controller.signal });
      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); } catch { throw new Error("Non-JSON response"); }
      if (!json?.success) throw new Error(json?.error || "Failed to load");
      setEditHistory(json.data); setEditPage(json.data.page);
    } catch (e: any) {
      if (String(e?.name ?? "").includes("Abort")) return;
      setEditError(e?.message || "Failed to load edit history");
    } finally { setEditLoading(false); }
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }
  function toggleSheet(key: SheetKey) {
    setSelectedSheets((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  async function handleArchive() {
    setConfirmOpen(false); setLoading(true);
    try {
      const res = await fetch("/api/admin/master-archiving", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range: selectedRange, customStart: customStart || undefined, customEnd: customEnd || undefined, archivedBy: displayName, sheets: selectedSheets }),
      });
      if (!res.ok) { showToast("error", `Server error ${res.status}`); return; }
      const data = await res.json();
      if (!data.success) { showToast("error", data.message ?? "Archive failed."); return; }
      const newHistory = [data.history, ...history];
      setHistory(newHistory); saveHistory(newHistory);
      showToast("success", `Successfully archived ${data.archivedCount.toLocaleString()} records across ${selectedSheets.length} sheet(s).`);
    } catch (err: any) { showToast("error", err.message ?? "Network error."); }
    finally { setLoading(false); }
  }

  async function handleSort() {
    setSortConfirmOpen(false); setSorting(true);
    try {
      const res = await fetch("/api/admin/archive-sort", { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!res.ok) { showToast("error", `Server error ${res.status}`); return; }
      const data = await res.json();
      if (!data.success) { showToast("error", data.message ?? "Sort failed."); return; }
      const sorted  = data.results.filter((r: any) => !r.skipped);
      const skipped = data.results.filter((r: any) => r.skipped);
      const summary = sorted.map((r: any) => `${r.sheet} (${r.sorted} rows)`).join(", ");
      showToast("success", `Sorted: ${summary || "nothing to sort"}${skipped.length > 0 ? ` · ${skipped.length} skipped` : ""}`);
    } catch (err: any) { showToast("error", err.message ?? "Network error."); }
    finally { setSorting(false); }
  }

  function handleDeleteHistory(id: string) {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated); saveHistory(updated);
  }

  function rangeLabel(entry: ArchiveHistoryEntry) {
    if (entry.range === "custom" && entry.customStart && entry.customEnd)
      return `${entry.customStart} → ${entry.customEnd}`;
    return RANGE_LABELS[entry.range] ?? entry.range;
  }

  const canArchive = selectedSheets.length > 0 &&
    (selectedRange !== "custom" || (!!customStart && !!customEnd));

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "archive",       label: "Archive",       icon: Archive },
    { key: "edit-history",  label: "Edit History",  icon: History },
    { key: "login-history", label: "Login History", icon: LogIn },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Archive Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Confirm Archive</h3>
            <p className="text-sm text-slate-500 mb-3">This will move matching records into archive tabs and delete them from source.</p>
            <div className="bg-slate-50 rounded-xl p-3 mb-4 flex flex-col gap-1">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Sheets to archive</p>
              {SHEET_OPTIONS.filter((s) => selectedSheets.includes(s.key)).map((s) => (
                <div key={s.key} className="text-xs text-slate-600">
                  <span className="font-medium text-slate-700">{s.label}</span>
                  <span className="text-slate-400"> — {s.description}</span>
                </div>
              ))}
              <p className="text-xs text-slate-600 mt-2">Range: <span className="font-semibold text-blue-600">{RANGE_LABELS[selectedRange]}</span></p>
              <p className="text-xs text-slate-400 mt-1">Archived by: <span className="font-medium text-slate-600">{displayName}</span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 border border-slate-300 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 text-sm">Cancel</button>
              <button onClick={handleArchive} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium">Yes, Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Sort Confirm Modal */}
      {sortConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Sort Archive Sheets</h3>
            <p className="text-sm text-slate-500 mb-4">This will re-sort all 3 archive tabs by Timestamp ascending.</p>
            <div className="bg-slate-50 rounded-xl p-3 mb-5 flex flex-col gap-1 text-xs text-slate-600">
              <p>• <span className="font-medium">ARCHIVE</span></p>
              <p>• <span className="font-medium">Archive Pickups</span></p>
              <p>• <span className="font-medium">Archive Returns</span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSortConfirmOpen(false)} className="flex-1 border border-slate-300 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 text-sm">Cancel</button>
              <button onClick={handleSort} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium">Yes, Sort</button>
            </div>
          </div>
        </div>
      )}

      {isSuperAdmin && <SheetHealthPanel />}

      {/* ── Tab Navigation ── */}
      <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/60">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors relative ${
                activeTab === key ? "text-blue-600 bg-white border-b-2 border-blue-600 -mb-px" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}>
              <Icon size={15} />
              {label}
              {key === "login-history" && onlineCount > 0 && (
                <span className="ml-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {onlineCount} online
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ ARCHIVE TAB ══ */}
        {activeTab === "archive" && (
          <div>
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <Archive className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Archive Data</h2>
                </div>
                <button onClick={() => setSortConfirmOpen(true)} disabled={sorting}
                  className="flex items-center gap-2 border border-slate-300 hover:border-slate-400 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50 transition-colors">
                  {sorting ? <Loader2 size={13} className="animate-spin" /> : <ArrowUpDown size={13} />}
                  {sorting ? "Sorting..." : "Sort Archives"}
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-6">Select which sheets to archive and the date range.</p>
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Select Sheets</p>
                <div className="flex flex-wrap gap-3">
                  {SHEET_OPTIONS.map(({ key, label, description }) => {
                    const checked = selectedSheets.includes(key);
                    return (
                      <button key={key} onClick={() => toggleSheet(key)}
                        className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${checked ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
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
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <select value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-2 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="today">Today</option>
                    <option value="last7days">Last 7 days</option>
                    <option value="last30days">Last 30 days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  {selectedRange === "custom" && (
                    <div className="flex items-center gap-2">
                      <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <span className="text-slate-400 text-sm">to</span>
                      <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  )}
                </div>
                <button onClick={() => setConfirmOpen(true)} disabled={loading || !canArchive}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl shadow">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}
                  {loading ? "Archiving..." : "Archive Selected Data"}
                </button>
              </div>
            </div>
            <div>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Archive History</h3>
                {history.length > 0 && <span className="text-xs text-slate-400">{history.length} record{history.length !== 1 ? "s" : ""}</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>{["Date Archived", "Range", "Sheets", "Records", "Archived By", "Action"].map((h) => (
                      <th key={h} className="text-left text-slate-600 p-4 text-xs font-semibold uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-slate-400 py-10 text-sm">No archive history yet.</td></tr>
                    ) : history.map((entry) => (
                      <tr key={entry.id} className="border-t hover:bg-slate-50 transition-colors">
                        <td className="text-slate-600 p-4">{entry.date}</td>
                        <td className="text-slate-600 p-4">{rangeLabel(entry)}</td>
                        <td className="text-slate-500 p-4 text-xs max-w-xs">{entry.sheets ?? "—"}</td>
                        <td className="text-slate-600 p-4">{entry.records.toLocaleString()}</td>
                        <td className="text-slate-600 p-4">{entry.archivedBy}</td>
                        <td className="p-4"><button onClick={() => handleDeleteHistory(entry.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"><Trash2 size={15} />Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ EDIT HISTORY TAB ══ */}
        {activeTab === "edit-history" && (
          <div>
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-800">ADC Edit History</h2>
                <p className="text-xs text-slate-400 mt-0.5">All ADC order moves and deletions</p>
              </div>
              <div className="flex items-center gap-2">
                {editHistory.total > 0 && <span className="text-xs text-slate-400">{editHistory.total} total edits</span>}
                <button onClick={() => loadEditHistory({ page: editPage })}
                  className="flex items-center gap-1.5 border border-slate-300 hover:border-slate-400 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors">
                  <RefreshCw size={12} className={editLoading ? "animate-spin" : ""} />Refresh
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-b bg-slate-50 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input value={editQ} onChange={(e) => setEditQ(e.target.value)} placeholder="Search order #, customer, agent, SKU…"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-4 py-2 text-xs text-slate-600 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <select value={editAction} onChange={(e) => setEditAction(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 outline-none">
                <option value="">All actions</option>
                {editHistory.actions.map((a) => <option key={a} value={a}>{a === "MOVED_TO_CURRENT" ? "Moved to Current" : a === "DELETED" ? "Deleted" : a}</option>)}
              </select>
              <select value={editAgent} onChange={(e) => setEditAgent(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 outline-none">
                <option value="">All agents</option>
                {editHistory.agents.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {editError && <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs">{editError}</div>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-t border-slate-100">
                  <tr>{["When", "Action", "Agent", "Order #", "Bay #", "Customer", "Item", "SKU"].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider p-4">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {editLoading ? (
                    <tr><td colSpan={8} className="text-center py-10"><div className="flex items-center justify-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" />Loading…</div></td></tr>
                  ) : editHistory.items.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-slate-400 py-10 text-sm">No edit history found.</td></tr>
                  ) : editHistory.items.map((row, i) => (
                    <tr key={i} className={`border-t transition-colors hover:bg-slate-50 ${row.action === "DELETED" ? "bg-red-50/30" : ""}`}>
                      <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{row.timestamp || "—"}</td>
                      <td className="p-4"><ActionBadge action={row.action} /></td>
                      <td className="p-4">{row.agent ? <AgentBadge agent={row.agent} /> : <span className="text-slate-300">—</span>}</td>
                      <td className="p-4 font-mono text-xs font-medium text-slate-800">{row.orderNumber || "—"}</td>
                      <td className="p-4 font-mono text-xs text-slate-600">{row.bayNumber || "—"}</td>
                      <td className="p-4 text-sm font-medium text-slate-700">{row.name || "—"}</td>
                      <td className="p-4 text-xs text-slate-500 max-w-[160px] truncate">{row.itemName || "—"}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">{row.externalSku || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-xs text-slate-500">Page {editHistory.page} of {editHistory.totalPages} · {editHistory.total} total</p>
              <div className="flex items-center gap-2">
                <button disabled={editHistory.page <= 1 || editLoading} onClick={() => { const p = editHistory.page - 1; setEditPage(p); loadEditHistory({ page: p }); }} className="rounded-lg border px-2.5 py-1 border-slate-300 disabled:opacity-40"><ChevronLeft size={14} className="text-slate-500" /></button>
                <button disabled={editHistory.page >= editHistory.totalPages || editLoading} onClick={() => { const p = editHistory.page + 1; setEditPage(p); loadEditHistory({ page: p }); }} className="rounded-lg border px-2.5 py-1 border-slate-300 disabled:opacity-40"><ChevronRight size={14} className="text-slate-500" /></button>
              </div>
            </div>
          </div>
        )}

        {/* ══ LOGIN HISTORY TAB ══ */}
        {activeTab === "login-history" && (
          <div>
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-800">Login History</h2>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {loginRecords.length} event{loginRecords.length !== 1 ? "s" : ""} across {loginUniqueUsers} user{loginUniqueUsers !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Stat pills — replaced "Active today" with "Currently online" */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: LogIn,    label: "Total logins",      value: loginRecords.length, color: "bg-blue-50 text-blue-600" },
                  { icon: Users,    label: "Unique users",       value: loginUniqueUsers,    color: "bg-violet-50 text-violet-600" },
                  { icon: Clock,    label: "Logins today",       value: loginTodayCount,     color: "bg-amber-50 text-amber-600" },
                  { icon: Wifi,     label: "Currently online",   value: onlineCount,         color: "bg-emerald-50 text-emerald-600" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} shrink-0`}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-800 tabular-nums leading-none">{value}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b bg-slate-50/60 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input value={loginSearch} onChange={(e) => setLoginSearch(e.target.value)} placeholder="Search by name or email…"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-8 py-2 text-xs text-slate-600 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                {loginSearch && (
                  <button onClick={() => setLoginSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>
                )}
              </div>
              <select value={loginFilterRole} onChange={(e) => setLoginFilterRole(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 outline-none">
                <option value="all">All Roles</option>
                {loginRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={loginFilterDate} onChange={(e) => setLoginFilterDate(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 outline-none">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
              {(loginSearch || loginFilterRole !== "all" || loginFilterDate !== "all") && (
                <button onClick={() => { setLoginSearch(""); setLoginFilterRole("all"); setLoginFilterDate("all"); }}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <Filter size={12} />Clear filters · {filteredLogin.length} of {loginRecords.length}
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-t border-slate-100">
                  <tr>
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider p-4">User</th>
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider p-4 hidden sm:table-cell">Role</th>
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider p-4">Date</th>
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider p-4 hidden md:table-cell">Time</th>
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider p-4 hidden lg:table-cell">When</th>
                  </tr>
                </thead>
                <tbody>
                  {!loginConnected ? (
                    <tr><td colSpan={5} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" />Connecting…</div>
                    </td></tr>
                  ) : filteredLogin.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <LogIn size={28} className="opacity-30" />
                        <p className="text-sm">{loginSearch || loginFilterRole !== "all" || loginFilterDate !== "all" ? "No events match your filters" : "No login events yet"}</p>
                      </div>
                    </td></tr>
                  ) : filteredLogin.map((r, i) => (
                    <tr key={`${r.uid}-${r.loginAt?.seconds}-${i}`} className="border-t hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.displayName} uid={r.uid} isOnline={onlineUids.has(r.uid)} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-slate-800 truncate">{r.displayName}</p>
                              {onlineUids.has(r.uid) && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-medium shrink-0">online</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">{r.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell"><RoleBadge role={r.role} /></td>
                      <td className="p-4 text-sm text-slate-700">{formatDate(r.loginAt)}</td>
                      <td className="p-4 hidden md:table-cell font-mono text-xs text-slate-500">{formatTime(r.loginAt)}</td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${timeAgo(r.loginAt) === "just now" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {timeAgo(r.loginAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loginConnected && filteredLogin.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">{filteredLogin.length} event{filteredLogin.length !== 1 ? "s" : ""} · last 100 per user · newest first</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}