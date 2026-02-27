'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshCw,
  ShoppingCart,
  PackageCheck,
  Wrench,
  Users,
  AlertTriangle,
  Copy,
  ScanSearch,
  TrendingUp,
} from 'lucide-react';

import DashboardStatCard from '@/app/components/(admin)/DashboardStatCard';
import SectionShell from '@/app/components/(admin)/SectionShell';
import DataTable, { Column } from '@/app/components/(admin)/DataTable';
import DashboardHeader from '@/app/components/(admin)/DashboardHeader';
import SheetHealthWidget, { SheetHealth } from '@/app/components/(admin)/SheetHealthWidget';

import TodayVsTotalFunnelPanel from '@/app/components/(admin)/Funnel';
import DuplicatesPanel from '@/app/components/(admin)/DuplicatesPanel';
import MissingDataPanel from '@/app/components/(admin)/MissingDataPanel';
import StuckOrdersPanel from '@/app/components/(admin)/StuckOrdersPanel';

import { KioskRow } from '@/app/types/duplicates';

/** ---------------- Types ---------------- */

type RecentPickup = {
  timestamp: string;
  fullName: string;
  phone: string;
  orderNumber: string;
  paymentMethod: string;
  carParkBay: string;
  status: string;
};

type RecentReturn = {
  timestamp: string;
  fullName: string;
  phone: string;
  rmaID: string;
  carParkBay: string;
  status: string;
};

type RecentPart = {
  timestamp: string;
  fullName: string;
  phone: string;
  orderNumber: string;
  carParkBay: string;
  status: string;
};

type StuckAgingSummary = {
  stuckCount: number;
  agingOver30m: number;
  agingOver2h: number;
};

type DataQualitySummary = {
  invalidCount: number;
  missingCount: number;
  topIssues?: Array<{ issue: string; count: number }>;
};

type DuplicateSummary = {
  duplicateCount: number;
  duplicateKeys?: string[];
};

type FunnelSummary = {
  today: { started?: number; submitted?: number; verified?: number; completed?: number };
  total: { started?: number; submitted?: number; verified?: number; completed?: number };
};

type StuckItem = {
  timestamp: string;
  fullName: string;
  phone: string;
  ref: string;
  carParkBay: string;
  status: string;
  type: string;
  ageMinutes: number;
  reason: string;
};

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

type DuplicateGroup = {
  key: string;
  count: number;
  sample: { timestamp: string; fullName: string; phone: string; ref: string; status: string; type: string }[];
};

type MetricsResponse = {
  ordersPickedUpToday: number;
  ordersPickedUpTotal: number;
  recentPickups: RecentPickup[];

  returnItemsReceivedToday: number;
  returnItemsReceivedTotal: number;
  recentReturns: RecentReturn[];

  partsCompletedToday: number;
  partsCompletedTotal: number;
  recentParts: RecentPart[];

  uniqueCustomersToday: number;
  uniqueCustomersTotal: number;

  stuckAging?: StuckAgingSummary;
  dataQuality?: DataQualitySummary;
  duplicates?: DuplicateSummary;
  successFunnel?: FunnelSummary;

  stuckOrders?: StuckItem[];
  missingInvalidRows?: MissingItem[];
  duplicateGroups?: DuplicateGroup[];
};

async function fetchMetrics(signal?: AbortSignal): Promise<MetricsResponse> {
  const res = await fetch('/api/admin/kiosk-metrics', { signal, cache: 'no-store' });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`API returned non-JSON: ${text.slice(0, 200)}`);
  }
  if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to load kiosk metrics');
  return json.data as MetricsResponse;
}

/** ---------- helpers ---------- */

