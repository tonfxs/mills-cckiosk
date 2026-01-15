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

type Props = {
  items?: StuckItem[];
  /** optional: pass the card count so panel can explain mismatch */
  summaryCount?: number;
  /** optional: show quick debug line while developing */
  debug?: boolean;
};

export default function StuckOrdersPanel({
  items = [],
  summaryCount,
  debug = false,
}: Props) {
  const hasMismatch =
    typeof summaryCount === 'number' && summaryCount > 0 && items.length === 0;

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="p-5 border-b">
        <h3 className="font-semibold text-gray-900">Stuck / Aging Orders</h3>
        <p className="text-sm text-gray-500">Top items exceeding your SLA thresholds</p>

        {debug ? (
          <div className="mt-2 text-xs text-gray-400">
            Debug: items={items.length}
            {typeof summaryCount === 'number' ? ` • summaryCount=${summaryCount}` : ''}
          </div>
        ) : null}

        {hasMismatch ? (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            The summary shows <b>{summaryCount}</b> stuck/aging items, but the drill-down list is empty.
            This usually means your API is returning only the summary count (stuckCount) but not the
            actual stuck rows, or the panel is being fed from a different data source.
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Age</th>
              <th className="px-5 py-3 text-left font-medium">Reason</th>
              <th className="px-5 py-3 text-left font-medium">Type</th>
              <th className="px-5 py-3 text-left font-medium">Ref</th>
              <th className="px-5 py-3 text-left font-medium">Name</th>
              <th className="px-5 py-3 text-left font-medium">Phone</th>
              <th className="px-5 py-3 text-left font-medium">Bay</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr className="border-t">
                <td className="px-5 py-4 text-gray-500" colSpan={9}>
                  No stuck items found.
                </td>
              </tr>
            ) : (
              items.map((r, i) => (
                <tr key={`${r.type}-${r.ref}-${i}`} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {Number.isFinite(r.ageMinutes) ? `${r.ageMinutes}m` : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-700">{r.reason || '—'}</td>
                  <td className="px-5 py-3 text-gray-700">{r.type || '—'}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{r.ref || '—'}</td>
                  <td className="px-5 py-3 text-gray-700">{r.fullName || '—'}</td>
                  <td className="px-5 py-3 text-gray-700">{r.phone || '—'}</td>
                  <td className="px-5 py-3 text-gray-700">{r.carParkBay || '—'}</td>
                  <td className="px-5 py-3 text-gray-700">{r.status || '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{r.timestamp || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
