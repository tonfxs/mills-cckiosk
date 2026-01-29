// 'use client';

// import { useEffect, useMemo, useRef, useState } from 'react';
// import { RefreshCw, ShoppingCart, PackageCheck, Wrench, Users } from 'lucide-react';
// import DashboardStatCard from '@/app/components/(admin)/DashboardStatCard';
// import SectionShell from '@/app/components/(admin)/SectionShell';
// import DataTable, { Column } from '@/app/components/(admin)/DataTable';
// import DashboardHeader from '@/app/components/(admin)/DashboardHeader';

// type RecentPickup = {
//   timestamp: string;
//   fullName: string;
//   phone: string;
//   orderNumber: string;
//   paymentMethod: string;
//   carParkBay: string;
//   status: string;
// };

// type RecentReturn = {
//   timestamp: string;
//   fullName: string;
//   phone: string;
//   rmaID: string;
//   carParkBay: string;
//   status: string;
// };

// type RecentPart = {
//   timestamp: string;
//   fullName: string;
//   phone: string;
//   orderNumber: string;
//   carParkBay: string;
//   status: string;
// };

// type MetricsResponse = {
//   ordersPickedUpToday: number;
//   ordersPickedUpTotal: number;
//   recentPickups: RecentPickup[];

//   returnItemsReceivedToday: number;
//   returnItemsReceivedTotal: number;
//   recentReturns: RecentReturn[];

//   partsCompletedToday: number;
//   partsCompletedTotal: number;
//   recentParts: RecentPart[];

//   uniqueCustomersToday: number;
//   uniqueCustomersTotal: number;
// };

// async function fetchMetrics(signal?: AbortSignal): Promise<MetricsResponse> {
//   const res = await fetch('/api/admin/kiosk-metrics', { signal, cache: 'no-store' });
//   const text = await res.text();

//   let json: any;
//   try {
//     json = JSON.parse(text);
//   } catch {
//     throw new Error(`API returned non-JSON: ${text.slice(0, 200)}`);
//   }

//   if (!res.ok || !json?.success) {
//     throw new Error(json?.error || 'Failed to load kiosk metrics');
//   }

//   return json.data as MetricsResponse;
// }

// export default function DashboardClient() {
//   const [now, setNow] = useState(() => new Date());
//   const [autoRefresh, setAutoRefresh] = useState(true);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>('');

//   const [query, setQuery] = useState('');
//   const queryNorm = query.trim().toLowerCase();

//   const [data, setData] = useState<MetricsResponse>({
//     ordersPickedUpToday: 0,
//     ordersPickedUpTotal: 0,
//     recentPickups: [],
//     returnItemsReceivedToday: 0,
//     returnItemsReceivedTotal: 0,
//     recentReturns: [],
//     partsCompletedToday: 0,
//     partsCompletedTotal: 0,
//     recentParts: [],
//     uniqueCustomersToday: 0,
//     uniqueCustomersTotal: 0,
//   });

//   const abortRef = useRef<AbortController | null>(null);

//   useEffect(() => {
//     const t = setInterval(() => setNow(new Date()), 1000);
//     return () => clearInterval(t);
//   }, []);

//   const headerTime = useMemo(() => {
//     return new Intl.DateTimeFormat('en-AU', {
//       timeZone: 'Australia/Sydney',
//       weekday: 'short',
//       year: 'numeric',
//       month: 'short',
//       day: '2-digit',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//     }).format(now);
//   }, [now]);

//   const load = async () => {
//     abortRef.current?.abort();
//     const controller = new AbortController();
//     abortRef.current = controller;

//     try {
//       setError('');
//       setLoading(true);
//       const d = await fetchMetrics(controller.signal);

//       setData({
//         ...d,
//         recentPickups: d.recentPickups ?? [],
//         recentReturns: d.recentReturns ?? [],
//         recentParts: d.recentParts ?? [],
//       });
//     } catch (e: any) {
//       if (String(e?.name || '').includes('Abort')) return;
//       setError(e?.message || 'Failed to load');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();

//     if (!autoRefresh) return;

//     const interval = setInterval(() => load(), 30_000);
//     return () => clearInterval(interval);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [autoRefresh]);

//   const pickups = useMemo(() => {
//     const list = data.recentPickups ?? [];
//     if (!queryNorm) return list;
//     return list.filter((r) =>
//       [r.timestamp, r.fullName, r.phone, r.orderNumber, r.paymentMethod, r.carParkBay, r.status]
//         .join(' ')
//         .toLowerCase()
//         .includes(queryNorm)
//     );
//   }, [data.recentPickups, queryNorm]);

//   const returns = useMemo(() => {
//     const list = data.recentReturns ?? [];
//     if (!queryNorm) return list;
//     return list.filter((r) =>
//       [r.timestamp, r.fullName, r.phone, r.rmaID, r.carParkBay, r.status]
//         .join(' ')
//         .toLowerCase()
//         .includes(queryNorm)
//     );
//   }, [data.recentReturns, queryNorm]);

//   const parts = useMemo(() => {
//     const list = data.recentParts ?? [];
//     if (!queryNorm) return list;
//     return list.filter((r) =>
//       [r.timestamp, r.fullName, r.phone, r.orderNumber, r.carParkBay, r.status]
//         .join(' ')
//         .toLowerCase()
//         .includes(queryNorm)
//     );
//   }, [data.recentParts, queryNorm]);

//   const pickupCols: Column<RecentPickup>[] = [
//     { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
//     { header: 'Order #', accessor: (r) => r.orderNumber, strong: true, minWidth: 120 },
//     { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
//     { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
//     { header: 'Payment', accessor: (r) => r.paymentMethod, minWidth: 140 },
//     { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
//     { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
//   ];

//   const returnCols: Column<RecentReturn>[] = [
//     { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
//     { header: 'RMA ID', accessor: (r) => r.rmaID, strong: true, minWidth: 120 },
//     { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
//     { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
//     { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
//     { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
//   ];

//   const partsCols: Column<RecentPart>[] = [
//     { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
//     { header: 'Order #', accessor: (r) => r.orderNumber, strong: true, minWidth: 120 },
//     { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
//     { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
//     { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
//     { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}

//       <DashboardHeader
//         query={query}
//         onQueryChange={setQuery}
//         autoRefresh={autoRefresh}
//         onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
//         onRefresh={load}
//         error={error}
//       />


//       <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
//         {/* Stats */}
//         <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
//         <DashboardStatCard
//           title="Pick Up Orders"
//           value={loading ? '—' : data.ordersPickedUpToday}
//           subtitle={loading ? 'Loading…' : `Today • Total ${data.ordersPickedUpTotal}`}
//           icon={<ShoppingCart className="h-5 w-5" />}
//         />

//         <DashboardStatCard
//           title="Returned Items"
//           value={loading ? '—' : data.returnItemsReceivedToday}
//           subtitle={loading ? 'Loading…' : `Today • Total ${data.returnItemsReceivedTotal}`}
//           icon={<PackageCheck className="h-5 w-5" />}
//         />

//         <DashboardStatCard
//           title="Parts Assistance"      
//           value={loading ? '—' : data.partsCompletedToday}
//           subtitle={loading ? 'Loading…' : `Today • Total ${data.partsCompletedTotal}`}
//           icon={<Wrench className="h-5 w-5" />}
//         />

//         <DashboardStatCard
//           title="Customers"
//           value={loading ? '—' : data.uniqueCustomersToday}
//           subtitle={loading ? 'Loading…' : `Today • Total ${data.uniqueCustomersTotal}`}
//           icon={<Users className="h-5 w-5" />}
//         />

//         <DashboardStatCard
//           title="Last Updated"
//           value={loading ? '—' : 'Just now'}
//           subtitle={autoRefresh ? 'Every 30 seconds' : 'Manual'}
//           icon={<RefreshCw className="h-5 w-5" />}
//         />
//       </div>


