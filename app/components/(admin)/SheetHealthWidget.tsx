'use client';

import { useEffect, useRef, useState } from 'react';
import { HeartPulse, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';

export type SheetHealth = {
  sheetName: string;
  usedRows: number;
  totalRows: number;
  availableRows: number;
  availablePct: number;
};

type Props = {
  data: SheetHealth | null;
  loading: boolean;
};

function statusFor(pct: number) {
  if (pct > 20) return 'ok';
  if (pct > 5) return 'warn';
  return 'critical';
}

export default function SheetHealthWidget({ data, loading }: Props) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const status = data ? statusFor(data.availablePct) : null;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const fabColor =
    status === 'ok' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' :
    status === 'warn' ? 'bg-yellow-400 hover:bg-yellow-500 shadow-yellow-200' :
    status === 'critical' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' :
    'bg-slate-600 hover:bg-slate-700 shadow-slate-200';

  const barColor =
    status === 'ok' ? 'bg-emerald-500' :
    status === 'warn' ? 'bg-yellow-400' :
    status === 'critical' ? 'bg-red-500' :
    'bg-slate-300';

  const chipColor =
    status === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    status === 'warn' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
    status === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
    'bg-slate-50 text-slate-500 border-slate-200';

  const StatusIcon =
    status === 'ok' ? CheckCircle :
    status === 'warn' ? AlertTriangle :
    status === 'critical' ? XCircle :
    HeartPulse;

  const iconColor =
    status === 'ok' ? 'text-emerald-500' :
    status === 'warn' ? 'text-yellow-500' :
    status === 'critical' ? 'text-red-500' :
    'text-slate-400';

  const statusLabel =
    status === 'ok' ? 'Healthy' :
    status === 'warn' ? 'Warning' :
    status === 'critical' ? 'Critical' :
    'Unknown';

  // Pulse ring for warn/critical
  const pulseRing =
    status === 'critical' ? 'animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-40' :
    status === 'warn' ? 'animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-40' :
    null;

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={popoverRef}>
      {/* Popover */}
      {open && (
        <div className="absolute bottom-16 right-0 w-72 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Sheet Health</span>
            </div>
            <div className="flex items-center gap-2">
              {!loading && status && (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${chipColor}`}>
                  <StatusIcon className={`h-3 w-3 ${iconColor}`} />
                  {statusLabel}
                </span>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            {loading || !data ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
                <div className="h-2 w-full bg-slate-100 rounded-full" />
                <div className="h-3 w-2/3 bg-slate-100 rounded" />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-mono truncate">{data.sheetName}</p>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{data.usedRows.toLocaleString()} used</span>
                    <span>{data.availableRows.toLocaleString()} free</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${Math.min(100 - data.availablePct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-right">
                    {data.availablePct.toFixed(1)}% free of {data.totalRows.toLocaleString()} total rows
                  </p>
                </div>

                {status === 'critical' && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                    <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Sheet is almost full. New submissions may fail soon.
                  </div>
                )}
                {status === 'warn' && (
                  <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Less than 20% of rows remaining. Consider archiving old data.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg transition-all duration-200 active:scale-95 ${fabColor}`}
        title="Sheet Health"
      >
        {/* Pulse ring for warn/critical */}
        {pulseRing && <span className={pulseRing} />}
        <HeartPulse className="h-5 w-5 relative z-10" />
      </button>
    </div>
  );
}