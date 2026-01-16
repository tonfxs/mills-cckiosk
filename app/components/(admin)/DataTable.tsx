import StatusPill from './StatusPill';

export type Column<T> = {
  header: string;
  accessor: (row: T) => React.ReactNode;
  strong?: boolean;     // bold text
  pill?: boolean;       // render in a green pill
  minWidth?: number;    // per-column min width (px)
};

export default function DataTable<T>({
  loading,
  rows,
  columns,
  emptyText,
  minWidthClass,
}: {
  loading: boolean;
  rows: T[];
  columns: Column<T>[];
  emptyText: string;
  minWidthClass?: string; // e.g. "min-w-[880px]"
}) {
  const colSpan = columns.length;

  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-sm ${minWidthClass ?? ''}`}>
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            {columns.map((c) => (
              <th
                key={c.header}
                className="px-4 sm:px-5 py-3 font-medium"
                style={c.minWidth ? { minWidth: c.minWidth } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td className="px-4 sm:px-5 py-4 text-gray-500" colSpan={colSpan}>
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td className="px-4 sm:px-5 py-4 text-gray-500" colSpan={colSpan}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                {columns.map((c) => {
                  const value = c.accessor(row);
                  return (
                    <td key={c.header} className="px-4 sm:px-5 py-3 text-gray-700">
                      {c.pill ? (
                        <StatusPill status={typeof value === 'string' ? value : ''}></StatusPill>
                      ) : c.strong ? (
                        <span className="font-medium text-gray-900">{value}</span>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