//         <div className="mt-6 space-y-6">
//           <SectionShell
//             title="Recent Pickups"
//             subtitle='Latest "Order Collected" rows from MASTER LIST'
//             right={
//               <div className="text-xs text-gray-500">
//                 {queryNorm ? `Filtered: ${pickups.length}` : `Rows: ${pickups.length}`}
//               </div>
//             }
//           >
//             <DataTable
//               loading={loading}
//               rows={pickups}
//               columns={pickupCols}
//               emptyText="No pickups found yet."
//               minWidthClass="min-w-[880px]"
//             />
//           </SectionShell>

//           <SectionShell
//             title="Recent Returns"
//             subtitle='Latest "Item Received" rows from MASTER LIST'
//             right={
//               <div className="text-xs text-gray-500">
//                 {queryNorm ? `Filtered: ${returns.length}` : `Rows: ${returns.length}`}
//               </div>
//             }
//           >
//             <DataTable
//               loading={loading}
//               rows={returns}
//               columns={returnCols}
//               emptyText="No returns found yet."
//               minWidthClass="min-w-[760px]"
//             />
//           </SectionShell>

//           <SectionShell
//             title="Recent Parts Assistance"
//             subtitle="Latest completed Parts Assistance rows from MASTER LIST"
//             right={
//               <div className="text-xs text-gray-500">
//                 {queryNorm ? `Filtered: ${parts.length}` : `Rows: ${parts.length}`}
//               </div>
//             }
//           >
//             <DataTable
//               loading={loading}
//               rows={parts}
//               columns={partsCols}
//               emptyText="No parts records found yet."
//               minWidthClass="min-w-[760px]"
//             />
//           </SectionShell>
//         </div>
//       </div>
//     </div>
//   );
// }


// 'use client';

// import { useEffect, useMemo, useRef, useState } from 'react';
// import {
//   RefreshCw,
//   ShoppingCart,
//   PackageCheck,
//   Wrench,
//   Users,
//   AlertTriangle,
//   Copy,
//   ScanSearch,
//   TrendingUp,
// } from 'lucide-react';

// import DashboardStatCard from '@/app/components/(admin)/DashboardStatCard';
// import SectionShell from '@/app/components/(admin)/SectionShell';
// import DataTable, { Column } from '@/app/components/(admin)/DataTable';
// import DashboardHeader from '@/app/components/(admin)/DashboardHeader';

// type RecentPickup = {
//   timestamp: string;
//   fullName: string;
//   phone: string;
//   orderNumber: string;
//   paymentMethod: string;
//   carParkBay: string;
//   status: string;
// };

// type RecentReturn = {
//   timestamp: string;
//   fullName: string;
//   phone: string;
//   rmaID: string;
//   carParkBay: string;
//   status: string;
// };

// type RecentPart = {
//   timestamp: string;
//   fullName: string;
//   phone: string;
//   orderNumber: string;
//   carParkBay: string;
//   status: string;
// };

// /**
//  * NEW: Optional alert + funnel fields (backward compatible).
//  * Your current API can ignore these until you’re ready.
//  */
// type StuckAgingSummary = {
//   stuckCount: number; // e.g. status not completed beyond threshold
//   agingOver30m: number;
//   agingOver2h: number;
// };

// type DataQualitySummary = {
//   invalidCount: number;
//   missingCount: number;
//   // optional: top issues for debugging / future UI
//   topIssues?: Array<{ issue: string; count: number }>;
// };

// type DuplicateSummary = {
//   duplicateCount: number;
//   // optional: for future drill-down
//   duplicateKeys?: string[];
// };

// type FunnelSummary = {
//   // “Success funnel” stages are flexible. This is a generic structure.
//   // Example stages: started -> submitted -> verified -> completed
//   today: {
//     started?: number;
//     submitted?: number;
//     verified?: number;
//     completed?: number;
//   };
//   total: {
//     started?: number;
//     submitted?: number;
//     verified?: number;
//     completed?: number;
//   };
// };

// type MetricsResponse = {
//   ordersPickedUpToday: number;
//   ordersPickedUpTotal: number;
//   recentPickups: RecentPickup[];

//   returnItemsReceivedToday: number;
//   returnItemsReceivedTotal: number;
//   recentReturns: RecentReturn[];

//   partsCompletedToday: number;
//   partsCompletedTotal: number;
//   recentParts: RecentPart[];

//   uniqueCustomersToday: number;
//   uniqueCustomersTotal: number;

//   // NEW optional fields:
//   stuckAging?: StuckAgingSummary;
//   dataQuality?: DataQualitySummary;
//   duplicates?: DuplicateSummary;
//   successFunnel?: FunnelSummary;
// };

// async function fetchMetrics(signal?: AbortSignal): Promise<MetricsResponse> {
//   const res = await fetch('/api/admin/kiosk-metrics', { signal, cache: 'no-store' });
//   const text = await res.text();

//   let json: any;
//   try {
//     json = JSON.parse(text);
//   } catch {
//     throw new Error(`API returned non-JSON: ${text.slice(0, 200)}`);
//   }

//   if (!res.ok || !json?.success) {
//     throw new Error(json?.error || 'Failed to load kiosk metrics');
//   }

//   return json.data as MetricsResponse;
// }

// /** ---------- NEW: small helpers for validation + duplicates ---------- */

// function isLikelyPhone(s: string) {
//   const digits = (s || '').replace(/\D/g, '');
//   // AU/PH kiosk can vary; keep it lenient
//   return digits.length >= 8 && digits.length <= 15;
// }

// function isLikelyOrderNumber(s: string) {
//   const v = (s || '').trim();
//   if (!v) return false;
//   // allow alphanum + dashes (kiosk order formats vary)
//   return /^[A-Za-z0-9-]{4,}$/.test(v);
// }

// function isLikelyRma(s: string) {
//   const v = (s || '').trim();
//   if (!v) return false;
//   return /^[A-Za-z0-9-]{3,}$/.test(v);
// }

// function normalizeKey(s: string) {
//   return (s || '').trim().toLowerCase();
// }

// function calcDataQualityFromRecent(
//   pickups: RecentPickup[],
//   returns: RecentReturn[],
//   parts: RecentPart[]
// ): DataQualitySummary {
//   let missing = 0;
//   let invalid = 0;

//   const issueMap = new Map<string, number>();
//   const bump = (k: string) => issueMap.set(k, (issueMap.get(k) || 0) + 1);

//   // Pickups
//   for (const r of pickups) {
//     if (!r.fullName?.trim()) (missing++, bump('Pickup: missing fullName'));
//     if (!r.phone?.trim()) (missing++, bump('Pickup: missing phone'));
//     if (!r.orderNumber?.trim()) (missing++, bump('Pickup: missing orderNumber'));
//     if (!r.paymentMethod?.trim()) (missing++, bump('Pickup: missing paymentMethod'));
//     if (!r.carParkBay?.trim()) (missing++, bump('Pickup: missing carParkBay'));
//     if (!r.status?.trim()) (missing++, bump('Pickup: missing status'));

//     if (r.phone?.trim() && !isLikelyPhone(r.phone)) (invalid++, bump('Pickup: invalid phone'));
//     if (r.orderNumber?.trim() && !isLikelyOrderNumber(r.orderNumber))
//       (invalid++, bump('Pickup: invalid orderNumber'));
//   }

//   // Returns
//   for (const r of returns) {
//     if (!r.fullName?.trim()) (missing++, bump('Return: missing fullName'));
//     if (!r.phone?.trim()) (missing++, bump('Return: missing phone'));
//     if (!r.rmaID?.trim()) (missing++, bump('Return: missing rmaID'));
//     if (!r.carParkBay?.trim()) (missing++, bump('Return: missing carParkBay'));
//     if (!r.status?.trim()) (missing++, bump('Return: missing status'));

//     if (r.phone?.trim() && !isLikelyPhone(r.phone)) (invalid++, bump('Return: invalid phone'));
//     if (r.rmaID?.trim() && !isLikelyRma(r.rmaID)) (invalid++, bump('Return: invalid rmaID'));
//   }

