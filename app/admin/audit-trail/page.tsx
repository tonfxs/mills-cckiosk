'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  TrendingUp,
  ScanSearch,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Download,
} from 'lucide-react';

type AuditLog = {
  id: string;
  timestamp: string;
  reference?: string;
  action: string;
  module: string;
  user: string;
  role: string;
  status: 'SUCCESS' | 'FAILED';
  ip?: string;
  changes?: {
    field: string;
    before: string;
    after: string;
  }[];
};

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch logs (replace with your real API)
  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/audit-trail');
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) =>
      `${log.reference} ${log.user} ${log.action}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [logs, search]);

  const todayCount = logs.filter((log) => {
    const today = new Date().toDateString();
    return new Date(log.timestamp).toDateString() === today;
  }).length;

  const failedCount = logs.filter((log) => log.status === 'FAILED').length;


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-slate-600 font-bold">Audit Trail</h1>

        <div className="flex items-center gap-2 text-sm text-green-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Live Monitoring
        </div>
      </div>
            
      <p className="text-sm text-slate-500">All user actions are logged here.</p>


      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-600">
        <StatCard
          title="Total Logs"
          value={logs.length}
          icon={<TrendingUp />}
        />
        <StatCard
          title="Today's Activity"
          value={todayCount}
          icon={<ScanSearch />}
        />
        <StatCard
          title="Failed Actions"
          value={failedCount}
          icon={<AlertTriangle />}
        />
        <StatCard
          title="System Logs"
          value={logs.filter((l) => l.role === 'System').length}
          icon={<ShieldCheck />}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-row gap-4">
        <input
          type="text"
          placeholder="Search reference, user, action..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border focus:ring-1 focus:ring-blue-600 rounded-xl px-3 py-2 w-full text-slate-600 placeholder:text-slate-400"
        />

        <button className="flex items-center text-nowrap justify-center gap-2 bg-blue-600 text-white px-4 py-2 text-sm rounded-xl" >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-3 text-left">Timestamp</th>
              <th className="p-3 text-left">Reference</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Module</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">View</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-3">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">{log.reference || '-'}</td>
                  <td className="p-3 font-medium">{log.action}</td>
                  <td className="p-3">{log.module}</td>
                  <td className="p-3">{log.user}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        log.status === 'SUCCESS'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Audit Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="text-sm space-y-1">
              <p><strong>User:</strong> {selectedLog.user}</p>
              <p><strong>Role:</strong> {selectedLog.role}</p>
              <p><strong>IP:</strong> {selectedLog.ip || '-'}</p>
              <p><strong>Action:</strong> {selectedLog.action}</p>
              <p><strong>Module:</strong> {selectedLog.module}</p>
            </div>

            {selectedLog.changes && selectedLog.changes.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Changes</h3>
                <div className="space-y-3">
                  {selectedLog.changes.map((change, index) => (
                    <div
                      key={index}
                      className="border rounded-xl p-3 bg-gray-50"
                    >
                      <p className="text-sm font-medium mb-1">
                        Field: {change.field}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-red-50 text-red-600 p-2 rounded">
                          <strong>Before:</strong> {change.before}
                        </div>
                        <div className="bg-green-50 text-green-600 p-2 rounded">
                          <strong>After:</strong> {change.after}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
      <div className="text-blue-600">{icon}</div>
    </div>
  );
}