function isLikelyPhone(s: string) {
  const digits = (s || '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

function isLikelyOrderNumber(s: string) {
  const v = (s || '').trim();
  if (!v) return false;
  return /^[A-Za-z0-9-]{4,}$/.test(v);
}

function isLikelyRma(s: string) {
  const v = (s || '').trim();
  if (!v) return false;
  return /^[A-Za-z0-9-]{3,}$/.test(v);
}

function normalizeKey(s: string) {
  return (s || '').trim().toLowerCase();
}

function calcDataQualityFromRecent(
  pickups: RecentPickup[],
  returns: RecentReturn[],
  parts: RecentPart[]
): DataQualitySummary {
  let missing = 0;
  let invalid = 0;
  const issueMap = new Map<string, number>();
  const bump = (k: string) => issueMap.set(k, (issueMap.get(k) || 0) + 1);

  for (const r of pickups) {
    if (!r.fullName?.trim()) (missing++, bump('Pickup: missing fullName'));
    if (!r.phone?.trim()) (missing++, bump('Pickup: missing phone'));
    if (!r.orderNumber?.trim()) (missing++, bump('Pickup: missing orderNumber'));
    if (!r.paymentMethod?.trim()) (missing++, bump('Pickup: missing paymentMethod'));
    if (!r.carParkBay?.trim()) (missing++, bump('Pickup: missing carParkBay'));
    if (!r.status?.trim()) (missing++, bump('Pickup: missing status'));
    if (r.phone?.trim() && !isLikelyPhone(r.phone)) (invalid++, bump('Pickup: invalid phone'));
    if (r.orderNumber?.trim() && !isLikelyOrderNumber(r.orderNumber)) (invalid++, bump('Pickup: invalid orderNumber'));
  }

  for (const r of returns) {
    if (!r.fullName?.trim()) (missing++, bump('Return: missing fullName'));
    if (!r.phone?.trim()) (missing++, bump('Return: missing phone'));
    if (!r.rmaID?.trim()) (missing++, bump('Return: missing rmaID'));
    if (!r.carParkBay?.trim()) (missing++, bump('Return: missing carParkBay'));
    if (!r.status?.trim()) (missing++, bump('Return: missing status'));
    if (r.phone?.trim() && !isLikelyPhone(r.phone)) (invalid++, bump('Return: invalid phone'));
    if (r.rmaID?.trim() && !isLikelyRma(r.rmaID)) (invalid++, bump('Return: invalid rmaID'));
  }

  for (const r of parts) {
    if (!r.fullName?.trim()) (missing++, bump('Parts: missing fullName'));
    if (!r.phone?.trim()) (missing++, bump('Parts: missing phone'));
    if (!r.orderNumber?.trim()) (missing++, bump('Parts: missing orderNumber'));
    if (!r.carParkBay?.trim()) (missing++, bump('Parts: missing carParkBay'));
    if (!r.status?.trim()) (missing++, bump('Parts: missing status'));
    if (r.phone?.trim() && !isLikelyPhone(r.phone)) (invalid++, bump('Parts: invalid phone'));
    if (r.orderNumber?.trim() && !isLikelyOrderNumber(r.orderNumber)) (invalid++, bump('Parts: invalid orderNumber'));
  }

  const topIssues = [...issueMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([issue, count]) => ({ issue, count }));

  return { invalidCount: invalid, missingCount: missing, topIssues };
}

function calcDuplicatesFromRecent(
  pickups: RecentPickup[],
  returns: RecentReturn[],
  parts: RecentPart[]
): DuplicateSummary {
  const seen = new Map<string, number>();
  const keys: string[] = [];
  const add = (prefix: string, raw: string) => {
    const k = `${prefix}:${normalizeKey(raw)}`;
    if (k.endsWith(':')) return;
    const next = (seen.get(k) || 0) + 1;
    seen.set(k, next);
    if (next === 2) keys.push(k);
  };
  for (const r of pickups) add('order', r.orderNumber);
  for (const r of parts) add('order', r.orderNumber);
  for (const r of returns) add('rma', r.rmaID);
  return { duplicateCount: keys.length, duplicateKeys: keys.slice(0, 10) };
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

type WidgetKey = 'stuck' | 'missing' | 'duplicates' | 'funnel' | null;

export default function DashboardClient() {
  const [now, setNow] = useState(() => new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [query, setQuery] = useState('');
  const queryNorm = query.trim().toLowerCase();
  const [activeWidget, setActiveWidget] = useState<WidgetKey>(null);
  const toggleWidget = (key: Exclude<WidgetKey, null>) => {
    setActiveWidget((prev) => (prev === key ? null : key));
  };
  const [mounted, setMounted] = useState(false);

  // Sheet health state
  const [sheetHealth, setSheetHealth] = useState<SheetHealth | null>(null);
  const [sheetHealthLoading, setSheetHealthLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  const [data, setData] = useState<MetricsResponse>({
    ordersPickedUpToday: 0,
    ordersPickedUpTotal: 0,
    recentPickups: [],
    returnItemsReceivedToday: 0,
    returnItemsReceivedTotal: 0,
    recentReturns: [],
    partsCompletedToday: 0,
    partsCompletedTotal: 0,
    recentParts: [],
    uniqueCustomersToday: 0,
    uniqueCustomersTotal: 0,
    stuckOrders: [],
    missingInvalidRows: [],
    duplicateGroups: [],
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const headerTime = useMemo(() => {
    return new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(now);
  }, [now]);

  const loadSheetHealth = async () => {
    try {
      setSheetHealthLoading(true);
      const res = await fetch('/api/admin/sheet-health', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setSheetHealth(json.data);
    } catch {
      // silently fail — non-critical
    } finally {
      setSheetHealthLoading(false);
    }
  };

  const load = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setError('');
      setLoading(true);
      const d = await fetchMetrics(controller.signal);
      setData({
        ...d,
        recentPickups: d.recentPickups ?? [],
        recentReturns: d.recentReturns ?? [],
        recentParts: d.recentParts ?? [],
        stuckOrders: d.stuckOrders ?? [],
        missingInvalidRows: d.missingInvalidRows ?? [],
        duplicateGroups: d.duplicateGroups ?? [],
      });
    } catch (e: any) {
      if (String(e?.name || '').includes('Abort')) return;
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }

    loadSheetHealth();
  };

  useEffect(() => {
    load();
    loadSheetHealth();

    if (!autoRefresh) return;
    const interval = setInterval(() => load(), 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  useEffect(() => { setActiveWidget(null); }, [queryNorm]);

  const pickups = useMemo(() => {
    const list = data.recentPickups ?? [];
    if (!queryNorm) return list;
    return list.filter((r) =>
      [r.timestamp, r.fullName, r.phone, r.orderNumber, r.paymentMethod, r.carParkBay, r.status]
        .join(' ').toLowerCase().includes(queryNorm)
    );
  }, [data.recentPickups, queryNorm]);

  const returns = useMemo(() => {
    const list = data.recentReturns ?? [];
    if (!queryNorm) return list;
    return list.filter((r) =>
      [r.timestamp, r.fullName, r.phone, r.rmaID, r.carParkBay, r.status]
        .join(' ').toLowerCase().includes(queryNorm)
    );
  }, [data.recentReturns, queryNorm]);

  const parts = useMemo(() => {
    const list = data.recentParts ?? [];
    if (!queryNorm) return list;
    return list.filter((r) =>
      [r.timestamp, r.fullName, r.phone, r.orderNumber, r.carParkBay, r.status]
        .join(' ').toLowerCase().includes(queryNorm)
    );
  }, [data.recentParts, queryNorm]);

  const computedQuality = useMemo(
    () => calcDataQualityFromRecent(data.recentPickups ?? [], data.recentReturns ?? [], data.recentParts ?? []),
    [data.recentPickups, data.recentReturns, data.recentParts]
  );

  const computedDuplicates = useMemo(
    () => calcDuplicatesFromRecent(data.recentPickups ?? [], data.recentReturns ?? [], data.recentParts ?? []),
    [data.recentPickups, data.recentReturns, data.recentParts]
  );

  const quality = data.dataQuality ?? computedQuality;
  const duplicates = data.duplicates ?? computedDuplicates;
  const stuck = data.stuckAging;

  const funnelTodayCompleted =
    (data.successFunnel?.today?.completed ?? 0) ||
    (data.ordersPickedUpToday + data.returnItemsReceivedToday + data.partsCompletedToday);
  const funnelTodayStarted = data.successFunnel?.today?.started ?? 0;
  const funnelTotalCompleted =
    (data.successFunnel?.total?.completed ?? 0) ||
    (data.ordersPickedUpTotal + data.returnItemsReceivedTotal + data.partsCompletedTotal);
  const funnelTotalStarted = data.successFunnel?.total?.started ?? 0;
  const todayFunnelRate = funnelTodayStarted ? pct(funnelTodayCompleted, funnelTodayStarted) : null;
  const totalFunnelRate = funnelTotalStarted ? pct(funnelTotalCompleted, funnelTotalStarted) : null;

  const pickupCols: Column<RecentPickup>[] = [
    { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
    { header: 'Order #', accessor: (r) => r.orderNumber, strong: true, minWidth: 120 },
    { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
    { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
    { header: 'Payment', accessor: (r) => r.paymentMethod, minWidth: 140 },
    { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
    { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
  ];

  const returnCols: Column<RecentReturn>[] = [
    { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
    { header: 'RMA ID', accessor: (r) => r.rmaID, strong: true, minWidth: 120 },
    { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
    { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
    { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
    { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
  ];

  const partsCols: Column<RecentPart>[] = [
    { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
    { header: 'Order #', accessor: (r) => r.orderNumber, strong: true, minWidth: 120 },
    { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
    { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
    { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
    { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
  ];

  const stuckPanelItems = useMemo(() => (data.stuckOrders ?? []) as StuckItem[], [data.stuckOrders]);
  const missingPanelItems = useMemo(() => (data.missingInvalidRows ?? []) as MissingItem[], [data.missingInvalidRows]);
<<<<<<< Updated upstream

  // const duplicatePanelGroups = useMemo(
  //   () => (data.duplicateGroups ?? []) as DuplicateGroup[],
  //   [data.duplicateGroups]
  // );

  const duplicatePanelData: KioskRow[] = useMemo(() => {
  return [
    ...(data.recentPickups ?? []).map(
      (r): KioskRow => ({
        timestamp: r.timestamp,
        fullName: r.fullName,
        phone: r.phone,

        // ✅ FIX: normalize here
        ref: normalizeKey(r.orderNumber),

        status: r.status,
        type: 'Pickup',
      })
    ),

    ...(data.recentReturns ?? []).map(
      (r): KioskRow => ({
        timestamp: r.timestamp,
        fullName: r.fullName,
        phone: r.phone,

        // ✅ FIX
        ref: normalizeKey(r.rmaID),

        status: r.status,
        type: 'Return',
      })
    ),

    ...(data.recentParts ?? []).map(
      (r): KioskRow => ({
        timestamp: r.timestamp,
        fullName: r.fullName,
        phone: r.phone,

        // ✅ FIX
        ref: normalizeKey(r.orderNumber),

        status: r.status,
        type: 'Part',
      })
    ),
  ];
}, [data.recentPickups, data.recentReturns, data.recentParts]);



useEffect(() => {
  console.log("duplicatePanelData:", duplicatePanelData);
}, [duplicatePanelData]);


=======
  const duplicatePanelGroups = useMemo(() => (data.duplicateGroups ?? []) as DuplicateGroup[], [data.duplicateGroups]);
>>>>>>> Stashed changes

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        query={query}
        onQueryChange={setQuery}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
        onRefresh={load}
        error={error}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Top stats */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <DashboardStatCard
            title="Pick Up Orders"
            value={loading ? '—' : data.ordersPickedUpToday}
            subtitle={loading ? 'Loading…' : `Today • Total ${data.ordersPickedUpTotal}`}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <DashboardStatCard
            title="Returned Items"
            value={loading ? '—' : data.returnItemsReceivedToday}
            subtitle={loading ? 'Loading…' : `Today • Total ${data.returnItemsReceivedTotal}`}
            icon={<PackageCheck className="h-5 w-5" />}
          />
          <DashboardStatCard
            title="Parts Assistance"
            value={loading ? '—' : data.partsCompletedToday}
            subtitle={loading ? 'Loading…' : `Today • Total ${data.partsCompletedTotal}`}
            icon={<Wrench className="h-5 w-5" />}
          />
          <DashboardStatCard
            title="Customers"
            value={loading ? '—' : data.uniqueCustomersToday}
            subtitle={loading ? 'Loading…' : `Today • Total ${data.uniqueCustomersTotal}`}
            icon={<Users className="h-5 w-5" />}
          />
          <DashboardStatCard
            title="Last Updated"
            value={loading ? '—' : 'Now'}
            subtitle={autoRefresh ? 'Every 30 seconds' : 'Manual'}
            icon={<RefreshCw className="h-5 w-5" />}
          />
        </div>

        {/* Clickable widget cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => toggleWidget('stuck')}
            aria-expanded={activeWidget === 'stuck'}
            className="text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 hover:opacity-95"
          >
            <DashboardStatCard
              title="Stuck / Aging Orders"
              value={loading ? '—' : stuck ? stuck.stuckCount : '—'}
              subtitle={
                loading ? 'Loading…' : stuck
                  ? `>30m: ${stuck.agingOver30m} • >2h: ${stuck.agingOver2h}`
                  : 'Requires API (pending statuses)'
              }
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          </button>

          <button
            type="button"
            onClick={() => toggleWidget('missing')}
            aria-expanded={activeWidget === 'missing'}
            className="text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 hover:opacity-95"
          >
            <DashboardStatCard
              title="Missing / Invalid Data"
              value={loading ? '—' : quality.missingCount + quality.invalidCount}
              subtitle={loading ? 'Loading…' : `Missing: ${quality.missingCount} • Invalid: ${quality.invalidCount}`}
              icon={<ScanSearch className="h-5 w-5" />}
            />
          </button>

          <button
            type="button"
            onClick={() => toggleWidget('duplicates')}
            aria-expanded={activeWidget === 'duplicates'}
            className="text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 hover:opacity-95"
          >
            <DashboardStatCard
              title="Duplicate Alerting"
              value={loading ? '—' : duplicates.duplicateCount}
              subtitle={
                loading ? 'Loading…' : duplicates.duplicateCount ? 'Duplicates detected' : 'No duplicates detected'
              }
              icon={<Copy className="h-5 w-5" />}
            />
          </button>

          <button
            type="button"
            onClick={() => toggleWidget('funnel')}
            aria-expanded={activeWidget === 'funnel'}
            className="text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 hover:opacity-95"
          >
            <DashboardStatCard
              title="Today vs Total Funnel"
              value={loading ? '—' : todayFunnelRate !== null ? `${todayFunnelRate}%` : '—'}
              subtitle={
                loading ? 'Loading…' : todayFunnelRate !== null
                  ? `Today: ${funnelTodayCompleted}/${funnelTodayStarted} • Total: ${totalFunnelRate ?? '—'}%`
                  : `Today completed: ${funnelTodayCompleted}`
              }
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </button>

        </div>

        {/* Floating Sheet Health Button */}
        {/* <SheetHealthWidget data={sheetHealth} loading={sheetHealthLoading} /> */}

        {/* Drill-down panels */}
        {/* <div className="mt-6 space-y-6">
          {activeWidget === 'stuck' && <StuckOrdersPanel items={stuckPanelItems} />}
          {activeWidget === 'missing' && <MissingDataPanel items={missingPanelItems} />}
          {activeWidget === 'duplicates' && <DuplicatesPanel groups={duplicatePanelGroups} />}
          {activeWidget === 'funnel' && (
            <TodayVsTotalFunnelPanel
              today={data.successFunnel?.today ?? { started: funnelTodayStarted, completed: funnelTodayCompleted }}
              total={data.successFunnel?.total ?? { started: funnelTotalStarted, completed: funnelTotalCompleted }}
            />
          )}
        </div> */}

        {/* Drill-down panels */}
        <div className="mt-6 space-y-6">
          {activeWidget === 'stuck' && <StuckOrdersPanel items={stuckPanelItems} />}
          {activeWidget === 'missing' && <MissingDataPanel items={missingPanelItems} />}
          {activeWidget === 'duplicates' && (
          <DuplicatesPanel
            data={duplicatePanelData}
            onUpdateData={(cleanedData: KioskRow[]) => {
              setData((prev) => {
                // Map back to full types expected by MetricsResponse
                const newPickups: RecentPickup[] = cleanedData
                  .filter((r) => r.type === 'Pickup')
                  .map((r) => ({
                    timestamp: r.timestamp,
                    fullName: r.fullName,
                    phone: r.phone,
                    orderNumber: r.ref,    // ref → orderNumber
                    paymentMethod: '',      // default if unknown
                    carParkBay: '',         // default if unknown
                    status: r.status,
                  }));
                
                const newReturns: RecentReturn[] = cleanedData
                  .filter((r) => r.type === 'Return')
                  .map((r) => ({
                    timestamp: r.timestamp,
                    fullName: r.fullName,
                    phone: r.phone,
                    rmaID: r.ref,           // ref → rmaID
                    carParkBay: '',
                    status: r.status,
                  }));
                
                const newParts: RecentPart[] = cleanedData
                  .filter((r) => r.type === 'Part')
                  .map((r) => ({
                    timestamp: r.timestamp,
                    fullName: r.fullName,
                    phone: r.phone,
                    orderNumber: r.ref,     // ref → orderNumber
                    carParkBay: '',
                    status: r.status,
                  }));
                
                return {
                  ...prev,
                  recentPickups: newPickups,
                  recentReturns: newReturns,
                  recentParts: newParts,
                };
              });
            }}
          />
        )}
          

          {activeWidget === 'funnel' && (
            <TodayVsTotalFunnelPanel
              today={data.successFunnel?.today ?? { started: funnelTodayStarted, completed: funnelTodayCompleted }}
              total={data.successFunnel?.total ?? { started: funnelTotalStarted, completed: funnelTotalCompleted }}
            />
          )}
        </div>

        {/* Tables */}
        <div className="mt-6 space-y-6">
          <SectionShell
            title="Recent Pickups"
            subtitle='Latest "Order Collected" rows from MASTER LIST'
            right={<div className="text-xs text-gray-500">{queryNorm ? `Filtered: ${pickups.length}` : `Rows: ${pickups.length}`}</div>}
          >
            <DataTable loading={loading} rows={pickups} columns={pickupCols} emptyText="No pickups found yet." minWidthClass="min-w-[880px]" />
          </SectionShell>

          <SectionShell
            title="Recent Returns"
            subtitle='Latest "Item Received" rows from MASTER LIST'
            right={<div className="text-xs text-gray-500">{queryNorm ? `Filtered: ${returns.length}` : `Rows: ${returns.length}`}</div>}
          >
            <DataTable loading={loading} rows={returns} columns={returnCols} emptyText="No returns found yet." minWidthClass="min-w-[760px]" />
          </SectionShell>

          <SectionShell
            title="Recent Parts Assistance"
            subtitle="Latest completed Parts Assistance rows from MASTER LIST"
            right={<div className="text-xs text-gray-500">{queryNorm ? `Filtered: ${parts.length}` : `Rows: ${parts.length}`}</div>}
          >
            <DataTable loading={loading} rows={parts} columns={partsCols} emptyText="No parts records found yet." minWidthClass="min-w-[760px]" />
          </SectionShell>

          <div className="text-xs text-gray-400">{mounted ? headerTime : '—'}</div>
        </div>
      </div>
    </div>
  );
}