//   // Parts
//   for (const r of parts) {
//     if (!r.fullName?.trim()) (missing++, bump('Parts: missing fullName'));
//     if (!r.phone?.trim()) (missing++, bump('Parts: missing phone'));
//     if (!r.orderNumber?.trim()) (missing++, bump('Parts: missing orderNumber'));
//     if (!r.carParkBay?.trim()) (missing++, bump('Parts: missing carParkBay'));
//     if (!r.status?.trim()) (missing++, bump('Parts: missing status'));

//     if (r.phone?.trim() && !isLikelyPhone(r.phone)) (invalid++, bump('Parts: invalid phone'));
//     if (r.orderNumber?.trim() && !isLikelyOrderNumber(r.orderNumber))
//       (invalid++, bump('Parts: invalid orderNumber'));
//   }

//   const topIssues = [...issueMap.entries()]
//     .sort((a, b) => b[1] - a[1])
//     .slice(0, 4)
//     .map(([issue, count]) => ({ issue, count }));

//   return { invalidCount: invalid, missingCount: missing, topIssues };
// }

// function calcDuplicatesFromRecent(
//   pickups: RecentPickup[],
//   returns: RecentReturn[],
//   parts: RecentPart[]
// ): DuplicateSummary {
//   const seen = new Map<string, number>();
//   const keys: string[] = [];

//   const add = (prefix: string, raw: string) => {
//     const k = `${prefix}:${normalizeKey(raw)}`;
//     if (k.endsWith(':')) return;
//     const next = (seen.get(k) || 0) + 1;
//     seen.set(k, next);
//     if (next === 2) keys.push(k);
//   };

//   for (const r of pickups) add('order', r.orderNumber);
//   for (const r of parts) add('order', r.orderNumber);
//   for (const r of returns) add('rma', r.rmaID);

//   return { duplicateCount: keys.length, duplicateKeys: keys.slice(0, 10) };
// }

// function pct(n: number, d: number) {
//   if (!d) return 0;
//   return Math.round((n / d) * 100);
// }

// export default function DashboardClient() {
//   const [now, setNow] = useState(() => new Date());
//   const [autoRefresh, setAutoRefresh] = useState(true);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>('');

//   const [query, setQuery] = useState('');
//   const queryNorm = query.trim().toLowerCase();

//   const [data, setData] = useState<MetricsResponse>({
//     ordersPickedUpToday: 0,
//     ordersPickedUpTotal: 0,
//     recentPickups: [],
//     returnItemsReceivedToday: 0,
//     returnItemsReceivedTotal: 0,
//     recentReturns: [],
//     partsCompletedToday: 0,
//     partsCompletedTotal: 0,
//     recentParts: [],
//     uniqueCustomersToday: 0,
//     uniqueCustomersTotal: 0,
//   });

//   const abortRef = useRef<AbortController | null>(null);

//   useEffect(() => {
//     const t = setInterval(() => setNow(new Date()), 1000);
//     return () => clearInterval(t);
//   }, []);

//   const headerTime = useMemo(() => {
//     return new Intl.DateTimeFormat('en-AU', {
//       timeZone: 'Australia/Sydney',
//       weekday: 'short',
//       year: 'numeric',
//       month: 'short',
//       day: '2-digit',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//     }).format(now);
//   }, [now]);

//   const load = async () => {
//     abortRef.current?.abort();
//     const controller = new AbortController();
//     abortRef.current = controller;

//     try {
//       setError('');
//       setLoading(true);
//       const d = await fetchMetrics(controller.signal);

//       setData({
//         ...d,
//         recentPickups: d.recentPickups ?? [],
//         recentReturns: d.recentReturns ?? [],
//         recentParts: d.recentParts ?? [],
//       });
//     } catch (e: any) {
//       if (String(e?.name || '').includes('Abort')) return;
//       setError(e?.message || 'Failed to load');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();

//     if (!autoRefresh) return;

//     const interval = setInterval(() => load(), 30_000);
//     return () => clearInterval(interval);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [autoRefresh]);

//   const pickups = useMemo(() => {
//     const list = data.recentPickups ?? [];
//     if (!queryNorm) return list;
//     return list.filter((r) =>
//       [r.timestamp, r.fullName, r.phone, r.orderNumber, r.paymentMethod, r.carParkBay, r.status]
//         .join(' ')
//         .toLowerCase()
//         .includes(queryNorm)
//     );
//   }, [data.recentPickups, queryNorm]);

//   const returns = useMemo(() => {
//     const list = data.recentReturns ?? [];
//     if (!queryNorm) return list;
//     return list.filter((r) =>
//       [r.timestamp, r.fullName, r.phone, r.rmaID, r.carParkBay, r.status]
//         .join(' ')
//         .toLowerCase()
//         .includes(queryNorm)
//     );
//   }, [data.recentReturns, queryNorm]);

//   const parts = useMemo(() => {
//     const list = data.recentParts ?? [];
//     if (!queryNorm) return list;
//     return list.filter((r) =>
//       [r.timestamp, r.fullName, r.phone, r.orderNumber, r.carParkBay, r.status]
//         .join(' ')
//         .toLowerCase()
//         .includes(queryNorm)
//     );
//   }, [data.recentParts, queryNorm]);

//   /** NEW: compute data quality + duplicates even without API support */
//   const computedQuality = useMemo(
//     () => calcDataQualityFromRecent(data.recentPickups ?? [], data.recentReturns ?? [], data.recentParts ?? []),
//     [data.recentPickups, data.recentReturns, data.recentParts]
//   );

//   const computedDuplicates = useMemo(
//     () => calcDuplicatesFromRecent(data.recentPickups ?? [], data.recentReturns ?? [], data.recentParts ?? []),
//     [data.recentPickups, data.recentReturns, data.recentParts]
//   );

//   /** NEW: success funnel fallback (best-effort) */
//   const funnelTodayCompleted =
//     (data.successFunnel?.today?.completed ?? 0) ||
//     (data.ordersPickedUpToday + data.returnItemsReceivedToday + data.partsCompletedToday);

//   const funnelTodayStarted = data.successFunnel?.today?.started ?? 0; // needs API to be real
//   const funnelTotalCompleted =
//     (data.successFunnel?.total?.completed ?? 0) ||
//     (data.ordersPickedUpTotal + data.returnItemsReceivedTotal + data.partsCompletedTotal);

//   const funnelTotalStarted = data.successFunnel?.total?.started ?? 0; // needs API to be real

//   const todayFunnelRate = funnelTodayStarted ? pct(funnelTodayCompleted, funnelTodayStarted) : null;
//   const totalFunnelRate = funnelTotalStarted ? pct(funnelTotalCompleted, funnelTotalStarted) : null;

//   const pickupCols: Column<RecentPickup>[] = [
//     { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
//     { header: 'Order #', accessor: (r) => r.orderNumber, strong: true, minWidth: 120 },
//     { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
//     { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
//     { header: 'Payment', accessor: (r) => r.paymentMethod, minWidth: 140 },
//     { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
//     { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
//   ];

//   const returnCols: Column<RecentReturn>[] = [
//     { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
//     { header: 'RMA ID', accessor: (r) => r.rmaID, strong: true, minWidth: 120 },
//     { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
//     { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
//     { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
//     { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
//   ];

//   const partsCols: Column<RecentPart>[] = [
//     { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
//     { header: 'Order #', accessor: (r) => r.orderNumber, strong: true, minWidth: 120 },
//     { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
//     { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
//     { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
//     { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
//   ];

//   // Prefer API values if present, else fallback computed
//   const quality = data.dataQuality ?? computedQuality;
//   const duplicates = data.duplicates ?? computedDuplicates;
//   const stuck = data.stuckAging;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <DashboardHeader
//         query={query}
//         onQueryChange={setQuery}
//         autoRefresh={autoRefresh}
//         onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
//         onRefresh={load}
//         error={error}
//       />

