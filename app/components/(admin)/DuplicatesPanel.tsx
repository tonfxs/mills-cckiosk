type DuplicateGroup = {
  key: string;
  count: number;
  sample: { timestamp: string; fullName: string; phone: string; ref: string; status: string; type: string }[];
};

export default function DuplicatesPanel({ groups }: { groups: DuplicateGroup[] }) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="p-5 border-b">
        <h3 className="font-semibold text-gray-900">Duplicate Alerting</h3>
        <p className="text-sm text-gray-500">Possible double submits or repeated entries</p>
      </div>

      <div className="p-5 space-y-4">
        {groups.length === 0 ? (
          <div className="text-sm text-gray-500">No duplicate groups found.</div>
        ) : (
          groups.map((g) => (
            <div key={g.key} className="rounded-xl border bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-gray-900 break-all">{g.key}</div>
                <span className="rounded-full border bg-white px-2 py-0.5 text-xs font-semibold text-gray-700">
                  {g.count} items
                </span>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="py-2 text-left font-medium">Time</th>
                      <th className="py-2 text-left font-medium">Type</th>
                      <th className="py-2 text-left font-medium">Ref</th>
                      <th className="py-2 text-left font-medium">Name</th>
                      <th className="py-2 text-left font-medium">Phone</th>
                      <th className="py-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.sample.map((s, idx) => (
                      <tr key={`${g.key}-${idx}`} className="border-t">
                        <td className="py-2 text-gray-500">{s.timestamp}</td>
                        <td className="py-2 text-gray-700">{s.type}</td>
                        <td className="py-2 font-medium text-gray-900">{s.ref}</td>
                        <td className="py-2 text-gray-700">{s.fullName}</td>
                        <td className="py-2 text-gray-700">{s.phone}</td>
                        <td className="py-2 text-gray-700">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
