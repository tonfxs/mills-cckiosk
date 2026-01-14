"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
  error?: string;
  title?: string;
  subtitle?: string;
}

function formatSydney(d: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
}

export default function DashboardHeader({
  query,
  onQueryChange,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  error,
  title = "Admin Dashboard",
  subtitle,
}: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setMounted(true);
    setNow(new Date());

    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const headerTime = useMemo(() => {
    if (!mounted) return "—"; // ✅ prevents hydration mismatch
    return formatSydney(now);
  }, [mounted, now]);

  return (
    <div className="sticky top-0 z-20 border-b bg-white/85 backdrop-blur">
      <div className="w-full px-4 sm:px-6 py-4">
        {/* Top row */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-end">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Sydney time: {headerTime}
              {subtitle ? <span className="ml-2 text-gray-400">• {subtitle}</span> : null}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">

            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search (name, phone, order, RMA, bay...)"
              className="w-80 rounded-xl border bg-white px-4 py-2 text-sm text-gray-800 shadow-sm outline-none focus:ring-2 focus:ring-gray-200"
            />

            <button
              onClick={onToggleAutoRefresh}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Auto-refresh: {autoRefresh ? "On" : "Off"}
            </button>

            <button
              onClick={onRefresh}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