//       <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
//         {/* Existing Stats */}
//         <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
//           <DashboardStatCard
//             title="Pick Up Orders"
//             value={loading ? '—' : data.ordersPickedUpToday}
//             subtitle={loading ? 'Loading…' : `Today • Total ${data.ordersPickedUpTotal}`}
//             icon={<ShoppingCart className="h-5 w-5" />}
//           />

//           <DashboardStatCard
//             title="Returned Items"
//             value={loading ? '—' : data.returnItemsReceivedToday}
//             subtitle={loading ? 'Loading…' : `Today • Total ${data.returnItemsReceivedTotal}`}
//             icon={<PackageCheck className="h-5 w-5" />}
//           />

//           <DashboardStatCard
//             title="Parts Assistance"
//             value={loading ? '—' : data.partsCompletedToday}
//             subtitle={loading ? 'Loading…' : `Today • Total ${data.partsCompletedTotal}`}
//             icon={<Wrench className="h-5 w-5" />}
//           />

//           <DashboardStatCard
//             title="Customers"
//             value={loading ? '—' : data.uniqueCustomersToday}
//             subtitle={loading ? 'Loading…' : `Today • Total ${data.uniqueCustomersTotal}`}
//             icon={<Users className="h-5 w-5" />}
//           />

//           <DashboardStatCard
//             title="Last Updated"
//             value={loading ? '—' : 'Just now'}
//             subtitle={autoRefresh ? 'Every 30 seconds' : 'Manual'}
//             icon={<RefreshCw className="h-5 w-5" />}
//           />
//         </div>

//         {/* NEW: Widget row */}
//         <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
//           <DashboardStatCard
//             title="Stuck / Aging Orders"
//             value={loading ? '—' : stuck ? stuck.stuckCount : '—'}
//             subtitle={
//               loading
//                 ? 'Loading…'
//                 : stuck
//                   ? `>30m: ${stuck.agingOver30m} • >2h: ${stuck.agingOver2h}`
//                   : 'Requires API (pending statuses)'
//             }
//             icon={<AlertTriangle className="h-5 w-5" />}
//           />

//           <DashboardStatCard
//             title="Missing / Invalid Data"
//             value={loading ? '—' : quality.missingCount + quality.invalidCount}
//             subtitle={
//               loading
//                 ? 'Loading…'
//                 : `Missing: ${quality.missingCount} • Invalid: ${quality.invalidCount}`
//             }
//             icon={<ScanSearch className="h-5 w-5" />}
//           />

//           <DashboardStatCard
//             title="Duplicate Alerting"
//             value={loading ? '—' : duplicates.duplicateCount}
//             subtitle={loading ? 'Loading…' : duplicates.duplicateCount ? 'Potential duplicates detected' : 'No duplicates detected'}
//             icon={<Copy className="h-5 w-5" />}
//           />

//           <DashboardStatCard
//             title="Success Funnel"
//             value={
//               loading
//                 ? '—'
//                 : todayFunnelRate !== null
//                   ? `${todayFunnelRate}%`
//                   : '—'
//             }
//             subtitle={
//               loading
//                 ? 'Loading…'
//                 : todayFunnelRate !== null
//                   ? `Today: ${funnelTodayCompleted}/${funnelTodayStarted} • Total: ${totalFunnelRate ?? '—'}%`
//                   : `Today completed: ${funnelTodayCompleted} • (needs API for started)`
//             }
//             icon={<TrendingUp className="h-5 w-5" />}
//           />
//         </div>

//         <div className="mt-6 space-y-6">
//           <SectionShell
//             title="Recent Pickups"
//             subtitle='Latest "Order Collected" rows from MASTER LIST'
//             right={<div className="text-xs text-gray-500">{queryNorm ? `Filtered: ${pickups.length}` : `Rows: ${pickups.length}`}</div>}
//           >
//             <DataTable
//               loading={loading}
//               rows={pickups}
//               columns={pickupCols}
//               emptyText="No pickups found yet."
//               minWidthClass="min-w-[880px]"
//             />
//           </SectionShell>

//           <SectionShell
//             title="Recent Returns"
//             subtitle='Latest "Item Received" rows from MASTER LIST'
//             right={<div className="text-xs text-gray-500">{queryNorm ? `Filtered: ${returns.length}` : `Rows: ${returns.length}`}</div>}
//           >
//             <DataTable
//               loading={loading}
//               rows={returns}
//               columns={returnCols}
//               emptyText="No returns found yet."
//               minWidthClass="min-w-[760px]"
//             />
//           </SectionShell>

//           <SectionShell
//             title="Recent Parts Assistance"
//             subtitle="Latest completed Parts Assistance rows from MASTER LIST"
//             right={<div className="text-xs text-gray-500">{queryNorm ? `Filtered: ${parts.length}` : `Rows: ${parts.length}`}</div>}
//           >
//             <DataTable
//               loading={loading}
//               rows={parts}
//               columns={partsCols}
//               emptyText="No parts records found yet."
//               minWidthClass="min-w-[760px]"
//             />
//           </SectionShell>
//         </div>

//         {/* Optional debug footer (remove anytime) */}
//         <div className="mt-6 text-xs text-gray-400">
//           {headerTime}
//         </div>
//       </div>
//     </div>
//   );
// }

// 15/01/2026
// 'use client';

// import { useEffect, useMemo, useRef, useState } from 'react';
// import {
//   RefreshCw,
//   ShoppingCart,
//   PackageCheck,
//   Wrench,
//   Users,
//   AlertTriangle,
//   Copy,
//   ScanSearch,
//   TrendingUp,
// } from 'lucide-react';

// import DashboardStatCard from '@/app/components/(admin)/DashboardStatCard';
// import SectionShell from '@/app/components/(admin)/SectionShell';
// import DataTable, { Column } from '@/app/components/(admin)/DataTable';
// import DashboardHeader from '@/app/components/(admin)/DashboardHeader';

// // import { AlertsPanel } from '@/app/components/(admin)/AlertsPanel';

// import TodayVsTotalFunnelPanel from '@/app/components/(admin)/Funnel';
// import DuplicatesPanel from '@/app/components/(admin)/DuplicatesPanel';
// import MissingDataPanel from '@/app/components/(admin)/MissingDataPanel';
// import StuckOrdersPanel from '@/app/components/(admin)/StuckOrdersPanel';

// type RecentPickup = {
//   timestamp: string;
//   fullName: string;
//   phone: string;
//   orderNumber: string;
//   paymentMethod: string;
//   carParkBay: string;
//   status: string;
// };

// type RecentReturn = {
//   timestamp: string;
//   fullName: string;
//   phone: string;
//   rmaID: string;
//   carParkBay: string;
//   status: string;
// };

// type RecentPart = {
//   timestamp: string;
//   fullName: string;
//   phone: string;
//   orderNumber: string;
//   carParkBay: string;
//   status: string;
// };

// /**
//  * These are OPTIONAL fields coming from your API.
//  * If your API doesn’t return them yet, panels will show empty lists.
//  */
// type StuckAgingSummary = {
//   stuckCount: number;
//   agingOver30m: number;
//   agingOver2h: number;
// };

// type DataQualitySummary = {
//   invalidCount: number;
//   missingCount: number;
//   topIssues?: Array<{ issue: string; count: number }>;
// };

// type DuplicateSummary = {
//   duplicateCount: number;
//   duplicateKeys?: string[];
// };

// type FunnelSummary = {
//   today: { started?: number; submitted?: number; verified?: number; completed?: number };
//   total: { started?: number; submitted?: number; verified?: number; completed?: number };
// };

// // These “table rows” are what your panels usually need.
// // If your panels already define their own types, that’s fine — TS will infer via props.
// // (If you want strict typing, align these with your actual panel prop types.)
// type StuckOrderRow = {
//   timestamp: string;
//   ageMinutes?: number;
//   type: string;
//   refId: string;
//   fullName: string;
//   phone: string;
//   carParkBay: string;
//   status: string;
// };

