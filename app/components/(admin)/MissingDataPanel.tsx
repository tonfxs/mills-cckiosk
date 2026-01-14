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

export default function MissingDataPanel({ items }: { items: MissingItem[] }) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="p-5 border-b">
        <h3 className="font-semibold text-gray-900">Missing Data Detector</h3>
        <p className="text-sm text-gray-500">Rows that may break handling or verification</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
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
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr className="border-t">
                <td className="px-5 py-4 text-gray-500" colSpan={9}>
                  No missing-data rows found.
                </td>
              </tr>
            ) : (
              items.map((r, i) => (
                <tr key={`${r.type}-${r.ref}-${i}`} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700">{r.type}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{r.ref || "—"}</td>
                  <td className="px-5 py-3 text-gray-700">{r.fullName || "—"}</td>
                  <td className="px-5 py-3 text-gray-700">{r.phone || "—"}</td>
                  <td className="px-5 py-3 text-gray-700">{r.carParkBay || "—"}</td>
                  <td className="px-5 py-3 text-gray-700">{r.paymentMethod || "—"}</td>
                  <td className="px-5 py-3 text-gray-700">{r.status || "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.missing.map((m) => (
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
