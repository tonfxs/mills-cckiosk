'use client';

import { useEffect, useState } from 'react';
import { HeartPulse, AlertTriangle, CheckCircle, XCircle, RefreshCw, PlusSquare } from 'lucide-react';

export type SheetHealth = {
  sheetName: string;
  usedRows: number;
  totalRows: number;
  availableRows: number;
  availablePct: number;
};

const TABS = ['MASTER LIST', 'Copy of Pickupsv1', 'Copy of Returns'] as const;
type Tab = typeof TABS[number];

function statusFor(pct: number) {
  if (pct > 20) return 'ok';
  if (pct > 5) return 'warn';
  return 'critical';
}

function StatusChip({ status }: { status: 'ok' | 'warn' | 'critical' }) {
  const map = {
    ok:       { icon: CheckCircle,    label: 'Healthy',  chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon_: 'text-emerald-500' },
    warn:     { icon: AlertTriangle,  label: 'Warning',  chip: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon_: 'text-yellow-500' },
    critical: { icon: XCircle,        label: 'Critical', chip: 'bg-red-50 text-red-700 border-red-200',            icon_: 'text-red-500' },
  };
  const { icon: Icon, label, chip, icon_ } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${chip}`}>
      <Icon className={`h-3.5 w-3.5 ${icon_}`} />
      {label}
    </span>
  );
}

const PRESETS = [500, 1000, 2500, 5000];

// ── Confirmation Dialog ────────────────────────────────────────────────────────
function ConfirmExpandDialog({
  sheetName,
  onConfirm,
  onCancel,
  loading,
}: {
  sheetName: string;
  onConfirm: (rows: number) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState<number>(1000);
  const [customValue, setCustomValue] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const customNum = parseInt(customValue, 10);
  const customValid = !isNaN(customNum) && customNum >= 1 && customNum <= 100_000;
  const finalRows = useCustom ? (customValid ? customNum : null) : selected;
  const canSubmit = finalRows !== null && !loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 shrink-0">
            <PlusSquare className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Expand Sheet Rows</h2>
            <p className="text-xs text-slate-400 mt-0.5">This will modify the Google Sheet directly.</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-5 space-y-4">
          {/* Sheet info */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-600">
            <span className="font-medium text-slate-800">Sheet: </span>
            <span className="font-mono">{sheetName}</span>
          </div>

          {/* Row amount picker */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Rows to add</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setSelected(p); setUseCustom(false); }}
                  className={`text-xs font-semibold rounded-lg px-2 py-2 border transition-colors ${
                    !useCustom && selected === p
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {p.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setUseCustom(true)}
                className={`text-xs font-medium shrink-0 transition-colors ${useCustom ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Custom:
              </button>
              <input
                type="number"
                min={1}
                max={100000}
                placeholder="e.g. 3000"
                value={customValue}
                onFocus={() => setUseCustom(true)}
                onChange={(e) => { setCustomValue(e.target.value); setUseCustom(true); }}
                className={`w-full text-xs rounded-lg border px-3 py-2 outline-none transition-colors ${
                  useCustom
                    ? customValid
                      ? 'border-slate-800 ring-1 ring-slate-800'
                      : customValue === ''
                        ? 'border-slate-300'
                        : 'border-red-400 ring-1 ring-red-400'
                    : 'border-slate-200'
                }`}
              />
            </div>
            {useCustom && customValue !== '' && !customValid && (
              <p className="text-xs text-red-500">Enter a number between 1 and 100,000.</p>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Added rows count against your spreadsheet&apos;s 10M cell limit and cannot be undone automatically.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl px-4 py-2.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => finalRows && onConfirm(finalRows)}
            disabled={!canSubmit}
            className="flex-1 text-sm font-medium text-white bg-slate-800 rounded-xl px-4 py-2.5 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Adding…
              </>
            ) : (
              <>Add {finalRows ? finalRows.toLocaleString() : '—'} Rows</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function SheetHealthPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('MASTER LIST');
  const [dataMap, setDataMap] = useState<Partial<Record<Tab, SheetHealth>>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Expand state
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandLoading, setExpandLoading] = useState(false);
  const [expandResult, setExpandResult] = useState<{ success: boolean; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sheet-health', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const map: Partial<Record<Tab, SheetHealth>> = {};
        for (const item of json.data) {
          if (TABS.includes(item.sheetName)) map[item.sheetName as Tab] = item;
        }
        setDataMap(map);
      } else if (json.success && json.data?.sheetName) {
        const tab = json.data.sheetName as Tab;
        if (TABS.includes(tab)) setDataMap({ [tab]: json.data });
      }
      setLastUpdated(new Date());
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleExpandConfirm = async (additionalRows: number) => {
    setExpandLoading(true);
    setExpandResult(null);
    try {
      const res = await fetch('/api/admin/sheet-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetName: activeTab, additionalRows }),
      });
      const json = await res.json();
      if (json.success) {
        setExpandResult({ success: true, message: `Added ${additionalRows.toLocaleString()} rows. New total: ${json.newRows.toLocaleString()}.` });
        await load();
      } else {
        setExpandResult({ success: false, message: json.error ?? 'Failed to expand rows.' });
      }
    } catch (e: any) {
      setExpandResult({ success: false, message: e.message ?? 'Unexpected error.' });
    } finally {
      setExpandLoading(false);
      setShowConfirm(false);
    }
  };

  const current = dataMap[activeTab];
  const status = current ? statusFor(current.availablePct) : null;

  const barColor =
    status === 'ok' ? 'bg-emerald-500' :
    status === 'warn' ? 'bg-yellow-400' :
    status === 'critical' ? 'bg-red-500' :
    'bg-slate-200';

  const tabStatusDot = (tab: Tab) => {
    const d = dataMap[tab];
    if (!d) return 'bg-slate-300';
    const s = statusFor(d.availablePct);
    return s === 'ok' ? 'bg-emerald-400' : s === 'warn' ? 'bg-yellow-400' : 'bg-red-500';
  };

  return (
    <>
      {showConfirm && (
        <ConfirmExpandDialog
          sheetName={activeTab}
          onConfirm={handleExpandConfirm}
          onCancel={() => setShowConfirm(false)}
          loading={expandLoading}
        />
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100">
              <HeartPulse className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Sheet Health</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lastUpdated
                  ? `Last checked ${new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(lastUpdated)}`
                  : 'Checking…'}
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setExpandResult(null); }}
              className={`relative flex items-center gap-2 py-3 pr-5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${tabStatusDot(tab)}`} />
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-6 py-6">
          {loading && !current ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 w-1/3 bg-slate-100 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded-full" />
              <div className="h-4 w-1/2 bg-slate-100 rounded" />
            </div>
          ) : !current ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
              <AlertTriangle className="h-4 w-4" />
              No data available for <span className="font-medium text-slate-600">{activeTab}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Sheet</p>
                  <p className="text-sm font-mono font-medium text-slate-700">{current.sheetName}</p>
                </div>
                {status && <StatusChip status={status} />}
              </div>

              {/* Row counters */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Used Rows',      value: current.usedRows.toLocaleString(),      color: 'text-slate-800' },
                  { label: 'Available Rows', value: current.availableRows.toLocaleString(), color: status === 'ok' ? 'text-emerald-600' : status === 'warn' ? 'text-yellow-600' : 'text-red-600' },
                  { label: 'Total Rows',     value: current.totalRows.toLocaleString(),     color: 'text-slate-800' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Capacity used</span>
                  <span className="font-medium">{(100 - current.availablePct).toFixed(1)}% used · {current.availablePct.toFixed(1)}% free</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${Math.min(100 - current.availablePct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Expand result toast */}
              {expandResult && (
                <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm border ${
                  expandResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {expandResult.success
                    ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <p className="text-xs">{expandResult.message}</p>
                </div>
              )}

              {/* Alerts */}
              {status === 'critical' && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">Sheet is almost full</p>
                    <p className="text-xs text-red-500 mt-0.5">New submissions may fail. Archive or delete old rows, or expand capacity below.</p>
                  </div>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <PlusSquare className="h-3.5 w-3.5" />
                    Add Rows
                  </button>
                </div>
              )}
              {status === 'warn' && (
                <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">Less than 20% of rows remaining</p>
                    <p className="text-xs text-yellow-600 mt-0.5">Consider archiving older data, or expand capacity below.</p>
                  </div>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-800 bg-yellow-200 hover:bg-yellow-300 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <PlusSquare className="h-3.5 w-3.5" />
                    Add Rows
                  </button>
                </div>
              )}
              {status === 'ok' && (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">Sheet is healthy</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Plenty of row capacity available.</p>
                  </div>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <PlusSquare className="h-3.5 w-3.5" />
                    Add Rows
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}