// type MissingInvalidRow = {
//   timestamp: string;
//   type: string;
//   refId: string;
//   fullName: string;
//   phone: string;
//   paymentMethod: string;
//   carParkBay: string;
//   status: string;
//   issues?: string[];
// };

// type DuplicateGroup = {
//   key: string;
//   count: number;
//   sample: { timestamp: string; fullName: string; phone: string; ref: string; status: string; type: string }[];
// };

// type MetricsResponse = {
//   ordersPickedUpToday: number;
//   ordersPickedUpTotal: number;
//   recentPickups: RecentPickup[];

//   returnItemsReceivedToday: number;
//   returnItemsReceivedTotal: number;
//   recentReturns: RecentReturn[];

//   partsCompletedToday: number;
//   partsCompletedTotal: number;
//   recentParts: RecentPart[];

//   uniqueCustomersToday: number;
//   uniqueCustomersTotal: number;

//   // Optional widget data
//   stuckAging?: StuckAgingSummary;
//   dataQuality?: DataQualitySummary;
//   duplicates?: DuplicateSummary;
//   successFunnel?: FunnelSummary;

//   // Optional drill-down table data (recommended from API)
//   stuckOrders?: StuckOrderRow[];
//   missingInvalidRows?: MissingInvalidRow[];
//   duplicateGroups?: DuplicateGroup[];
// };

// async function fetchMetrics(signal?: AbortSignal): Promise<MetricsResponse> {
//   const res = await fetch('/api/admin/kiosk-metrics', { signal, cache: 'no-store' });
//   const text = await res.text();

//   let json: any;
//   try {
//     json = JSON.parse(text);
//   } catch {
//     throw new Error(`API returned non-JSON: ${text.slice(0, 200)}`);
//   }

//   if (!res.ok || !json?.success) {
//     throw new Error(json?.error || 'Failed to load kiosk metrics');
//   }

//   return json.data as MetricsResponse;
// }

// /** ---------- small helpers (fallback computations) ---------- */

// function isLikelyPhone(s: string) {
//   const digits = (s || '').replace(/\D/g, '');
//   return digits.length >= 8 && digits.length <= 15;
// }

// function isLikelyOrderNumber(s: string) {
//   const v = (s || '').trim();
//   if (!v) return false;
//   return /^[A-Za-z0-9-]{4,}$/.test(v);
// }

// function isLikelyRma(s: string) {
//   const v = (s || '').trim();
//   if (!v) return false;
//   return /^[A-Za-z0-9-]{3,}$/.test(v);
// }

// function normalizeKey(s: string) {
//   return (s || '').trim().toLowerCase();
// }

// function calcDataQualityFromRecent(
//   pickups: RecentPickup[],
//   returns: RecentReturn[],
//   parts: RecentPart[]
// ): DataQualitySummary {
//   let missing = 0;
//   let invalid = 0;

//   const issueMap = new Map<string, number>();
//   const bump = (k: string) => issueMap.set(k, (issueMap.get(k) || 0) + 1);

//   for (const r of pickups) {
//     if (!r.fullName?.trim()) (missing++, bump('Pickup: missing fullName'));
//     if (!r.phone?.trim()) (missing++, bump('Pickup: missing phone'));
//     if (!r.orderNumber?.trim()) (missing++, bump('Pickup: missing orderNumber'));
//     if (!r.paymentMethod?.trim()) (missing++, bump('Pickup: missing paymentMethod'));
//     if (!r.carParkBay?.trim()) (missing++, bump('Pickup: missing carParkBay'));
//     if (!r.status?.trim()) (missing++, bump('Pickup: missing status'));

//     if (r.phone?.trim() && !isLikelyPhone(r.phone)) (invalid++, bump('Pickup: invalid phone'));
//     if (r.orderNumber?.trim() && !isLikelyOrderNumber(r.orderNumber))
//       (invalid++, bump('Pickup: invalid orderNumber'));
//   }

//   for (const r of returns) {
//     if (!r.fullName?.trim()) (missing++, bump('Return: missing fullName'));
//     if (!r.phone?.trim()) (missing++, bump('Return: missing phone'));
//     if (!r.rmaID?.trim()) (missing++, bump('Return: missing rmaID'));
//     if (!r.carParkBay?.trim()) (missing++, bump('Return: missing carParkBay'));
//     if (!r.status?.trim()) (missing++, bump('Return: missing status'));

//     if (r.phone?.trim() && !isLikelyPhone(r.phone)) (invalid++, bump('Return: invalid phone'));
//     if (r.rmaID?.trim() && !isLikelyRma(r.rmaID)) (invalid++, bump('Return: invalid rmaID'));
//   }

//   for (const r of parts) {
//     if (!r.fullName?.trim()) (missing++, bump('Parts: missing fullName'));
//     if (!r.phone?.trim()) (missing++, bump('Parts: missing phone'));
//     if (!r.orderNumber?.trim()) (missing++, bump('Parts: missing orderNumber'));
//     if (!r.carParkBay?.trim()) (missing++, bump('Parts: missing carParkBay'));
//     if (!r.status?.trim()) (missing++, bump('Parts: missing status'));

//     if (r.phone?.trim() && !isLikelyPhone(r.phone)) (invalid++, bump('Parts: invalid phone'));
//     if (r.orderNumber?.trim() && !isLikelyOrderNumber(r.orderNumber))
//       (invalid++, bump('Parts: invalid orderNumber'));
//   }

//   const topIssues = [...issueMap.entries()]
//     .sort((a, b) => b[1] - a[1])
//     .slice(0, 6)
//     .map(([issue, count]) => ({ issue, count }));

//   return { invalidCount: invalid, missingCount: missing, topIssues };
// }

// function calcDuplicatesFromRecent(
//   pickups: RecentPickup[],
//   returns: RecentReturn[],
//   parts: RecentPart[]
// ): DuplicateSummary {
//   const seen = new Map<string, number>();
//   const keys: string[] = [];

//   const add = (prefix: string, raw: string) => {
//     const k = `${prefix}:${normalizeKey(raw)}`;
//     if (k.endsWith(':')) return;
//     const next = (seen.get(k) || 0) + 1;
//     seen.set(k, next);
//     if (next === 2) keys.push(k);
//   };

//   for (const r of pickups) add('order', r.orderNumber);
//   for (const r of parts) add('order', r.orderNumber);
//   for (const r of returns) add('rma', r.rmaID);

//   return { duplicateCount: keys.length, duplicateKeys: keys.slice(0, 10) };
// }

// function pct(n: number, d: number) {
//   if (!d) return 0;
//   return Math.round((n / d) * 100);
// }

// function parseTimestampToMs(ts: string) {
//   if (!ts) return NaN;

//   // Try ISO first
//   const iso = Date.parse(ts);
//   if (Number.isFinite(iso)) return iso;

//   // Try AU format: "DD/MM/YYYY HH:mm" or "DD/MM/YYYY HH:mm:ss"
//   const m = ts.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
//   if (!m) return NaN;

//   let dd = Number(m[1]);
//   let mm = Number(m[2]);
//   let yyyy = Number(m[3]);
//   let hh = Number(m[4]);
//   const min = Number(m[5]);
//   const sec = Number(m[6] ?? 0);
//   const ampm = (m[7] ?? '').toUpperCase();

//   if (ampm) {
//     if (ampm === 'PM' && hh < 12) hh += 12;
//     if (ampm === 'AM' && hh === 12) hh = 0;
//   }

//   // local time
//   return new Date(yyyy, mm - 1, dd, hh, min, sec).getTime();
// }

// function ageMinutesFromTimestamp(ts: string) {
//   const ms = parseTimestampToMs(ts);
//   if (!Number.isFinite(ms)) return null;
//   return Math.max(0, Math.round((Date.now() - ms) / 60000));
// }

// function isDoneStatus(s: string) {
//   const v = (s ?? '').toLowerCase();
//   // tune these keywords to match your sheet statuses
//   return (
//     v.includes('collected') ||
//     v.includes('received') ||
//     v.includes('completed') ||
//     v.includes('done') ||
//     v.includes('success')
//   );
// }


// /** Which drilldown is currently open */
// type WidgetKey = 'stuck' | 'missing' | 'duplicates' | 'funnel' | null;

// export default function DashboardClient() {
//   const [now, setNow] = useState(() => new Date());
//   const [autoRefresh, setAutoRefresh] = useState(true);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>('');

//   const [query, setQuery] = useState('');
//   const queryNorm = query.trim().toLowerCase();

//   // ✅ NEW: active panel
//   const [activeWidget, setActiveWidget] = useState<WidgetKey>(null);
//   const toggleWidget = (key: Exclude<WidgetKey, null>) => {
//     setActiveWidget((prev) => (prev === key ? null : key));
//   };

//   const [data, setData] = useState<MetricsResponse>({
//     ordersPickedUpToday: 0,
//     ordersPickedUpTotal: 0,
//     recentPickups: [],
//     returnItemsReceivedToday: 0,
//     returnItemsReceivedTotal: 0,
//     recentReturns: [],
//     partsCompletedToday: 0,
//     partsCompletedTotal: 0,
//     recentParts: [],
//     uniqueCustomersToday: 0,
//     uniqueCustomersTotal: 0,
//   });

//   const abortRef = useRef<AbortController | null>(null);

//   useEffect(() => {
//     const t = setInterval(() => setNow(new Date()), 1000);
//     return () => clearInterval(t);
//   }, []);

//   const headerTime = useMemo(() => {
//     return new Intl.DateTimeFormat('en-AU', {
//       timeZone: 'Australia/Sydney',
//       weekday: 'short',
//       year: 'numeric',
//       month: 'short',
//       day: '2-digit',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//     }).format(now);
//   }, [now]);

//   const load = async () => {
//     abortRef.current?.abort();
//     const controller = new AbortController();
//     abortRef.current = controller;

//     try {
//       setError('');
//       setLoading(true);

//       const d = await fetchMetrics(controller.signal);

//       setData({
//         ...d,
//         recentPickups: d.recentPickups ?? [],
//         recentReturns: d.recentReturns ?? [],
//         recentParts: d.recentParts ?? [],
//         stuckOrders: d.stuckOrders ?? [],
//         missingInvalidRows: d.missingInvalidRows ?? [],
//          duplicateGroups: d.duplicateGroups ?? [],
//       });
//     } catch (e: any) {
//       if (String(e?.name || '').includes('Abort')) return;
//       setError(e?.message || 'Failed to load');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();

//     if (!autoRefresh) return;

//     const interval = setInterval(() => load(), 30_000);
//     return () => clearInterval(interval);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [autoRefresh]);

//   // Optional: close panel when searching/filtering
//   useEffect(() => {
//     setActiveWidget(null);
//   }, [queryNorm]);

//   const pickups = useMemo(() => {
//     const list = data.recentPickups ?? [];
//     if (!queryNorm) return list;
//     return list.filter((r) =>
//       [r.timestamp, r.fullName, r.phone, r.orderNumber, r.paymentMethod, r.carParkBay, r.status]
//         .join(' ')
//         .toLowerCase()
//         .includes(queryNorm)
//     );
//   }, [data.recentPickups, queryNorm]);

//   const returns = useMemo(() => {
//     const list = data.recentReturns ?? [];
//     if (!queryNorm) return list;
//     return list.filter((r) =>
//       [r.timestamp, r.fullName, r.phone, r.rmaID, r.carParkBay, r.status]
//         .join(' ')
//         .toLowerCase()
//         .includes(queryNorm)
//     );
//   }, [data.recentReturns, queryNorm]);

//   const parts = useMemo(() => {
//     const list = data.recentParts ?? [];
//     if (!queryNorm) return list;
//     return list.filter((r) =>
//       [r.timestamp, r.fullName, r.phone, r.orderNumber, r.carParkBay, r.status]
//         .join(' ')
//         .toLowerCase()
//         .includes(queryNorm)
//     );
//   }, [data.recentParts, queryNorm]);

//   // Fallback computations if API doesn’t provide them yet
//   const computedQuality = useMemo(
//     () => calcDataQualityFromRecent(data.recentPickups ?? [], data.recentReturns ?? [], data.recentParts ?? []),
//     [data.recentPickups, data.recentReturns, data.recentParts]
//   );

//   const computedDuplicates = useMemo(
//     () => calcDuplicatesFromRecent(data.recentPickups ?? [], data.recentReturns ?? [], data.recentParts ?? []),
//     [data.recentPickups, data.recentReturns, data.recentParts]
//   );

//   const quality = data.dataQuality ?? computedQuality;
//   const duplicates = data.duplicates ?? computedDuplicates;
//   const stuck = data.stuckAging;

//   // Funnel fallback: we can show completed totals even if started isn’t present
//   const funnelTodayCompleted =
//     (data.successFunnel?.today?.completed ?? 0) ||
//     (data.ordersPickedUpToday + data.returnItemsReceivedToday + data.partsCompletedToday);

//   const funnelTodayStarted = data.successFunnel?.today?.started ?? 0;

//   const funnelTotalCompleted =
//     (data.successFunnel?.total?.completed ?? 0) ||
//     (data.ordersPickedUpTotal + data.returnItemsReceivedTotal + data.partsCompletedTotal);

//   const funnelTotalStarted = data.successFunnel?.total?.started ?? 0;

//   const todayFunnelRate = funnelTodayStarted ? pct(funnelTodayCompleted, funnelTodayStarted) : null;
//   const totalFunnelRate = funnelTotalStarted ? pct(funnelTotalCompleted, funnelTotalStarted) : null;

//   const pickupCols: Column<RecentPickup>[] = [
//     { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
//     { header: 'Order #', accessor: (r) => r.orderNumber, strong: true, minWidth: 120 },
//     { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
//     { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
//     { header: 'Payment', accessor: (r) => r.paymentMethod, minWidth: 140 },
//     { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
//     { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
//   ];

//   const returnCols: Column<RecentReturn>[] = [
//     { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
//     { header: 'RMA ID', accessor: (r) => r.rmaID, strong: true, minWidth: 120 },
//     { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
//     { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
//     { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
//     { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
//   ];

//   const partsCols: Column<RecentPart>[] = [
//     { header: 'Time', accessor: (r) => r.timestamp, minWidth: 160 },
//     { header: 'Order #', accessor: (r) => r.orderNumber, strong: true, minWidth: 120 },
//     { header: 'Name', accessor: (r) => r.fullName, minWidth: 180 },
//     { header: 'Phone', accessor: (r) => r.phone, minWidth: 130 },
//     { header: 'Bay', accessor: (r) => r.carParkBay, minWidth: 120 },
//     { header: 'Status', accessor: (r) => r.status, pill: true, minWidth: 140 },
//   ];


//   // ---- Panel data mapping (safe defaults) ----

// const stuckPanelItems = useMemo(() => {
//   const out: any[] = [];

//   const add = (base: any, type: string, ref: string) => {
//     const age = ageMinutesFromTimestamp(base.timestamp) ?? 0;
//     const status = base.status ?? '';

//     // your card mentions >30m and >2h thresholds
//     const isStuck = !isDoneStatus(status) && age >= 30;

//     if (isStuck) {
//       out.push({
//         timestamp: base.timestamp ?? '',
//         fullName: base.fullName ?? '',
//         phone: base.phone ?? '',
//         ref: ref ?? '',
//         carParkBay: base.carParkBay ?? '',
//         status,
//         type,
//         ageMinutes: age,
//         reason: age >= 120 ? 'Over 2 hours' : 'Over 30 mins',
//       });
//     }
//   };

//   (data.recentPickups ?? []).forEach((r) => add(r, 'pickup', r.orderNumber));
//   (data.recentReturns ?? []).forEach((r) => add(r, 'return', r.rmaID));
//   (data.recentParts ?? []).forEach((r) => add(r, 'parts', r.orderNumber));

//   return out.sort((a, b) => b.ageMinutes - a.ageMinutes).slice(0, 100);
// }, [data.recentPickups, data.recentReturns, data.recentParts]);


// const missingPanelItems = useMemo(() => {
//   const rows = (data.missingInvalidRows ?? []) as any[];

//   return rows.map((r) => ({
//     timestamp: r.timestamp ?? '',
//     fullName: r.fullName ?? '',
//     phone: r.phone ?? '',
//     ref: r.ref ?? r.refId ?? r.orderNumber ?? '',
//     paymentMethod: r.paymentMethod ?? '—',
//     carParkBay: r.carParkBay ?? '—',
//     status: r.status ?? '—',
//     type: r.type ?? 'pickup',
//     missing: (r.missing ?? r.issues ?? []) as string[],
//   }));
// }, [data.missingInvalidRows]);

// const duplicatePanelGroups = useMemo(() => {
//   // Your DuplicatesPanel expects groups: { key, count, sample[] }
//   // Your API provides duplicateRows (different shape), so build groups.
//   const rows = (data.duplicateGroups ?? []) as any[];

//   // If your API already provides { key, count, sample } then just return it:
//   if (rows.length && rows[0]?.sample && rows[0]?.key) return rows as any[];

//   // Otherwise group by a key (best effort)
//   const map = new Map<string, any[]>();

//   for (const r of rows) {
//     const key = String(r.key ?? `${r.type ?? 'item'}:${r.refId ?? r.ref ?? 'unknown'}`);
//     const sampleItem = {
//       timestamp: r.latestTimestamp ?? r.timestamp ?? '',
//       fullName: r.fullName ?? '',
//       phone: r.phone ?? '',
//       ref: r.ref ?? r.refId ?? '',
//       status: r.latestStatus ?? r.status ?? '',
//       type: r.type ?? 'item',
//     };

//     if (!map.has(key)) map.set(key, []);
//     map.get(key)!.push(sampleItem);
//   }

//   return [...map.entries()].map(([key, sample]) => ({
//     key,
//     count: sample.length,
//     sample: sample.slice(0, 8),
//   }));
// }, [data.duplicateGroups]);


//   return (
//     <div className="min-h-screen bg-gray-50">
//       <DashboardHeader
//         query={query}
//         onQueryChange={setQuery}
//         autoRefresh={autoRefresh}
//         onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
//         onRefresh={load}
//         error={error}
//       />

//       <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
//         {/* Top stats */}
//         <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
//           <DashboardStatCard
//             title="Pick Up Orders"
//             value={loading ? '—' : data.ordersPickedUpToday}
//             subtitle={loading ? 'Loading…' : `Today • Total ${data.ordersPickedUpTotal}`}
//             icon={<ShoppingCart className="h-5 w-5" />}
//           />

//           <DashboardStatCard
//             title="Returned Items"
//             value={loading ? '—' : data.returnItemsReceivedToday}
//             subtitle={loading ? 'Loading…' : `Today • Total ${data.returnItemsReceivedTotal}`}
//             icon={<PackageCheck className="h-5 w-5" />}
//           />

//           <DashboardStatCard
//             title="Parts Assistance"
//             value={loading ? '—' : data.partsCompletedToday}
//             subtitle={loading ? 'Loading…' : `Today • Total ${data.partsCompletedTotal}`}
//             icon={<Wrench className="h-5 w-5" />}
//           />

//           <DashboardStatCard
//             title="Customers"
//             value={loading ? '—' : data.uniqueCustomersToday}
//             subtitle={loading ? 'Loading…' : `Today • Total ${data.uniqueCustomersTotal}`}
//             icon={<Users className="h-5 w-5" />}
//           />

//           <DashboardStatCard
//             title="Last Updated"
//             value={loading ? '—' : 'Just now'}
//             subtitle={autoRefresh ? 'Every 30 seconds' : 'Manual'}
//             icon={<RefreshCw className="h-5 w-5" />}
//           />
//         </div>

//         {/* Clickable widget cards */}
//         <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
//           <button
//             type="button"
//             onClick={() => toggleWidget('stuck')}
//             aria-expanded={activeWidget === 'stuck'}
//             className="text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 hover:opacity-95"
//           >
//             <DashboardStatCard
//               title="Stuck / Aging Orders"
//               value={loading ? '—' : stuck ? stuck.stuckCount : '—'}
//               subtitle={
//                 loading
//                   ? 'Loading…'
//                   : stuck
//                     ? `>30m: ${stuck.agingOver30m} • >2h: ${stuck.agingOver2h}`
//                     : 'Requires API (pending statuses)'
//               }
//               icon={<AlertTriangle className="h-5 w-5" />}
//             />
//           </button>

//           <button
//             type="button"
//             onClick={() => toggleWidget('missing')}
//             aria-expanded={activeWidget === 'missing'}
//             className="text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 hover:opacity-95"
//           >
//             <DashboardStatCard
//               title="Missing / Invalid Data"
//               value={loading ? '—' : quality.missingCount + quality.invalidCount}
//               subtitle={
//                 loading
//                   ? 'Loading…'
//                   : `Missing: ${quality.missingCount} • Invalid: ${quality.invalidCount}`
//               }
//               icon={<ScanSearch className="h-5 w-5" />}
//             />
//           </button>

//           <button
//             type="button"
//             onClick={() => toggleWidget('duplicates')}
//             aria-expanded={activeWidget === 'duplicates'}
//             className="text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 hover:opacity-95"
//           >
//             <DashboardStatCard
//               title="Duplicate Alerting"
//               value={loading ? '—' : duplicates.duplicateCount}
//               subtitle={
//                 loading
//                   ? 'Loading…'
//                   : duplicates.duplicateCount
//                     ? 'Potential duplicates detected'
//                     : 'No duplicates detected'
//               }
//               icon={<Copy className="h-5 w-5" />}
//             />
//           </button>

//           <button
//             type="button"
//             onClick={() => toggleWidget('funnel')}
//             aria-expanded={activeWidget === 'funnel'}
//             className="text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 hover:opacity-95"
//           >
//             <DashboardStatCard
//               title="Today vs Total Funnel"
//               value={loading ? '—' : todayFunnelRate !== null ? `${todayFunnelRate}%` : '—'}
//               subtitle={
//                 loading
//                   ? 'Loading…'
//                   : todayFunnelRate !== null
//                     ? `Today: ${funnelTodayCompleted}/${funnelTodayStarted} • Total: ${totalFunnelRate ?? '—'}%`
//                     : `Today completed: ${funnelTodayCompleted} • (needs API for started)`
//               }
//               icon={<TrendingUp className="h-5 w-5" />}
//             />
//           </button>
//         </div>

//         {/* Drill-down panels (rendered when a card is clicked) */}
//         <div className="mt-6 space-y-6">
//           {activeWidget === 'stuck' && (
//             <StuckOrdersPanel
//               items={stuckPanelItems}
//               summaryCount={data.stuckAging?.stuckCount ?? 0}
//               debug={true}
//             />
//           )}



//           {activeWidget === 'missing' && (
//             <MissingDataPanel items={missingPanelItems} />
//           )}

//           {activeWidget === 'duplicates' && (
//             <DuplicatesPanel groups={duplicatePanelGroups} />
//           )}

//           {activeWidget === 'funnel' && (
//             <TodayVsTotalFunnelPanel
//               today={data.successFunnel?.today ?? {
//                 started: funnelTodayStarted,
//                 completed: funnelTodayCompleted,
//               }}
//               total={data.successFunnel?.total ?? {
//                 started: funnelTotalStarted,
//                 completed: funnelTotalCompleted,
//               }}
//             />
//           )}
//         </div>

//         {/* Existing tables */}
//         <div className="mt-6 space-y-6">
//           <SectionShell
//             title="Recent Pickups"
//             subtitle='Latest "Order Collected" rows from MASTER LIST'
//             right={
//               <div className="text-xs text-gray-500">
//                 {queryNorm ? `Filtered: ${pickups.length}` : `Rows: ${pickups.length}`}
//               </div>
//             }
//           >
//             <DataTable
//               loading={loading}
//               rows={pickups}
//               columns={pickupCols}
//               emptyText="No pickups found yet."
//               minWidthClass="min-w-[880px]"
//             />
//           </SectionShell>

//           <SectionShell
//             title="Recent Returns"
//             subtitle='Latest "Item Received" rows from MASTER LIST'
//             right={
//               <div className="text-xs text-gray-500">
//                 {queryNorm ? `Filtered: ${returns.length}` : `Rows: ${returns.length}`}
//               </div>
//             }
//           >
//             <DataTable
//               loading={loading}
//               rows={returns}
//               columns={returnCols}
//               emptyText="No returns found yet."
//               minWidthClass="min-w-[760px]"
//             />
//           </SectionShell>

//           <SectionShell
//             title="Recent Parts Assistance"
//             subtitle="Latest completed Parts Assistance rows from MASTER LIST"
//             right={
//               <div className="text-xs text-gray-500">
//                 {queryNorm ? `Filtered: ${parts.length}` : `Rows: ${parts.length}`}
//               </div>
//             }
//           >
//             <DataTable
//               loading={loading}
//               rows={parts}
//               columns={partsCols}
//               emptyText="No parts records found yet."
//               minWidthClass="min-w-[760px]"
//             />
//           </SectionShell>

//           <div className="text-xs text-gray-400">{headerTime}</div>
//         </div>
//       </div>
//     </div>
//   );
// }


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

import TodayVsTotalFunnelPanel from '@/app/components/(admin)/Funnel';
import DuplicatesPanel from '@/app/components/(admin)/DuplicatesPanel';
import MissingDataPanel from '@/app/components/(admin)/MissingDataPanel';
import StuckOrdersPanel from '@/app/components/(admin)/StuckOrdersPanel';

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

/** Panel drilldown shapes (match your panel components) */
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

  // widgets
  stuckAging?: StuckAgingSummary;
  dataQuality?: DataQualitySummary;
  duplicates?: DuplicateSummary;
  successFunnel?: FunnelSummary;

  // drilldowns from API (THIS is what fixes your empty panels)
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

  if (!res.ok || !json?.success) {
    throw new Error(json?.error || 'Failed to load kiosk metrics');
  }

  return json.data as MetricsResponse;
}

/** ---------- helpers (fallback computations) ---------- */

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
    if (r.orderNumber?.trim() && !isLikelyOrderNumber(r.orderNumber))
      (invalid++, bump('Pickup: invalid orderNumber'));
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
    if (r.orderNumber?.trim() && !isLikelyOrderNumber(r.orderNumber))
      (invalid++, bump('Parts: invalid orderNumber'));
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

/** Which drilldown is currently open */
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

    useEffect(() => {
      setMounted(true);
    }, []);


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
  };

  useEffect(() => {
    load();

    if (!autoRefresh) return;

    const interval = setInterval(() => load(), 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  // Optional: close panel when searching/filtering
  useEffect(() => {
    setActiveWidget(null);
  }, [queryNorm]);

  const pickups = useMemo(() => {
    const list = data.recentPickups ?? [];
    if (!queryNorm) return list;
    return list.filter((r) =>
      [r.timestamp, r.fullName, r.phone, r.orderNumber, r.paymentMethod, r.carParkBay, r.status]
        .join(' ')
        .toLowerCase()
        .includes(queryNorm)
    );
  }, [data.recentPickups, queryNorm]);

  const returns = useMemo(() => {
    const list = data.recentReturns ?? [];
    if (!queryNorm) return list;
    return list.filter((r) =>
      [r.timestamp, r.fullName, r.phone, r.rmaID, r.carParkBay, r.status]
        .join(' ')
        .toLowerCase()
        .includes(queryNorm)
    );
  }, [data.recentReturns, queryNorm]);

  const parts = useMemo(() => {
    const list = data.recentParts ?? [];
    if (!queryNorm) return list;
    return list.filter((r) =>
      [r.timestamp, r.fullName, r.phone, r.orderNumber, r.carParkBay, r.status]
        .join(' ')
        .toLowerCase()
        .includes(queryNorm)
    );
  }, [data.recentParts, queryNorm]);

  // Fallback computations if API doesn’t provide them yet
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

  // Funnel fallback: show completed totals even if started isn’t present
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

  /** ✅ DRILLDOWN ITEMS (NOW USING API OUTPUT DIRECTLY) */
  const stuckPanelItems = useMemo(() => (data.stuckOrders ?? []) as StuckItem[], [data.stuckOrders]);

  const missingPanelItems = useMemo(() => (data.missingInvalidRows ?? []) as MissingItem[], [data.missingInvalidRows]);

  const duplicatePanelGroups = useMemo(
    () => (data.duplicateGroups ?? []) as DuplicateGroup[],
    [data.duplicateGroups]
  );

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
                loading
                  ? 'Loading…'
                  : stuck
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
                loading
                  ? 'Loading…'
                  : duplicates.duplicateCount
                    ? 'Duplicates detected'
                    : 'No duplicates detected'
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
                loading
                  ? 'Loading…'
                  : todayFunnelRate !== null
                    ? `Today: ${funnelTodayCompleted}/${funnelTodayStarted} • Total: ${totalFunnelRate ?? '—'}%`
                    : `Today completed: ${funnelTodayCompleted}`
              }
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </button>
        </div>

        {/* Drill-down panels */}
        <div className="mt-6 space-y-6">
          {activeWidget === 'stuck' && <StuckOrdersPanel items={stuckPanelItems} />}
          {activeWidget === 'missing' && <MissingDataPanel items={missingPanelItems} />}
          {activeWidget === 'duplicates' && <DuplicatesPanel groups={duplicatePanelGroups} />}
          {activeWidget === 'funnel' && (
            <TodayVsTotalFunnelPanel
              today={data.successFunnel?.today ?? { started: funnelTodayStarted, completed: funnelTodayCompleted }}
              total={data.successFunnel?.total ?? { started: funnelTotalStarted, completed: funnelTotalCompleted }}
            />
          )}
        </div>

        {/* Existing tables */}
        <div className="mt-6 space-y-6">
          <SectionShell
            title="Recent Pickups"
            subtitle='Latest "Order Collected" rows from MASTER LIST'
            right={<div className="text-xs text-gray-500">{queryNorm ? `Filtered: ${pickups.length}` : `Rows: ${pickups.length}`}</div>}
          >
            <DataTable
              loading={loading}
              rows={pickups}
              columns={pickupCols}
              emptyText="No pickups found yet."
              minWidthClass="min-w-[880px]"
            />
          </SectionShell>

          <SectionShell
            title="Recent Returns"
            subtitle='Latest "Item Received" rows from MASTER LIST'
            right={<div className="text-xs text-gray-500">{queryNorm ? `Filtered: ${returns.length}` : `Rows: ${returns.length}`}</div>}
          >
            <DataTable
              loading={loading}
              rows={returns}
              columns={returnCols}
              emptyText="No returns found yet."
              minWidthClass="min-w-[760px]"
            />
          </SectionShell>

          <SectionShell
            title="Recent Parts Assistance"
            subtitle="Latest completed Parts Assistance rows from MASTER LIST"
            right={<div className="text-xs text-gray-500">{queryNorm ? `Filtered: ${parts.length}` : `Rows: ${parts.length}`}</div>}
          >
            <DataTable
              loading={loading}
              rows={parts}
              columns={partsCols}
              emptyText="No parts records found yet."
              minWidthClass="min-w-[760px]"
            />
          </SectionShell>

          <div className="text-xs text-gray-400">
            {mounted ? headerTime : '—'}
          </div>

        </div>
      </div>
    </div>
  );
}
